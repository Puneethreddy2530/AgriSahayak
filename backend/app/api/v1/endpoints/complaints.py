"""
Complaints Module for AgriSahayak
Farmers submit complaints, Admin reviews and resolves them
DATABASE PERSISTED - Real multi-user support
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string

from app.db.database import get_db
from app.db.models import Complaint, Farmer
from app.api.v1.endpoints.auth import get_current_user, UserInfo

router = APIRouter()


# ==================================================
# PYDANTIC MODELS
# ==================================================
class ComplaintCreate(BaseModel):
    """Create a new complaint"""
    category: str = Field(..., description="Complaint category")
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    urgency: str = Field(default="low", description="low, medium, high, critical")
    photo: Optional[str] = None  # Base64 encoded image


class ComplaintUpdate(BaseModel):
    """Admin updates complaint status/response"""
    status: Optional[str] = None  # pending, in-progress, resolved, rejected
    admin_response: Optional[str] = None
    resolved_by: Optional[str] = None


class ComplaintResponse(BaseModel):
    """Complaint data returned to frontend"""
    id: str
    farmerId: str
    farmerName: str
    farmerPhone: str
    farmerDistrict: str
    farmerState: str
    farmerProfilePic: Optional[str] = None
    category: str
    subject: str
    description: str
    urgency: str
    status: str
    adminResponse: Optional[str] = None
    resolvedBy: Optional[str] = None
    resolvedAt: Optional[str] = None
    createdAt: str
    
    class Config:
        from_attributes = True


# ==================================================
# HELPER FUNCTIONS
# ==================================================
def generate_complaint_id() -> str:
    """Generate unique complaint ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"CMP{timestamp}{random_suffix}"


def complaint_to_response(complaint: Complaint) -> dict:
    """Convert SQLAlchemy model to response dict"""
    farmer = complaint.farmer
    return {
        "id": complaint.complaint_id,
        "farmerId": farmer.farmer_id if farmer else None,
        "farmerName": farmer.name if farmer else "Unknown",
        "farmerPhone": farmer.phone if farmer else "",
        "farmerDistrict": farmer.district if farmer else "",
        "farmerState": farmer.state if farmer else "",
        "farmerProfilePic": None,  # Add profile pic field to Farmer model if needed
        "category": complaint.category,
        "subject": complaint.subject,
        "description": complaint.description,
        "urgency": complaint.urgency,
        "status": complaint.status,
        "adminResponse": complaint.admin_response,
        "resolvedBy": complaint.resolved_by,
        "resolvedAt": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
        "createdAt": complaint.created_at.isoformat() if complaint.created_at else datetime.now().isoformat()
    }


