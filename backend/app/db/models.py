"""
SQLAlchemy Database Models for AgriSahayak
Tables: farmers, lands, crop_cycles, disease_logs, yield_predictions
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import enum

Base = declarative_base()


# ==================================================
# ENUMS
# ==================================================
class GrowthStage(str, enum.Enum):
    SOWING = "sowing"
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    MATURITY = "maturity"
    HARVEST = "harvest"


class HealthStatus(str, enum.Enum):
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    INFECTED = "infected"
    RECOVERED = "recovered"


class Season(str, enum.Enum):
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"


class SoilType(str, enum.Enum):
    BLACK = "black"
    RED = "red"
    ALLUVIAL = "alluvial"
    SANDY = "sandy"
    LOAMY = "loamy"
    CLAY = "clay"


class IrrigationType(str, enum.Enum):
    RAINFED = "rainfed"
    CANAL = "canal"
    BOREWELL = "borewell"
    DRIP = "drip"
    SPRINKLER = "sprinkler"


# ==================================================
# MODELS
# ==================================================
class Farmer(Base):
    """Farmer profile table"""
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    language = Column(String(10), default="hi")
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)
    village = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    lands = relationship("Land", back_populates="farmer", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Farmer {self.farmer_id}: {self.name}>"


class Land(Base):
    """Land parcel table"""
    __tablename__ = "lands"

    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String(20), unique=True, index=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=True)
    area_acres = Column(Float, nullable=False)
    soil_type = Column(String(20), nullable=True)
    irrigation_type = Column(String(20), nullable=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    
    # Soil test results
    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    organic_carbon = Column(Float, nullable=True)
    last_soil_test_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    farmer = relationship("Farmer", back_populates="lands")
    crop_cycles = relationship("CropCycle", back_populates="land", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Land {self.land_id}: {self.area_acres} acres>"


class CropCycle(Base):
    """Crop lifecycle tracking table"""
    __tablename__ = "crop_cycles"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(String(20), unique=True, index=True, nullable=False)
    land_id = Column(Integer, ForeignKey("lands.id", ondelete="CASCADE"), nullable=False)
    
    crop = Column(String(50), nullable=False)
    variety = Column(String(50), nullable=True)
    season = Column(String(20), nullable=False)
    
    sowing_date = Column(DateTime, nullable=False)
    expected_harvest = Column(DateTime, nullable=True)
    actual_harvest = Column(DateTime, nullable=True)
    
    growth_stage = Column(String(20), default="sowing")
    health_status = Column(String(20), default="healthy")
    
    # Yield data
    predicted_yield_kg = Column(Float, nullable=True)
    actual_yield_kg = Column(Float, nullable=True)
    
    # Costs
    seed_cost = Column(Float, default=0)
    fertilizer_cost = Column(Float, default=0)
    pesticide_cost = Column(Float, default=0)
    labor_cost = Column(Float, default=0)
    irrigation_cost = Column(Float, default=0)
    total_cost = Column(Float, default=0)
    
    # Revenue
    selling_price_per_kg = Column(Float, nullable=True)
    total_revenue = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    land = relationship("Land", back_populates="crop_cycles")
    disease_logs = relationship("DiseaseLog", back_populates="crop_cycle", cascade="all, delete-orphan")
    yield_predictions = relationship("YieldPrediction", back_populates="crop_cycle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CropCycle {self.cycle_id}: {self.crop}>"


class DiseaseLog(Base):
    """Disease detection logs table"""
    __tablename__ = "disease_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(20), unique=True, index=True, nullable=False)
    crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id", ondelete="SET NULL"), nullable=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="SET NULL"), nullable=True)
    
    disease_name = Column(String(100), nullable=False)
    disease_hindi = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=False)
    
    severity = Column(String(20), nullable=True)
    affected_area_percent = Column(Float, nullable=True)
    
    image_path = Column(String(255), nullable=True)
    
    # Treatment info
    treatment_recommended = Column(Text, nullable=True)
    treatment_applied = Column(Text, nullable=True)
    treatment_date = Column(DateTime, nullable=True)
    recovery_date = Column(DateTime, nullable=True)
    
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crop_cycle = relationship("CropCycle", back_populates="disease_logs")
    
    def __repr__(self):
        return f"<DiseaseLog {self.log_id}: {self.disease_name}>"


class YieldPrediction(Base):
    """Yield prediction history table"""
    __tablename__ = "yield_predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(20), unique=True, index=True, nullable=False)
    crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=False)
    
    predicted_yield_kg = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    
    # Input factors
    growth_stage_at_prediction = Column(String(20), nullable=True)
    health_status_at_prediction = Column(String(20), nullable=True)
    days_since_sowing = Column(Integer, nullable=True)
    
    # Weather factors (if available)
    avg_temperature = Column(Float, nullable=True)
    total_rainfall_mm = Column(Float, nullable=True)
    
    # Model info
    model_version = Column(String(20), default="v1.0")
    
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    crop_cycle = relationship("CropCycle", back_populates="yield_predictions")
    
    def __repr__(self):
        return f"<YieldPrediction {self.prediction_id}: {self.predicted_yield_kg}kg>"


# ==================================================
# ADDITIONAL TABLES (for future expansion)
# ==================================================
class ActivityLog(Base):
    """Farming activity logs"""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=False)
    
    activity_type = Column(String(50), nullable=False)  # irrigation, fertilizer, pesticide, weeding
    description = Column(Text, nullable=True)
    quantity = Column(String(50), nullable=True)
    cost = Column(Float, default=0)
    
    activity_date = Column(DateTime, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())


class MarketPriceLog(Base):
    """Historical market price data"""
    __tablename__ = "market_price_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    crop = Column(String(50), nullable=False, index=True)
    mandi = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    modal_price = Column(Float, nullable=False)
    
    recorded_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
