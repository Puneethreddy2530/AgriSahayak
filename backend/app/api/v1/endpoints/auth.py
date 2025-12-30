"""
Authentication Module for AgriSahayak
OTP-based phone login with JWT tokens
Roles: Farmer, Admin
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict
import random
import os

router = APIRouter()
security = HTTPBearer()

# ==================================================
# CONFIGURATION
# ==================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "agrisahayak-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
OTP_EXPIRE_MINUTES = 10

# Password hashing (for admin accounts)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================================================
# MODELS
# ==================================================
class OTPRequest(BaseModel):
    """Request OTP for login"""
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number")


class OTPVerify(BaseModel):
    """Verify OTP and get token"""
    phone: str
    otp: str = Field(..., min_length=4, max_length=6)


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
    role: str = "farmer"


# ==================================================
# IN-MEMORY OTP STORE (Use Redis in production)
# ==================================================
OTP_STORE: Dict[str, Dict] = {}

# Demo admin accounts
ADMIN_ACCOUNTS = {
    "9999999999": {"name": "Admin User", "role": "admin", "password_hash": pwd_context.hash("admin123")}
}


# ==================================================
# OTP FUNCTIONS
# ==================================================
def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))


def store_otp(phone: str, otp: str):
    """Store OTP with expiry"""
    OTP_STORE[phone] = {
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=OTP_EXPIRE_MINUTES),
        "attempts": 0
    }


def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP"""
    if phone not in OTP_STORE:
        return False
    
    stored = OTP_STORE[phone]
    
    # Check expiry
    if datetime.now() > stored["expires_at"]:
        del OTP_STORE[phone]
        return False
    
    # Check attempts (max 3)
    if stored["attempts"] >= 3:
        del OTP_STORE[phone]
        return False
    
    stored["attempts"] += 1
    
    if stored["otp"] == otp:
        del OTP_STORE[phone]
        return True
    
    return False


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
# ENDPOINTS
# ==================================================
@router.post("/request-otp")
async def request_otp(request: OTPRequest):
    """
    Request OTP for phone login.
    
    In production: Send OTP via SMS (Twilio/AWS SNS)
    For demo: OTP is returned in response (remove in prod!)
    """
    phone = request.phone.strip()
    
    # Validate Indian phone number
    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number. Use 10 digits.")
    
    # Generate and store OTP
    otp = generate_otp()
    store_otp(phone, otp)
    
    # In production, integrate with Twilio/SNS here
    logger.info(f"Sending OTP to {phone}: {otp}")
    
    return {
        "message": "OTP sent successfully",
        "phone": f"******{phone[-4:]}",
        "expires_in_minutes": OTP_EXPIRE_MINUTES,
        # DEMO ONLY - Remove in production!
        "demo_otp": otp
    }


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_login(request: OTPVerify):
    """
    Verify OTP and get JWT token.
    Creates new farmer account if first login.
    """
    phone = request.phone.strip()
    
    if not verify_otp(phone, request.otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Check if admin
    if phone in ADMIN_ACCOUNTS:
        user_data = {
            "phone": phone,
            "name": ADMIN_ACCOUNTS[phone]["name"],
            "role": "admin"
        }
    else:
        # Regular farmer - would fetch/create from database
        user_data = {
            "phone": phone,
            "farmer_id": f"F{phone[-6:]}",  # Demo ID
            "name": None,  # Will be set after registration
            "role": "farmer"
        }
    
    # Create token
    token = create_access_token(user_data)
    
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_data
    )


@router.get("/me")
async def get_current_user_info(user: UserInfo = Depends(get_current_user)):
    """Get current logged-in user info"""
    return {
        "farmer_id": user.farmer_id,
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


# ==================================================
# ADMIN ENDPOINTS
# ==================================================
@router.get("/admin/users")
async def list_users(user: UserInfo = Depends(require_role("admin"))):
    """Admin: List all users (requires admin role)"""
    # Would fetch from database in production
    return {
        "message": "Admin endpoint",
        "admin": user.name,
        "users": []  # Fetch from DB
    }


# ==================================================
# HELPER FUNCTION FOR OTHER ENDPOINTS
# ==================================================
def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[UserInfo]:
    """Optional authentication - returns None if not authenticated"""
    if not credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