# ==================================================
# FARMER ENDPOINTS
# ==================================================
@router.post("/", response_model=dict)
async def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Submit a new complaint. PERSISTED TO DATABASE.
    Requires authenticated farmer.
    """
    # Get farmer from database
    farmer = db.query(Farmer).filter(Farmer.farmer_id == current_user.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Validate category
    valid_categories = ['water', 'seeds', 'fertilizer', 'pests', 'market', 'subsidy', 'land', 'equipment', 'other']
    if complaint.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    # Validate urgency
    valid_urgencies = ['low', 'medium', 'high', 'critical']
    if complaint.urgency not in valid_urgencies:
        raise HTTPException(status_code=400, detail=f"Invalid urgency. Must be one of: {valid_urgencies}")
    
    # Create complaint
    new_complaint = Complaint(
        complaint_id=generate_complaint_id(),
        farmer_id=farmer.id,
        category=complaint.category,
        subject=complaint.subject,
        description=complaint.description,
        urgency=complaint.urgency,
        status="pending",
        photo=complaint.photo
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    return {
        "success": True,
        "message": "Complaint submitted successfully",
        "complaint": complaint_to_response(new_complaint)
    }


@router.get("/my", response_model=List[dict])
async def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Get all complaints submitted by the current farmer.
    """
    farmer = db.query(Farmer).filter(Farmer.farmer_id == current_user.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    complaints = db.query(Complaint).filter(
        Complaint.farmer_id == farmer.id
    ).order_by(Complaint.created_at.desc()).all()
    
    return [complaint_to_response(c) for c in complaints]


@router.get("/{complaint_id}", response_model=dict)
async def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Get a specific complaint by ID.
    """
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check ownership (or admin)
    farmer = db.query(Farmer).filter(Farmer.farmer_id == current_user.farmer_id).first()
    if complaint.farmer_id != farmer.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return complaint_to_response(complaint)


# ==================================================
# ADMIN ENDPOINTS
# ==================================================
@router.get("/admin/district/{district}", response_model=List[dict])
async def get_district_complaints(
    district: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """
    Get all complaints from farmers in a specific district.
    For admin dashboard - no auth required for demo.
    """
    # Get all farmers in district
    farmers = db.query(Farmer).filter(Farmer.district == district).all()
    farmer_ids = [f.id for f in farmers]
    
    # Get complaints from those farmers
    query = db.query(Complaint).filter(Complaint.farmer_id.in_(farmer_ids))
    
    if status and status != 'all':
        query = query.filter(Complaint.status == status)
    
    complaints = query.order_by(
        # Pending first
        Complaint.status.desc(),
        Complaint.created_at.desc()
    ).all()
    
    return [complaint_to_response(c) for c in complaints]


@router.get("/admin/all", response_model=List[dict])
async def get_all_complaints(
    status: Optional[str] = Query(None, description="Filter by status"),
    district: Optional[str] = Query(None, description="Filter by district"),
    db: Session = Depends(get_db)
):
    """
    Get all complaints (admin view).
    """
    query = db.query(Complaint)
    
    if status and status != 'all':
        query = query.filter(Complaint.status == status)
    
    if district:
        # Join with farmers table to filter by district
        query = query.join(Farmer).filter(Farmer.district == district)
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    return [complaint_to_response(c) for c in complaints]


@router.put("/admin/{complaint_id}", response_model=dict)
async def update_complaint(
    complaint_id: str,
    update: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    """
    Update complaint status (admin action).
    Mark as in-progress, resolved, or rejected.
    """
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if update.status:
        valid_statuses = ['pending', 'in-progress', 'resolved', 'rejected']
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        complaint.status = update.status
    
    if update.admin_response:
        complaint.admin_response = update.admin_response
    
    if update.resolved_by:
        complaint.resolved_by = update.resolved_by
    
    if update.status == 'resolved':
        complaint.resolved_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    
    return {
        "success": True,
        "message": f"Complaint {complaint_id} updated",
        "complaint": complaint_to_response(complaint)
    }


@router.get("/admin/stats/{district}", response_model=dict)
async def get_district_stats(
    district: str,
    db: Session = Depends(get_db)
):
    """
    Get complaint statistics for a district.
    """
    # Get farmers in district
    farmers = db.query(Farmer).filter(Farmer.district == district).all()
    farmer_ids = [f.id for f in farmers]
    
    total = db.query(Complaint).filter(Complaint.farmer_id.in_(farmer_ids)).count()
    pending = db.query(Complaint).filter(
        Complaint.farmer_id.in_(farmer_ids),
        Complaint.status == "pending"
    ).count()
    in_progress = db.query(Complaint).filter(
        Complaint.farmer_id.in_(farmer_ids),
        Complaint.status == "in-progress"
    ).count()
    resolved = db.query(Complaint).filter(
        Complaint.farmer_id.in_(farmer_ids),
        Complaint.status == "resolved"
    ).count()
    
    return {
        "district": district,
        "totalFarmers": len(farmers),
        "total": total,
        "pending": pending,
        "inProgress": in_progress,
        "resolved": resolved
    }
