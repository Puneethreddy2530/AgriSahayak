"""
Farmer Profile & Land Management Endpoints
CRUD operations for farmer registration and land details
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid

router = APIRouter()


# ==================================================
# MODELS
# ==================================================
class FarmerCreate(BaseModel):
    """Farmer registration input"""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")  # Indian mobile
    language: str = Field(default="hi", description="Preferred language code")
    state: str
    district: str


class Farmer(BaseModel):
    """Farmer profile"""
    id: str
    name: str
    phone: str
    language: str
    state: str
    district: str
    created_at: str
    lands: List[str] = []  # land_ids


class LandCreate(BaseModel):
    """Land registration input"""
    farmer_id: str
    area: float = Field(..., gt=0, description="Area in acres")
    soil_type: str = Field(..., description="black/red/alluvial/sandy/loamy")
    irrigation_type: str = Field(..., description="rainfed/canal/borewell/drip/sprinkler")
    geo_location: Optional[Dict[str, float]] = Field(None, description="{'lat': x, 'lon': y}")


class Land(BaseModel):
    """Land details"""
    land_id: str
    farmer_id: str
    area: float
    soil_type: str
    irrigation_type: str
    geo_location: Optional[Dict[str, float]]
    created_at: str
    crop_history: List[Dict] = []


class CropHistoryEntry(BaseModel):
    """Crop history entry"""
    crop: str
    season: str
    year: int
    yield_kg: Optional[float] = None
    notes: Optional[str] = None


# ==================================================
# IN-MEMORY DATABASE (Demo)
# ==================================================
FARMERS_DB: Dict[str, dict] = {}
LANDS_DB: Dict[str, dict] = {}


# ==================================================
# FARMER ENDPOINTS
# ==================================================
@router.post("/register", response_model=Farmer)
async def register_farmer(farmer: FarmerCreate):
    """
    Register a new farmer profile.
    
    - **name**: Full name of the farmer
    - **phone**: 10-digit Indian mobile number
    - **language**: Preferred language (hi, en, ta, te, kn, mr)
    - **state**: State name
    - **district**: District name
    """
    # Check if phone already registered
    for f in FARMERS_DB.values():
        if f["phone"] == farmer.phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    farmer_id = str(uuid.uuid4())[:8]
    farmer_data = {
        "id": farmer_id,
        "name": farmer.name,
        "phone": farmer.phone,
        "language": farmer.language,
        "state": farmer.state,
        "district": farmer.district,
        "created_at": datetime.now().isoformat(),
        "lands": []
    }
    
    FARMERS_DB[farmer_id] = farmer_data
    return Farmer(**farmer_data)


@router.get("/profile/{farmer_id}", response_model=Farmer)
async def get_farmer_profile(farmer_id: str):
    """Get farmer profile by ID"""
    if farmer_id not in FARMERS_DB:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return Farmer(**FARMERS_DB[farmer_id])


@router.get("/lookup")
async def lookup_farmer(phone: str = Query(..., description="Phone number")):
    """Lookup farmer by phone number"""
    for f in FARMERS_DB.values():
        if f["phone"] == phone:
            return Farmer(**f)
    raise HTTPException(status_code=404, detail="Farmer not found")


@router.put("/profile/{farmer_id}")
async def update_farmer(farmer_id: str, updates: dict):
    """Update farmer profile"""
    if farmer_id not in FARMERS_DB:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    allowed = ["name", "language", "state", "district"]
    for key, value in updates.items():
        if key in allowed:
            FARMERS_DB[farmer_id][key] = value
    
    return Farmer(**FARMERS_DB[farmer_id])


@router.get("/list")
async def list_farmers(
    state: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """List all registered farmers"""
    farmers = list(FARMERS_DB.values())
    if state:
        farmers = [f for f in farmers if f["state"].lower() == state.lower()]
    return {
        "total": len(farmers),
        "farmers": [Farmer(**f) for f in farmers[:limit]]
    }


# ==================================================
# LAND ENDPOINTS
# ==================================================
@router.post("/land/register", response_model=Land)
async def register_land(land: LandCreate):
    """
    Register a land parcel for a farmer.
    
    - **farmer_id**: ID of the farmer
    - **area**: Land area in acres
    - **soil_type**: black, red, alluvial, sandy, loamy
    - **irrigation_type**: rainfed, canal, borewell, drip, sprinkler
    - **geo_location**: Optional coordinates {lat, lon}
    """
    if land.farmer_id not in FARMERS_DB:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    land_id = f"L{str(uuid.uuid4())[:6].upper()}"
    land_data = {
        "land_id": land_id,
        "farmer_id": land.farmer_id,
        "area": land.area,
        "soil_type": land.soil_type,
        "irrigation_type": land.irrigation_type,
        "geo_location": land.geo_location,
        "created_at": datetime.now().isoformat(),
        "crop_history": []
    }
    
    LANDS_DB[land_id] = land_data
    FARMERS_DB[land.farmer_id]["lands"].append(land_id)
    
    return Land(**land_data)


@router.get("/land/{land_id}", response_model=Land)
async def get_land(land_id: str):
    """Get land details by ID"""
    if land_id not in LANDS_DB:
        raise HTTPException(status_code=404, detail="Land not found")
    return Land(**LANDS_DB[land_id])


@router.get("/land/farmer/{farmer_id}")
async def get_farmer_lands(farmer_id: str):
    """Get all lands owned by a farmer"""
    if farmer_id not in FARMERS_DB:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    lands = [Land(**LANDS_DB[lid]) for lid in FARMERS_DB[farmer_id]["lands"] if lid in LANDS_DB]
    return {"farmer_id": farmer_id, "total_lands": len(lands), "lands": lands}


@router.post("/land/{land_id}/crop-history")
async def add_crop_history(land_id: str, entry: CropHistoryEntry):
    """Add crop history entry to a land"""
    if land_id not in LANDS_DB:
        raise HTTPException(status_code=404, detail="Land not found")
    
    LANDS_DB[land_id]["crop_history"].append(entry.dict())
    return {"message": "Crop history added", "land_id": land_id}


@router.get("/land/{land_id}/crop-history")
async def get_crop_history(land_id: str):
    """Get crop history for a land"""
    if land_id not in LANDS_DB:
        raise HTTPException(status_code=404, detail="Land not found")
    
    return {
        "land_id": land_id,
        "crop_history": LANDS_DB[land_id]["crop_history"]
    }


# ==================================================
# STATISTICS
# ==================================================
@router.get("/stats")
async def get_stats():
    """Get platform statistics"""
    total_area = sum(l["area"] for l in LANDS_DB.values())
    soil_types = {}
    for l in LANDS_DB.values():
        soil_types[l["soil_type"]] = soil_types.get(l["soil_type"], 0) + 1
    
    return {
        "total_farmers": len(FARMERS_DB),
        "total_lands": len(LANDS_DB),
        "total_area_acres": round(total_area, 2),
        "soil_distribution": soil_types,
        "states_covered": len(set(f["state"] for f in FARMERS_DB.values()))
    }
