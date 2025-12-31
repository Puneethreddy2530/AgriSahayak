"""
Farmer Profile & Land Management Endpoints
CRUD operations for farmer registration and land details
PERSISTED TO DATABASE - No in-memory storage
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import crud
from app.db.models import Farmer as FarmerModel, Land as LandModel

router = APIRouter()


# ==================================================
# PYDANTIC MODELS (Request/Response)
# ==================================================
class FarmerCreate(BaseModel):
    """Farmer registration input"""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")  # Indian mobile
    language: str = Field(default="hi", description="Preferred language code")
    state: str
    district: str
    username: Optional[str] = Field(None, min_length=4, max_length=50)
    password_hash: Optional[str] = None


class FarmerResponse(BaseModel):
    """Farmer profile response"""
    id: str
    name: str
    phone: str
    language: str
    state: str
    district: str
    username: Optional[str] = None
    created_at: str
    lands: List[str] = []

    class Config:
        from_attributes = True


class LandCreate(BaseModel):
    """Land registration input"""
    farmer_id: str
    area: float = Field(..., gt=0, description="Area in acres")
    soil_type: str = Field(..., description="black/red/alluvial/sandy/loamy")
    irrigation_type: str = Field(..., description="rainfed/canal/borewell/drip/sprinkler")
    geo_location: Optional[Dict[str, float]] = Field(None, description="{'lat': x, 'lon': y}")
    name: Optional[str] = None


class LandResponse(BaseModel):
    """Land details response"""
    land_id: str
    farmer_id: str
    area: float
    soil_type: str
    irrigation_type: str
    geo_location: Optional[Dict[str, float]] = None
    created_at: str
    crop_history: List[Dict] = []

    class Config:
        from_attributes = True


class CropHistoryEntry(BaseModel):
    """Crop history entry"""
    crop: str
    season: str
    year: int
    yield_kg: Optional[float] = None
    notes: Optional[str] = None


# ==================================================
# HELPER FUNCTIONS
# ==================================================
def farmer_to_response(farmer: FarmerModel) -> FarmerResponse:
    """Convert SQLAlchemy model to response"""
    return FarmerResponse(
        id=farmer.farmer_id,
        name=farmer.name,
        phone=farmer.phone,
        language=farmer.language or "hi",
        state=farmer.state,
        district=farmer.district,
        username=getattr(farmer, 'username', None),
        created_at=farmer.created_at.isoformat() if farmer.created_at else datetime.now().isoformat(),
        lands=[land.land_id for land in farmer.lands]
    )


def land_to_response(land: LandModel) -> LandResponse:
    """Convert SQLAlchemy model to response"""
    geo = None
    if land.latitude and land.longitude:
        geo = {"lat": land.latitude, "lon": land.longitude}
    
    # Get crop history from crop_cycles
    crop_history = []
    for cycle in land.crop_cycles:
        crop_history.append({
            "crop": cycle.crop,
            "season": cycle.season,
            "year": cycle.sowing_date.year if cycle.sowing_date else datetime.now().year,
            "yield_kg": cycle.actual_yield_kg,
            "is_active": cycle.is_active
        })
    
    return LandResponse(
        land_id=land.land_id,
        farmer_id=land.farmer.farmer_id if land.farmer else "",
        area=land.area_acres,
        soil_type=land.soil_type or "",
        irrigation_type=land.irrigation_type or "",
        geo_location=geo,
        created_at=land.created_at.isoformat() if land.created_at else datetime.now().isoformat(),
        crop_history=crop_history
    )


# ==================================================
# FARMER ENDPOINTS - DATABASE PERSISTED
# ==================================================
@router.post("/register", response_model=FarmerResponse)
async def register_farmer(farmer: FarmerCreate, db: Session = Depends(get_db)):
    """
    Register a new farmer profile. PERSISTED TO DATABASE.
    
    - **name**: Full name of the farmer
    - **phone**: 10-digit Indian mobile number
    - **language**: Preferred language (hi, en, ta, te, kn, mr)
    - **state**: State name
    - **district**: District name
    """
    # Check if phone already registered
    existing = crud.get_farmer_by_phone(db, farmer.phone)
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create farmer in database
    db_farmer = crud.create_farmer(
        db=db,
        name=farmer.name,
        phone=farmer.phone,
        state=farmer.state,
        district=farmer.district,
        language=farmer.language
    )
    
    return farmer_to_response(db_farmer)


@router.get("/profile/{farmer_id}", response_model=FarmerResponse)
async def get_farmer_profile(farmer_id: str, db: Session = Depends(get_db)):
    """Get farmer profile by ID - FROM DATABASE"""
    farmer = crud.get_farmer_by_id(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer_to_response(farmer)


@router.get("/lookup")
async def lookup_farmer(phone: str = Query(..., description="Phone number"), db: Session = Depends(get_db)):
    """Lookup farmer by phone number - FROM DATABASE"""
    farmer = crud.get_farmer_by_phone(db, phone)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer_to_response(farmer)


@router.put("/profile/{farmer_id}")
async def update_farmer(farmer_id: str, updates: dict, db: Session = Depends(get_db)):
    """Update farmer profile - PERSISTED TO DATABASE"""
    farmer = crud.get_farmer_by_id(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    allowed = ["name", "language", "state", "district"]
    update_data = {k: v for k, v in updates.items() if k in allowed}
    
    updated_farmer = crud.update_farmer(db, farmer_id, **update_data)
    return farmer_to_response(updated_farmer)


@router.get("/list")
async def list_farmers(
    state: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    """List all registered farmers - FROM DATABASE"""
    farmers = crud.get_farmers(db, limit=limit, state=state)
    return {
        "total": len(farmers),
        "farmers": [farmer_to_response(f) for f in farmers]
    }


@router.get("/all")
async def get_all_farmers(
    district: Optional[str] = Query(None, description="Filter by district"),
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db)
):
    """
    Get all farmers, optionally filtered by district or state.
    For admin dashboard - returns full farmer data with lands.
    """
    query = db.query(FarmerModel)
    
    if district:
        query = query.filter(FarmerModel.district == district)
    if state:
        query = query.filter(FarmerModel.state == state)
    
    farmers = query.all()
    
    result = []
    for f in farmers:
        farmer_data = {
            "id": f.farmer_id,
            "name": f.name,
            "phone": f.phone,
            "language": f.language or "hi",
            "state": f.state,
            "district": f.district,
            "username": f.username,
            "lands": []
        }
        
        # Add land details
        for land in f.lands:
            land_data = {
                "land_id": land.land_id,
                "area": land.area_acres,
                "soil_type": land.soil_type,
                "irrigation_type": land.irrigation_type,
                "name": land.name
            }
            farmer_data["lands"].append(land_data)
        
        result.append(farmer_data)
    
    return result


# ==================================================
# LAND ENDPOINTS - DATABASE PERSISTED
# ==================================================
@router.post("/land/register", response_model=LandResponse)
async def register_land(land: LandCreate, db: Session = Depends(get_db)):
    """
    Register a land parcel for a farmer. PERSISTED TO DATABASE.
    
    - **farmer_id**: ID of the farmer
    - **area**: Land area in acres
    - **soil_type**: black, red, alluvial, sandy, loamy
    - **irrigation_type**: rainfed, canal, borewell, drip, sprinkler
    - **geo_location**: Optional coordinates {lat, lon}
    """
    farmer = crud.get_farmer_by_id(db, land.farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Prepare geo_location
    lat = land.geo_location.get("lat") if land.geo_location else None
    lon = land.geo_location.get("lon") if land.geo_location else None
    
    db_land = crud.create_land(
        db=db,
        farmer_db_id=farmer.id,
        area_acres=land.area,
        soil_type=land.soil_type,
        irrigation_type=land.irrigation_type,
        latitude=lat,
        longitude=lon,
        name=land.name
    )
    
    return land_to_response(db_land)


@router.get("/land/{land_id}", response_model=LandResponse)
async def get_land(land_id: str, db: Session = Depends(get_db)):
    """Get land details by ID - FROM DATABASE"""
    land = crud.get_land_by_id(db, land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    return land_to_response(land)


@router.get("/land/farmer/{farmer_id}")
async def get_farmer_lands(farmer_id: str, db: Session = Depends(get_db)):
    """Get all lands owned by a farmer - FROM DATABASE"""
    farmer = crud.get_farmer_by_id(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    lands = crud.get_farmer_lands(db, farmer.id)
    return {
        "farmer_id": farmer_id, 
        "total_lands": len(lands), 
        "lands": [land_to_response(l) for l in lands]
    }


@router.post("/land/{land_id}/crop-history")
async def add_crop_history(land_id: str, entry: CropHistoryEntry, db: Session = Depends(get_db)):
    """Add crop history entry to a land - via CropCycle creation"""
    land = crud.get_land_by_id(db, land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    # Create a completed crop cycle for historical data
    from datetime import datetime
    sowing_date = datetime(entry.year, 6 if entry.season.lower() == "kharif" else 11, 1)
    
    cycle = crud.create_crop_cycle(
        db=db,
        land_db_id=land.id,
        crop=entry.crop,
        season=entry.season,
        sowing_date=sowing_date,
        is_active=False
    )
    
    if entry.yield_kg:
        crud.complete_crop_cycle(db, cycle.cycle_id, entry.yield_kg)
    
    return {"message": "Crop history added", "land_id": land_id, "cycle_id": cycle.cycle_id}


@router.get("/land/{land_id}/crop-history")
async def get_crop_history(land_id: str, db: Session = Depends(get_db)):
    """Get crop history for a land - FROM DATABASE"""
    land = crud.get_land_by_id(db, land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    crop_history = []
    for cycle in land.crop_cycles:
        crop_history.append({
            "cycle_id": cycle.cycle_id,
            "crop": cycle.crop,
            "season": cycle.season,
            "year": cycle.sowing_date.year if cycle.sowing_date else None,
            "yield_kg": cycle.actual_yield_kg,
            "is_active": cycle.is_active,
            "sowing_date": cycle.sowing_date.isoformat() if cycle.sowing_date else None
        })
    
    return {"land_id": land_id, "crop_history": crop_history}


@router.delete("/land/{land_id}")
async def delete_land(land_id: str, db: Session = Depends(get_db)):
    """Delete a land parcel - FROM DATABASE"""
    land = crud.get_land_by_id(db, land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    db.delete(land)
    db.commit()
    return {"message": "Land deleted", "land_id": land_id}


# ==================================================
# STATISTICS - FROM DATABASE
# ==================================================
@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get platform statistics - FROM DATABASE"""
    stats = crud.get_platform_stats(db)
    
    # Additional stats
    from app.db.models import Land as LandModel, Farmer as FarmerModel
    from sqlalchemy import func
    
    total_area = db.query(func.sum(LandModel.area_acres)).scalar() or 0
    
    soil_dist = db.query(
        LandModel.soil_type, 
        func.count(LandModel.id)
    ).group_by(LandModel.soil_type).all()
    
    states = db.query(func.count(func.distinct(FarmerModel.state))).scalar() or 0
    
    return {
        "total_farmers": stats["total_farmers"],
        "total_lands": stats["total_lands"],
        "total_area_acres": round(total_area, 2),
        "soil_distribution": {s[0]: s[1] for s in soil_dist if s[0]},
        "states_covered": states,
        "active_crop_cycles": stats["active_crop_cycles"],
        "total_disease_detections": stats["total_disease_detections"]
    }
