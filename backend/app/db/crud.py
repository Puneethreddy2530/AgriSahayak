"""
CRUD Operations for Database Models
Reusable functions for creating, reading, updating, and deleting records
ALL PERSISTENCE OPERATIONS GO THROUGH THIS MODULE
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.db.models import (
    Farmer, Land, CropCycle, DiseaseLog, YieldPrediction, ActivityLog
)


# ==================================================
# ID GENERATORS
# ==================================================
def generate_farmer_id() -> str:
    return f"F{str(uuid.uuid4())[:6].upper()}"

def generate_land_id() -> str:
    return f"L{str(uuid.uuid4())[:6].upper()}"

def generate_cycle_id() -> str:
    return f"CC{str(uuid.uuid4())[:6].upper()}"

def generate_log_id(prefix: str = "LOG") -> str:
    return f"{prefix}{str(uuid.uuid4())[:6].upper()}"


# ==================================================
# FARMER CRUD
# ==================================================
def create_farmer(db: Session, name: str, phone: str, state: str, district: str, **kwargs) -> Farmer:
    """Create a new farmer"""
    farmer = Farmer(
        farmer_id=generate_farmer_id(),
        name=name,
        phone=phone,
        state=state,
        district=district,
        **kwargs
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


def get_farmer_by_id(db: Session, farmer_id: str) -> Optional[Farmer]:
    """Get farmer by farmer_id (e.g., F123ABC)"""
    return db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()


def get_farmer_by_phone(db: Session, phone: str) -> Optional[Farmer]:
    """Get farmer by phone number"""
    return db.query(Farmer).filter(Farmer.phone == phone).first()


def get_farmer_by_username(db: Session, username: str) -> Optional[Farmer]:
    """Get farmer by username"""
    return db.query(Farmer).filter(Farmer.username == username.lower()).first()


def get_farmers(db: Session, skip: int = 0, limit: int = 100, state: Optional[str] = None) -> List[Farmer]:
    """Get list of farmers with optional filtering"""
    query = db.query(Farmer).filter(Farmer.is_active == True)
    if state:
        query = query.filter(Farmer.state == state)
    return query.offset(skip).limit(limit).all()


def update_farmer(db: Session, farmer_id: str, **kwargs) -> Optional[Farmer]:
    """Update farmer details"""
    farmer = get_farmer_by_id(db, farmer_id)
    if farmer:
        for key, value in kwargs.items():
            if hasattr(farmer, key) and value is not None:
                setattr(farmer, key, value)
        db.commit()
        db.refresh(farmer)
    return farmer


# ==================================================
# LAND CRUD
# ==================================================
def create_land(db: Session, farmer_db_id: int, area_acres: float, **kwargs) -> Land:
    """Create a new land parcel"""
    land = Land(
        land_id=generate_land_id(),
        farmer_id=farmer_db_id,
        area_acres=area_acres,
        **kwargs
    )
    db.add(land)
    db.commit()
    db.refresh(land)
    return land


def get_land_by_id(db: Session, land_id: str) -> Optional[Land]:
    """Get land by land_id"""
    return db.query(Land).filter(Land.land_id == land_id).first()


def get_farmer_lands(db: Session, farmer_db_id: int) -> List[Land]:
    """Get all lands for a farmer"""
    return db.query(Land).filter(Land.farmer_id == farmer_db_id).all()


def update_land_soil(db: Session, land_id: str, nitrogen: float, phosphorus: float, 
                     potassium: float, ph: float, **kwargs) -> Optional[Land]:
    """Update land soil test data"""
    land = get_land_by_id(db, land_id)
    if land:
        land.nitrogen = nitrogen
        land.phosphorus = phosphorus
        land.potassium = potassium
        land.ph = ph
        land.last_soil_test_date = datetime.now()
        for key, value in kwargs.items():
            if hasattr(land, key):
                setattr(land, key, value)
        db.commit()
        db.refresh(land)
    return land


# ==================================================
# CROP CYCLE CRUD
# ==================================================
def create_crop_cycle(db: Session, land_db_id: int, crop: str, season: str,
                      sowing_date: datetime, expected_harvest: datetime = None, **kwargs) -> CropCycle:
    """Start a new crop cycle"""
    cycle = CropCycle(
        cycle_id=generate_cycle_id(),
        land_id=land_db_id,
        crop=crop,
        season=season,
        sowing_date=sowing_date,
        expected_harvest=expected_harvest,
        **kwargs
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


def get_crop_cycle_by_id(db: Session, cycle_id: str) -> Optional[CropCycle]:
    """Get crop cycle by cycle_id"""
    return db.query(CropCycle).filter(CropCycle.cycle_id == cycle_id).first()


def get_land_crop_cycles(db: Session, land_db_id: int, active_only: bool = True) -> List[CropCycle]:
    """Get all crop cycles for a land"""
    query = db.query(CropCycle).filter(CropCycle.land_id == land_db_id)
    if active_only:
        query = query.filter(CropCycle.is_active == True)
    return query.order_by(CropCycle.sowing_date.desc()).all()


def get_active_crop_cycles(db: Session, limit: int = 100) -> List[CropCycle]:
    """Get all active crop cycles"""
    return db.query(CropCycle).filter(CropCycle.is_active == True).limit(limit).all()


def update_crop_cycle_stage(db: Session, cycle_id: str, growth_stage: str) -> Optional[CropCycle]:
    """Update crop cycle growth stage"""
    cycle = get_crop_cycle_by_id(db, cycle_id)
    if cycle:
        cycle.growth_stage = growth_stage
        db.commit()
        db.refresh(cycle)
    return cycle


def update_crop_cycle_health(db: Session, cycle_id: str, health_status: str) -> Optional[CropCycle]:
    """Update crop cycle health status"""
    cycle = get_crop_cycle_by_id(db, cycle_id)
    if cycle:
        cycle.health_status = health_status
        db.commit()
        db.refresh(cycle)
    return cycle


def complete_crop_cycle(db: Session, cycle_id: str, actual_yield_kg: float,
                        selling_price_per_kg: float = None) -> Optional[CropCycle]:
    """Complete a crop cycle with harvest data"""
    cycle = get_crop_cycle_by_id(db, cycle_id)
    if cycle:
        cycle.is_active = False
        cycle.actual_harvest = datetime.now()
        cycle.actual_yield_kg = actual_yield_kg
        cycle.growth_stage = "harvest"
        if selling_price_per_kg:
            cycle.selling_price_per_kg = selling_price_per_kg
            cycle.total_revenue = actual_yield_kg * selling_price_per_kg
            cycle.profit = cycle.total_revenue - (cycle.total_cost or 0)
        db.commit()
        db.refresh(cycle)
    return cycle


# ==================================================
# DISEASE LOG CRUD
# ==================================================
def create_disease_log(db: Session, disease_name: str, confidence: float,
                       crop_cycle_db_id: int = None, farmer_db_id: int = None, **kwargs) -> DiseaseLog:
    """Log a disease detection"""
    log = DiseaseLog(
        log_id=generate_log_id("DIS"),
        disease_name=disease_name,
        confidence=confidence,
        crop_cycle_id=crop_cycle_db_id,
        farmer_id=farmer_db_id,
        **kwargs
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_disease_logs_for_cycle(db: Session, crop_cycle_db_id: int) -> List[DiseaseLog]:
    """Get all disease logs for a crop cycle"""
    return db.query(DiseaseLog).filter(DiseaseLog.crop_cycle_id == crop_cycle_db_id).all()


def get_recent_disease_logs(db: Session, limit: int = 50) -> List[DiseaseLog]:
    """Get recent disease detections"""
    return db.query(DiseaseLog).order_by(DiseaseLog.detected_at.desc()).limit(limit).all()


# ==================================================
# YIELD PREDICTION CRUD
# ==================================================
def create_yield_prediction(db: Session, crop_cycle_db_id: int, predicted_yield_kg: float,
                           confidence: float, **kwargs) -> YieldPrediction:
    """Record a yield prediction"""
    prediction = YieldPrediction(
        prediction_id=generate_log_id("YLD"),
        crop_cycle_id=crop_cycle_db_id,
        predicted_yield_kg=predicted_yield_kg,
        confidence=confidence,
        **kwargs
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


# ==================================================
# ACTIVITY LOG CRUD
# ==================================================
def create_activity_log(db: Session, crop_cycle_db_id: int, activity_type: str,
                       activity_date: datetime, **kwargs) -> ActivityLog:
    """Log a farming activity"""
    activity = ActivityLog(
        crop_cycle_id=crop_cycle_db_id,
        activity_type=activity_type,
        activity_date=activity_date,
        **kwargs
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


# ==================================================
# STATISTICS
# ==================================================
def get_platform_stats(db: Session) -> Dict[str, Any]:
    """Get platform-wide statistics"""
    return {
        "total_farmers": db.query(Farmer).filter(Farmer.is_active == True).count(),
        "total_lands": db.query(Land).count(),
        "active_crop_cycles": db.query(CropCycle).filter(CropCycle.is_active == True).count(),
        "total_disease_detections": db.query(DiseaseLog).count(),
        "total_yield_predictions": db.query(YieldPrediction).count()
    }
