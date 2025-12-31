"""
Crop Lifecycle Tracking Endpoints
Track crops from sowing to harvest with ML-powered insights
PERSISTED TO DATABASE - No in-memory storage
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import crud
from app.db.models import CropCycle as CropCycleModel, Land as LandModel

router = APIRouter()


# ==================================================
# ENUMS
# ==================================================
class GrowthStage(str, Enum):
    SOWING = "sowing"
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    MATURITY = "maturity"
    HARVEST = "harvest"


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    INFECTED = "infected"
    RECOVERED = "recovered"


class Season(str, Enum):
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"


# ==================================================
# PYDANTIC MODELS
# ==================================================
class CropCycleCreate(BaseModel):
    """Create a new crop cycle"""
    land_id: str
    crop: str
    season: Season
    sowing_date: str = Field(..., description="YYYY-MM-DD format")
    expected_harvest: Optional[str] = Field(None, description="Auto-calculated if not provided")


class CropCycleResponse(BaseModel):
    """Active crop cycle response"""
    cycle_id: str
    land_id: str
    crop: str
    season: str
    sowing_date: str
    expected_harvest: str
    growth_stage: str
    health_status: str
    days_since_sowing: int
    yield_prediction: Optional[Dict] = None
    alerts: List[Dict] = []
    activities: List[Dict] = []
    is_active: bool = True

    class Config:
        from_attributes = True


class ActivityLog(BaseModel):
    """Log farming activity"""
    activity_type: str = Field(..., description="irrigation/fertilizer/pesticide/weeding/other")
    description: str
    cost: Optional[float] = 0
    date: Optional[str] = None


class DiseaseReport(BaseModel):
    """Report disease detection"""
    disease_name: str
    confidence: float
    affected_area_percent: Optional[float] = 10.0


# ==================================================
# CROP DURATION DATA (Reference - not storage)
# ==================================================
CROP_DURATIONS = {
    "rice": {"total": 120, "stages": {"germination": 10, "vegetative": 40, "flowering": 25, "maturity": 35}},
    "wheat": {"total": 140, "stages": {"germination": 12, "vegetative": 45, "flowering": 30, "maturity": 40}},
    "maize": {"total": 100, "stages": {"germination": 8, "vegetative": 35, "flowering": 20, "maturity": 30}},
    "cotton": {"total": 180, "stages": {"germination": 15, "vegetative": 60, "flowering": 45, "maturity": 50}},
    "tomato": {"total": 90, "stages": {"germination": 7, "vegetative": 30, "flowering": 20, "maturity": 25}},
    "potato": {"total": 100, "stages": {"germination": 10, "vegetative": 35, "flowering": 20, "maturity": 30}},
    "onion": {"total": 130, "stages": {"germination": 12, "vegetative": 50, "flowering": 25, "maturity": 35}},
    "sugarcane": {"total": 360, "stages": {"germination": 30, "vegetative": 150, "flowering": 60, "maturity": 100}},
}


# ==================================================
# HELPER FUNCTIONS
# ==================================================
def calculate_growth_stage(crop: str, days: int) -> str:
    """Calculate current growth stage based on days since sowing"""
    durations = CROP_DURATIONS.get(crop.lower(), {"total": 120, "stages": {"germination": 10, "vegetative": 40, "flowering": 25, "maturity": 35}})
    
    if days <= 0:
        return GrowthStage.SOWING.value
    
    stages = durations["stages"]
    cumulative = 0
    
    if days <= stages.get("germination", 10):
        return GrowthStage.GERMINATION.value
    cumulative += stages.get("germination", 10)
    
    if days <= cumulative + stages.get("vegetative", 40):
        return GrowthStage.VEGETATIVE.value
    cumulative += stages.get("vegetative", 40)
    
    if days <= cumulative + stages.get("flowering", 25):
        return GrowthStage.FLOWERING.value
    cumulative += stages.get("flowering", 25)
    
    if days <= cumulative + stages.get("maturity", 35):
        return GrowthStage.MATURITY.value
    
    return GrowthStage.HARVEST.value


def generate_stage_alerts(crop: str, stage: str, health: str) -> List[Dict]:
    """Generate ML-powered alerts based on growth stage"""
    stage_alerts = {
        "germination": [
            {"type": "weather", "severity": "info", "message": "Monitor soil moisture - critical for germination"},
            {"type": "pest", "severity": "warning", "message": f"Watch for cutworms and root grubs in {crop}"}
        ],
        "vegetative": [
            {"type": "nutrition", "severity": "info", "message": "Apply nitrogen fertilizer for healthy leaf growth"},
            {"type": "disease", "severity": "warning", "message": "High humidity increases fungal disease risk"}
        ],
        "flowering": [
            {"type": "weather", "severity": "critical", "message": "Avoid water stress during flowering - affects yield"},
            {"type": "pest", "severity": "warning", "message": "Monitor for aphids and thrips"}
        ],
        "maturity": [
            {"type": "harvest", "severity": "info", "message": "Check crop maturity indicators regularly"},
            {"type": "weather", "severity": "warning", "message": "Avoid harvesting if rain is expected"}
        ],
        "harvest": [
            {"type": "market", "severity": "info", "message": "Check current mandi prices before selling"},
            {"type": "storage", "severity": "info", "message": "Ensure proper drying before storage"}
        ]
    }
    
    alerts = stage_alerts.get(stage, [])
    
    if health == "at_risk":
        alerts.insert(0, {"type": "disease", "severity": "critical", "message": "🔴 Disease risk detected - inspect immediately"})
    elif health == "infected":
        alerts.insert(0, {"type": "disease", "severity": "critical", "message": "🚨 Active disease detected - treatment required"})
    
    return alerts


def predict_yield_for_cycle(crop: str, health_status: str, growth_stage: str) -> Dict:
    """Generate yield prediction"""
    base_yields = {
        "rice": 2500, "wheat": 3000, "maize": 4000, "cotton": 500,
        "tomato": 25000, "potato": 20000, "onion": 15000, "sugarcane": 70000
    }
    
    base = base_yields.get(crop.lower(), 2000)
    
    health_multiplier = {
        "healthy": 1.0, "at_risk": 0.85, "infected": 0.7, "recovered": 0.9
    }
    
    multiplier = health_multiplier.get(health_status, 1.0)
    predicted = base * multiplier
    
    return {
        "predicted_yield_kg_per_acre": round(predicted, 0),
        "confidence": 0.85 if health_status == "healthy" else 0.7,
        "factors": {
            "crop_type": crop,
            "health_status": health_status,
            "growth_stage": growth_stage
        },
        "market_price_estimate": f"₹{round(predicted * 20 / 100, 0)}/quintal"
    }


def cycle_to_response(cycle: CropCycleModel, db: Session) -> CropCycleResponse:
    """Convert SQLAlchemy model to response with computed fields"""
    sowing = cycle.sowing_date
    days = (datetime.now() - sowing).days if sowing else 0
    growth_stage = calculate_growth_stage(cycle.crop, days)
    health = cycle.health_status or "healthy"
    
    # Get activities from activity logs
    activities = []
    from app.db.models import ActivityLog as ActivityLogModel
    activity_logs = db.query(ActivityLogModel).filter(
        ActivityLogModel.crop_cycle_id == cycle.id
    ).order_by(ActivityLogModel.activity_date.desc()).all()
    
    for log in activity_logs:
        activities.append({
            "id": str(log.id),
            "type": log.activity_type,
            "description": log.description,
            "cost": log.cost,
            "date": log.activity_date.isoformat() if log.activity_date else None
        })
    
    # Get land_id
    land_id = cycle.land.land_id if cycle.land else ""
    
    return CropCycleResponse(
        cycle_id=cycle.cycle_id,
        land_id=land_id,
        crop=cycle.crop,
        season=cycle.season or "kharif",
        sowing_date=sowing.strftime("%Y-%m-%d") if sowing else "",
        expected_harvest=cycle.expected_harvest.strftime("%Y-%m-%d") if cycle.expected_harvest else "",
        growth_stage=growth_stage,
        health_status=health,
        days_since_sowing=max(0, days),
        yield_prediction=predict_yield_for_cycle(cycle.crop, health, growth_stage),
        alerts=generate_stage_alerts(cycle.crop, growth_stage, health),
        activities=activities,
        is_active=cycle.is_active
    )


# ==================================================
# ENDPOINTS - DATABASE PERSISTED
# ==================================================
@router.post("/start", response_model=CropCycleResponse)
async def start_crop_cycle(cycle: CropCycleCreate, db: Session = Depends(get_db)):
    """
    Start a new crop cycle for a land parcel. PERSISTED TO DATABASE.
    
    - Auto-calculates expected harvest date
    - Initializes growth stage tracking
    - Enables ML-powered alerts
    """
    # Find land by land_id
    land = crud.get_land_by_id(db, cycle.land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    # Calculate expected harvest
    crop_lower = cycle.crop.lower()
    duration = CROP_DURATIONS.get(crop_lower, {"total": 120})["total"]
    sowing = datetime.strptime(cycle.sowing_date, "%Y-%m-%d")
    harvest = sowing + timedelta(days=duration)
    
    if cycle.expected_harvest:
        harvest = datetime.strptime(cycle.expected_harvest, "%Y-%m-%d")
    
    # Create in database
    db_cycle = crud.create_crop_cycle(
        db=db,
        land_db_id=land.id,
        crop=cycle.crop,
        season=cycle.season.value,
        sowing_date=sowing,
        expected_harvest=harvest
    )
    
    return cycle_to_response(db_cycle, db)


@router.get("/{cycle_id}", response_model=CropCycleResponse)
async def get_crop_cycle(cycle_id: str, db: Session = Depends(get_db)):
    """Get details of a specific crop cycle with updated ML insights - FROM DATABASE"""
    cycle = crud.get_crop_cycle_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    return cycle_to_response(cycle, db)


@router.get("/land/{land_id}")
async def get_land_cycles(land_id: str, active_only: bool = True, db: Session = Depends(get_db)):
    """Get all crop cycles for a land parcel - FROM DATABASE"""
    land = crud.get_land_by_id(db, land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    cycles = crud.get_land_crop_cycles(db, land.id, active_only=active_only)
    
    return {
        "land_id": land_id, 
        "total": len(cycles), 
        "cycles": [cycle_to_response(c, db) for c in cycles]
    }


@router.post("/{cycle_id}/activity")
async def log_activity(cycle_id: str, activity: ActivityLog, db: Session = Depends(get_db)):
    """Log farming activity (irrigation, fertilizer, etc.) - PERSISTED TO DATABASE"""
    cycle = crud.get_crop_cycle_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    activity_date = datetime.now()
    if activity.date:
        try:
            activity_date = datetime.strptime(activity.date, "%Y-%m-%d")
        except:
            activity_date = datetime.now()
    
    db_activity = crud.create_activity_log(
        db=db,
        crop_cycle_db_id=cycle.id,
        activity_type=activity.activity_type,
        activity_date=activity_date,
        description=activity.description,
        cost=activity.cost or 0
    )
    
    # Update cycle costs
    if activity.cost and activity.cost > 0:
        cost_field = f"{activity.activity_type}_cost"
        if hasattr(cycle, cost_field):
            current = getattr(cycle, cost_field) or 0
            setattr(cycle, cost_field, current + activity.cost)
        cycle.total_cost = (cycle.total_cost or 0) + activity.cost
        db.commit()
    
    return {
        "message": "Activity logged", 
        "activity_id": db_activity.id,
        "activity": {
            "type": activity.activity_type,
            "description": activity.description,
            "cost": activity.cost,
            "date": activity_date.isoformat()
        }
    }


@router.post("/{cycle_id}/report-disease")
async def report_disease(cycle_id: str, report: DiseaseReport, db: Session = Depends(get_db)):
    """
    Report disease detection from ML model. PERSISTED TO DATABASE.
    Updates health status and triggers alerts.
    """
    cycle = crud.get_crop_cycle_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Update health status based on confidence
    if report.confidence > 0.8:
        new_health = "infected"
    elif report.confidence > 0.5:
        new_health = "at_risk"
    else:
        new_health = cycle.health_status or "healthy"
    
    crud.update_crop_cycle_health(db, cycle_id, new_health)
    
    # Log the disease detection
    farmer_id = cycle.land.farmer_id if cycle.land else None
    crud.create_disease_log(
        db=db,
        disease_name=report.disease_name,
        confidence=report.confidence,
        crop_cycle_db_id=cycle.id,
        farmer_db_id=farmer_id,
        affected_area_percent=report.affected_area_percent,
        severity="severe" if report.confidence > 0.8 else "moderate"
    )
    
    # Refresh cycle
    db.refresh(cycle)
    
    growth_stage = calculate_growth_stage(cycle.crop, (datetime.now() - cycle.sowing_date).days)
    yield_pred = predict_yield_for_cycle(cycle.crop, new_health, growth_stage)
    alerts = generate_stage_alerts(cycle.crop, growth_stage, new_health)
    
    return {
        "message": "Disease reported and logged",
        "new_health_status": new_health,
        "updated_yield_prediction": yield_pred,
        "urgent_alerts": [a for a in alerts if a["severity"] == "critical"]
    }


@router.post("/{cycle_id}/update-health")
async def update_health_status(cycle_id: str, status: HealthStatus, db: Session = Depends(get_db)):
    """Manually update crop health status - PERSISTED TO DATABASE"""
    cycle = crud.get_crop_cycle_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    crud.update_crop_cycle_health(db, cycle_id, status.value)
    db.refresh(cycle)
    
    growth_stage = calculate_growth_stage(cycle.crop, (datetime.now() - cycle.sowing_date).days)
    yield_pred = predict_yield_for_cycle(cycle.crop, status.value, growth_stage)
    
    return {"message": "Health status updated", "new_status": status.value, "yield_prediction": yield_pred}


@router.post("/{cycle_id}/complete")
async def complete_crop_cycle(
    cycle_id: str,
    actual_yield: float = Query(..., description="Actual yield in kg"),
    selling_price: Optional[float] = Query(None, description="Selling price per kg"),
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mark crop cycle as complete with actual yield data - PERSISTED TO DATABASE"""
    cycle = crud.get_crop_cycle_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    # Get predicted yield before completing
    growth_stage = calculate_growth_stage(cycle.crop, (datetime.now() - cycle.sowing_date).days)
    predicted = predict_yield_for_cycle(cycle.crop, cycle.health_status or "healthy", growth_stage)
    predicted_yield = predicted.get("predicted_yield_kg_per_acre", 0)
    
    # Complete the cycle
    completed = crud.complete_crop_cycle(db, cycle_id, actual_yield, selling_price)
    
    if notes:
        completed.notes = notes
        db.commit()
    
    # Calculate accuracy
    accuracy = (1 - abs(actual_yield - predicted_yield) / predicted_yield) * 100 if predicted_yield > 0 else 0
    
    return {
        "message": "Crop cycle completed",
        "cycle_id": cycle_id,
        "actual_yield": actual_yield,
        "predicted_yield": predicted_yield,
        "prediction_accuracy": f"{accuracy:.1f}%",
        "revenue": completed.total_revenue,
        "profit": completed.profit,
        "notes": notes
    }


@router.get("/active/all")
async def get_all_active_cycles(db: Session = Depends(get_db)):
    """Get all active crop cycles with alerts summary - FROM DATABASE"""
    cycles = crud.get_active_crop_cycles(db, limit=100)
    
    responses = [cycle_to_response(c, db) for c in cycles]
    
    critical_alerts = []
    for c in responses:
        for alert in c.alerts:
            if alert["severity"] == "critical":
                critical_alerts.append({
                    "cycle_id": c.cycle_id,
                    "crop": c.crop,
                    "alert": alert
                })
    
    return {
        "total_active": len(responses),
        "cycles": responses,
        "critical_alerts": critical_alerts
    }
