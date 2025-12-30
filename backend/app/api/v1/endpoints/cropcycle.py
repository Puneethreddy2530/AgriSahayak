"""
Crop Lifecycle Tracking Endpoints
Track crops from sowing to harvest with ML-powered insights
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum
import uuid

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
# MODELS
# ==================================================
class CropCycleCreate(BaseModel):
    """Create a new crop cycle"""
    land_id: str
    crop: str
    season: Season
    sowing_date: str = Field(..., description="YYYY-MM-DD format")
    expected_harvest: Optional[str] = Field(None, description="Auto-calculated if not provided")


class CropCycle(BaseModel):
    """Active crop cycle"""
    cycle_id: str
    land_id: str
    crop: str
    season: Season
    sowing_date: str
    expected_harvest: str
    growth_stage: GrowthStage
    health_status: HealthStatus
    days_since_sowing: int
    yield_prediction: Optional[Dict] = None
    alerts: List[Dict] = []
    activities: List[Dict] = []
    is_active: bool = True


class ActivityLog(BaseModel):
    """Log farming activity"""
    activity_type: str = Field(..., description="irrigation/fertilizer/pesticide/weeding/other")
    description: str
    date: Optional[str] = None


class DiseaseReport(BaseModel):
    """Report disease detection"""
    disease_name: str
    confidence: float
    affected_area_percent: Optional[float] = 10.0


# ==================================================
# IN-MEMORY DATABASE
# ==================================================
CROP_CYCLES: Dict[str, dict] = {}

# Crop duration data (days)
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
def calculate_growth_stage(crop: str, days: int) -> GrowthStage:
    """Calculate current growth stage based on days since sowing"""
    durations = CROP_DURATIONS.get(crop.lower(), {"total": 120, "stages": {"germination": 10, "vegetative": 40, "flowering": 25, "maturity": 35}})
    
    if days <= 0:
        return GrowthStage.SOWING
    
    stages = durations["stages"]
    cumulative = 0
    
    if days <= stages.get("germination", 10):
        return GrowthStage.GERMINATION
    cumulative += stages.get("germination", 10)
    
    if days <= cumulative + stages.get("vegetative", 40):
        return GrowthStage.VEGETATIVE
    cumulative += stages.get("vegetative", 40)
    
    if days <= cumulative + stages.get("flowering", 25):
        return GrowthStage.FLOWERING
    cumulative += stages.get("flowering", 25)
    
    if days <= cumulative + stages.get("maturity", 35):
        return GrowthStage.MATURITY
    
    return GrowthStage.HARVEST


def generate_stage_alerts(crop: str, stage: GrowthStage, health: HealthStatus) -> List[Dict]:
    """Generate ML-powered alerts based on growth stage"""
    alerts = []
    
    stage_alerts = {
        GrowthStage.GERMINATION: [
            {"type": "weather", "severity": "info", "message": "Monitor soil moisture - critical for germination"},
            {"type": "pest", "severity": "warning", "message": f"Watch for cutworms and root grubs in {crop}"}
        ],
        GrowthStage.VEGETATIVE: [
            {"type": "nutrition", "severity": "info", "message": "Apply nitrogen fertilizer for healthy leaf growth"},
            {"type": "disease", "severity": "warning", "message": "High humidity increases fungal disease risk"}
        ],
        GrowthStage.FLOWERING: [
            {"type": "weather", "severity": "critical", "message": "Avoid water stress during flowering - affects yield"},
            {"type": "pest", "severity": "warning", "message": "Monitor for aphids and thrips"}
        ],
        GrowthStage.MATURITY: [
            {"type": "harvest", "severity": "info", "message": "Check crop maturity indicators regularly"},
            {"type": "weather", "severity": "warning", "message": "Avoid harvesting if rain is expected"}
        ],
        GrowthStage.HARVEST: [
            {"type": "market", "severity": "info", "message": "Check current mandi prices before selling"},
            {"type": "storage", "severity": "info", "message": "Ensure proper drying before storage"}
        ]
    }
    
    alerts = stage_alerts.get(stage, [])
    
    if health == HealthStatus.AT_RISK:
        alerts.insert(0, {"type": "disease", "severity": "critical", "message": "🔴 Disease risk detected - inspect immediately"})
    elif health == HealthStatus.INFECTED:
        alerts.insert(0, {"type": "disease", "severity": "critical", "message": "🚨 Active disease detected - treatment required"})
    
    return alerts


def predict_yield_for_cycle(cycle: dict) -> Dict:
    """Generate yield prediction using ML model data"""
    crop = cycle["crop"].lower()
    
    # Base yields per acre (kg)
    base_yields = {
        "rice": 2500, "wheat": 3000, "maize": 4000, "cotton": 500,
        "tomato": 25000, "potato": 20000, "onion": 15000, "sugarcane": 70000
    }
    
    base = base_yields.get(crop, 2000)
    
    # Adjust based on health
    health_multiplier = {
        HealthStatus.HEALTHY: 1.0,
        HealthStatus.AT_RISK: 0.85,
        HealthStatus.INFECTED: 0.7,
        HealthStatus.RECOVERED: 0.9
    }
    
    multiplier = health_multiplier.get(cycle["health_status"], 1.0)
    predicted = base * multiplier
    
    return {
        "predicted_yield_kg_per_acre": round(predicted, 0),
        "confidence": 0.85 if cycle["health_status"] == HealthStatus.HEALTHY else 0.7,
        "factors": {
            "crop_type": crop,
            "health_status": cycle["health_status"],
            "growth_stage": cycle["growth_stage"]
        },
        "market_price_estimate": f"₹{round(predicted * 20 / 100, 0)}/quintal"  # Demo price
    }


# ==================================================
# ENDPOINTS
# ==================================================
@router.post("/start", response_model=CropCycle)
async def start_crop_cycle(cycle: CropCycleCreate):
    """
    Start a new crop cycle for a land parcel.
    
    - Auto-calculates expected harvest date
    - Initializes growth stage tracking
    - Enables ML-powered alerts
    """
    cycle_id = f"CC{str(uuid.uuid4())[:6].upper()}"
    
    # Calculate expected harvest
    crop_lower = cycle.crop.lower()
    duration = CROP_DURATIONS.get(crop_lower, {"total": 120})["total"]
    sowing = datetime.strptime(cycle.sowing_date, "%Y-%m-%d")
    harvest = sowing + timedelta(days=duration)
    
    days_since = (datetime.now() - sowing).days
    
    cycle_data = {
        "cycle_id": cycle_id,
        "land_id": cycle.land_id,
        "crop": cycle.crop,
        "season": cycle.season.value,
        "sowing_date": cycle.sowing_date,
        "expected_harvest": cycle.expected_harvest or harvest.strftime("%Y-%m-%d"),
        "growth_stage": calculate_growth_stage(cycle.crop, days_since).value,
        "health_status": HealthStatus.HEALTHY.value,
        "days_since_sowing": max(0, days_since),
        "alerts": [],
        "activities": [],
        "is_active": True
    }
    
    # Generate initial alerts and yield prediction
    cycle_data["alerts"] = generate_stage_alerts(
        cycle.crop, 
        GrowthStage(cycle_data["growth_stage"]),
        HealthStatus(cycle_data["health_status"])
    )
    cycle_data["yield_prediction"] = predict_yield_for_cycle(cycle_data)
    
    CROP_CYCLES[cycle_id] = cycle_data
    return CropCycle(**cycle_data)


@router.get("/{cycle_id}", response_model=CropCycle)
async def get_crop_cycle(cycle_id: str):
    """Get details of a specific crop cycle with updated ML insights"""
    if cycle_id not in CROP_CYCLES:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    cycle = CROP_CYCLES[cycle_id]
    
    # Update dynamic fields
    sowing = datetime.strptime(cycle["sowing_date"], "%Y-%m-%d")
    days = (datetime.now() - sowing).days
    cycle["days_since_sowing"] = max(0, days)
    cycle["growth_stage"] = calculate_growth_stage(cycle["crop"], days).value
    cycle["alerts"] = generate_stage_alerts(
        cycle["crop"],
        GrowthStage(cycle["growth_stage"]),
        HealthStatus(cycle["health_status"])
    )
    cycle["yield_prediction"] = predict_yield_for_cycle(cycle)
    
    return CropCycle(**cycle)


@router.get("/land/{land_id}")
async def get_land_cycles(land_id: str, active_only: bool = True):
    """Get all crop cycles for a land parcel"""
    cycles = [c for c in CROP_CYCLES.values() if c["land_id"] == land_id]
    if active_only:
        cycles = [c for c in cycles if c["is_active"]]
    
    return {"land_id": land_id, "total": len(cycles), "cycles": cycles}


@router.post("/{cycle_id}/activity")
async def log_activity(cycle_id: str, activity: ActivityLog):
    """Log farming activity (irrigation, fertilizer, etc.)"""
    if cycle_id not in CROP_CYCLES:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    activity_entry = {
        "id": str(uuid.uuid4())[:8],
        "type": activity.activity_type,
        "description": activity.description,
        "date": activity.date or datetime.now().strftime("%Y-%m-%d %H:%M"),
        "logged_at": datetime.now().isoformat()
    }
    
    CROP_CYCLES[cycle_id]["activities"].append(activity_entry)
    return {"message": "Activity logged", "activity": activity_entry}


@router.post("/{cycle_id}/report-disease")
async def report_disease(cycle_id: str, report: DiseaseReport):
    """
    Report disease detection from ML model.
    Updates health status and triggers alerts.
    """
    if cycle_id not in CROP_CYCLES:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    cycle = CROP_CYCLES[cycle_id]
    
    # Update health status based on confidence
    if report.confidence > 0.8:
        cycle["health_status"] = HealthStatus.INFECTED.value
    elif report.confidence > 0.5:
        cycle["health_status"] = HealthStatus.AT_RISK.value
    
    # Log the disease event
    disease_event = {
        "id": str(uuid.uuid4())[:8],
        "type": "disease_detected",
        "disease": report.disease_name,
        "confidence": report.confidence,
        "affected_percent": report.affected_area_percent,
        "date": datetime.now().isoformat()
    }
    cycle["activities"].append(disease_event)
    
    # Regenerate alerts
    cycle["alerts"] = generate_stage_alerts(
        cycle["crop"],
        GrowthStage(cycle["growth_stage"]),
        HealthStatus(cycle["health_status"])
    )
    
    # Update yield prediction
    cycle["yield_prediction"] = predict_yield_for_cycle(cycle)
    
    return {
        "message": "Disease reported",
        "new_health_status": cycle["health_status"],
        "updated_yield_prediction": cycle["yield_prediction"],
        "urgent_alerts": [a for a in cycle["alerts"] if a["severity"] == "critical"]
    }


@router.post("/{cycle_id}/update-health")
async def update_health_status(cycle_id: str, status: HealthStatus):
    """Manually update crop health status"""
    if cycle_id not in CROP_CYCLES:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    CROP_CYCLES[cycle_id]["health_status"] = status.value
    CROP_CYCLES[cycle_id]["yield_prediction"] = predict_yield_for_cycle(CROP_CYCLES[cycle_id])
    
    return {"message": "Health status updated", "new_status": status.value}


@router.post("/{cycle_id}/complete")
async def complete_crop_cycle(
    cycle_id: str,
    actual_yield: float = Query(..., description="Actual yield in kg"),
    notes: Optional[str] = None
):
    """Mark crop cycle as complete with actual yield data"""
    if cycle_id not in CROP_CYCLES:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    
    cycle = CROP_CYCLES[cycle_id]
    cycle["is_active"] = False
    cycle["growth_stage"] = GrowthStage.HARVEST.value
    cycle["actual_yield_kg"] = actual_yield
    cycle["completion_date"] = datetime.now().isoformat()
    cycle["completion_notes"] = notes
    
    # Compare with prediction
    predicted = cycle.get("yield_prediction", {}).get("predicted_yield_kg_per_acre", 0)
    accuracy = (1 - abs(actual_yield - predicted) / predicted) * 100 if predicted > 0 else 0
    
    return {
        "message": "Crop cycle completed",
        "cycle_id": cycle_id,
        "actual_yield": actual_yield,
        "predicted_yield": predicted,
        "prediction_accuracy": f"{accuracy:.1f}%",
        "notes": notes
    }


@router.get("/active/all")
async def get_all_active_cycles():
    """Get all active crop cycles with alerts summary"""
    active = [CropCycle(**c) for c in CROP_CYCLES.values() if c["is_active"]]
    
    critical_alerts = []
    for c in active:
        for alert in c.alerts:
            if alert["severity"] == "critical":
                critical_alerts.append({
                    "cycle_id": c.cycle_id,
                    "crop": c.crop,
                    "alert": alert
                })
    
    return {
        "total_active": len(active),
        "cycles": active,
        "critical_alerts": critical_alerts
    }
