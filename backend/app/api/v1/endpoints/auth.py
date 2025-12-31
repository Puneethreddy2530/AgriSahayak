"""
Authentication Module for AgriSahayak
OTP-based phone login with JWT tokens + Username/Password
BACKEND AS SOURCE OF TRUTH - Frontend uses these APIs
Roles: Farmer, Admin
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
import random
import os
import logging

from app.db.database import get_db
from app.db import crud
from app.db.models import Farmer, OTPStore

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# ==================================================
# CONFIGURATION
# ==================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "agrisahayak-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
OTP_EXPIRE_MINUTES = 10

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================================================
# PYDANTIC MODELS
# ==================================================
class OTPRequest(BaseModel):
    """Request OTP for login"""
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number")


class OTPVerify(BaseModel):
    """Verify OTP and get token"""
    phone: str
    otp: str = Field(..., min_length=4, max_length=6)


class UsernamePasswordLogin(BaseModel):
    """Username/Password login (alternative to OTP)"""
    username: str = Field(..., min_length=4)
    password: str = Field(..., min_length=6)


class UsernamePasswordRegister(BaseModel):
    """Register with username/password"""
    name: str = Field(..., min_length=2)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    username: str = Field(..., min_length=4, max_length=50)
    password: str = Field(..., min_length=6)
    state: str
    district: str
    language: str = "hi"


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict


class UserInfo(BaseModel):
    """User information from token"""
    farmer_id: Optional[str] = None
    phone: str
    name: Optional[str] = None
    username: Optional[str] = None
    role: str = "farmer"


# ==================================================
# DATABASE OTP FUNCTIONS
# ==================================================
def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))


def store_otp_db(db: Session, phone: str, otp: str):
    """Store OTP in database with expiry"""
    # Delete any existing OTP for this phone
    db.query(OTPStore).filter(OTPStore.phone == phone).delete()
    
    otp_record = OTPStore(
        phone=phone,
        otp=otp,
        expires_at=datetime.now() + timedelta(minutes=OTP_EXPIRE_MINUTES),
        attempts=0
    )
    db.add(otp_record)
    db.commit()


def verify_otp_db(db: Session, phone: str, otp: str) -> bool:
    """Verify OTP from database"""
    record = db.query(OTPStore).filter(OTPStore.phone == phone).first()
    
    if not record:
        return False
    
    # Check expiry
    if datetime.now() > record.expires_at:
        db.delete(record)
        db.commit()
        return False
    
    # Check attempts (max 3)
    if record.attempts >= 3:
        db.delete(record)
        db.commit()
        return False
    
    record.attempts += 1
    db.commit()
    
    if record.otp == otp:
        db.delete(record)
        db.commit()
        return True
    
    return False


# ==================================================
# PASSWORD FUNCTIONS
# ==================================================
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ==================================================
# JWT FUNCTIONS
# ==================================================
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[Dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
    """FastAPI dependency to get current user from token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return UserInfo(
        farmer_id=payload.get("farmer_id"),
        phone=payload.get("phone"),
        name=payload.get("name"),
        username=payload.get("username"),
        role=payload.get("role", "farmer")
    )


def require_role(required_role: str):
    """Dependency factory for role-based access"""
    def role_checker(user: UserInfo = Depends(get_current_user)):
        if user.role != required_role and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return user
    return role_checker


# ==================================================
# ENDPOINTS - DATABASE PERSISTED
# ==================================================
@router.post("/register")
async def register_with_password(request: UsernamePasswordRegister, db: Session = Depends(get_db)):
    """
    Register a new farmer with username/password. PERSISTED TO DATABASE.
    This is the primary registration method.
    """
    # Check if phone already registered
    existing_phone = crud.get_farmer_by_phone(db, request.phone)
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Check if username taken
    existing_username = db.query(Farmer).filter(Farmer.username == request.username.lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create farmer with hashed password
    farmer = crud.create_farmer(
        db=db,
        name=request.name,
        phone=request.phone,
        state=request.state,
        district=request.district,
        language=request.language
    )
    
    # Update with auth fields
    farmer.username = request.username.lower()
    farmer.password_hash = hash_password(request.password)
    farmer.role = "farmer"
    db.commit()
    db.refresh(farmer)
    
    # Create token
    user_data = {
        "farmer_id": farmer.farmer_id,
        "phone": farmer.phone,
        "name": farmer.name,
        "username": farmer.username,
        "role": "farmer"
    }
    token = create_access_token(user_data)
    
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_data
    )


@router.post("/login")
async def login_with_password(request: UsernamePasswordLogin, db: Session = Depends(get_db)):
    """
    Login with username/password. FROM DATABASE.
    Supports both username and phone number as identifier.
    """
    identifier = request.username.lower().strip()
    
    # Find user by username or phone
    farmer = db.query(Farmer).filter(
        (Farmer.username == identifier) | (Farmer.phone == identifier)
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not farmer.password_hash:
        raise HTTPException(status_code=401, detail="Password not set. Please register first.")
    
    if not verify_password(request.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Create token
    user_data = {
        "farmer_id": farmer.farmer_id,
        "phone": farmer.phone,
        "name": farmer.name,
        "username": farmer.username,
        "role": farmer.role or "farmer"
    }
    token = create_access_token(user_data)
    
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_data
    )


@router.post("/request-otp")
async def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """
    Request OTP for phone login. PERSISTED TO DATABASE.
    
    In production: Send OTP via SMS (Twilio/AWS SNS)
    For demo: OTP is returned in response (remove in prod!)
    """
    phone = request.phone.strip()
    
    # Validate Indian phone number
    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number. Use 10 digits.")
    
    # Generate and store OTP in database
    otp = generate_otp()
    store_otp_db(db, phone, otp)
    
    # In production, integrate with Twilio/SNS here
    logger.info(f"OTP requested for {phone[-4:]}: {otp}")
    
    return {
        "message": "OTP sent successfully",
        "phone": f"******{phone[-4:]}",
        "expires_in_minutes": OTP_EXPIRE_MINUTES,
        # DEMO ONLY - Remove in production!
        "demo_otp": otp
    }


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_login(request: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify OTP and get JWT token. FROM DATABASE.
    Creates new farmer account if first login.
    """
    phone = request.phone.strip()
    
    if not verify_otp_db(db, phone, request.otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Find or create farmer
    farmer = crud.get_farmer_by_phone(db, phone)
    
    if farmer:
        user_data = {
            "farmer_id": farmer.farmer_id,
            "phone": farmer.phone,
            "name": farmer.name,
            "username": farmer.username,
            "role": farmer.role or "farmer"
        }
    else:
        # New farmer - create minimal profile (needs to complete registration)
        user_data = {
            "phone": phone,
            "farmer_id": None,
            "name": None,
            "username": None,
            "role": "farmer",
            "needs_registration": True
        }
    
    # Create token
    token = create_access_token(user_data)
    
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_data
    )


@router.get("/me")
async def get_current_user_info(
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current logged-in user info - FROM DATABASE"""
    if user.farmer_id:
        farmer = crud.get_farmer_by_id(db, user.farmer_id)
        if farmer:
            return {
                "farmer_id": farmer.farmer_id,
                "phone": farmer.phone,
                "name": farmer.name,
                "username": farmer.username,
                "role": farmer.role or "farmer",
                "state": farmer.state,
                "district": farmer.district,
                "language": farmer.language,
                "is_authenticated": True,
                "lands_count": len(farmer.lands)
            }
    
    return {
        "phone": user.phone,
        "name": user.name,
        "role": user.role,
        "is_authenticated": True
    }


@router.post("/logout")
async def logout(user: UserInfo = Depends(get_current_user)):
    """
    Logout user (client should discard token).
    For stateless JWT, we just acknowledge logout.
    """
    return {"message": "Logged out successfully", "phone": user.phone}


@router.get("/verify-token")
async def verify_token(user: UserInfo = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"valid": True, "user": user}


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password - PERSISTED TO DATABASE"""
    if not user.farmer_id:
        raise HTTPException(status_code=400, detail="User not registered")
    
    farmer = crud.get_farmer_by_id(db, user.farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not farmer.password_hash:
        raise HTTPException(status_code=400, detail="Password not set")
    
    if not verify_password(old_password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect old password")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    farmer.password_hash = hash_password(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ==================================================
# ADMIN ENDPOINTS
# ==================================================
@router.get("/admin/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    user: UserInfo = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: List all users - FROM DATABASE (requires admin role)"""
    farmers = crud.get_farmers(db, skip=skip, limit=limit)
    return {
        "total": len(farmers),
        "users": [
            {
                "farmer_id": f.farmer_id,
                "name": f.name,
                "phone": f.phone,
                "username": f.username,
                "state": f.state,
                "district": f.district,
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "lands_count": len(f.lands)
            }
            for f in farmers
        ]
    }


# ==================================================
# HELPER DEPENDENCY FOR OPTIONAL AUTH
# ==================================================
def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[UserInfo]:
    """Optional authentication - returns None if not authenticated"""
    if not credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
