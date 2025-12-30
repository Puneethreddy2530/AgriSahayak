"""
Crop Advisory Endpoints
ML-powered crop recommendations using trained Random Forest model
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from pathlib import Path

from app.ml_service import predict_crop

router = APIRouter()


class CropInput(BaseModel):
    """Input parameters for crop recommendation"""
    nitrogen: float  # N content ratio (0-140 kg/ha)
    phosphorus: float  # P content ratio (0-145 kg/ha)
    potassium: float  # K content ratio (0-205 kg/ha)
    temperature: float  # Temperature in Celsius
    humidity: float  # Humidity percentage
    ph: float  # Soil pH value (0-14)
    rainfall: float  # Rainfall in mm
    state: Optional[str] = None
    district: Optional[str] = None


class CropRecommendation(BaseModel):
    """Single crop recommendation"""
    crop_name: str
    confidence: float
    description: str
    season: str
    water_requirement: str
    expected_yield: str


class CropResponse(BaseModel):
    """API Response for crop recommendation"""
    success: bool
    recommendations: List[CropRecommendation]
    soil_health: str
    advisory: str


# Crop metadata database
CROP_DATA = {
    "rice": {"season": "Kharif", "water": "High", "yield": "4-5 tonnes/hectare", "desc": "Ideal for waterlogged fields"},
    "wheat": {"season": "Rabi", "water": "Medium", "yield": "3-4 tonnes/hectare", "desc": "Best for winter cultivation"},
    "maize": {"season": "Kharif/Rabi", "water": "Medium", "yield": "5-6 tonnes/hectare", "desc": "Versatile cereal crop"},
    "cotton": {"season": "Kharif", "water": "Medium", "yield": "2-3 bales/hectare", "desc": "Cash crop for textiles"},
    "sugarcane": {"season": "Year-round", "water": "High", "yield": "70-80 tonnes/hectare", "desc": "Long duration crop"},
    "potato": {"season": "Rabi", "water": "Medium", "yield": "25-30 tonnes/hectare", "desc": "Cool weather crop"},
    "tomato": {"season": "Year-round", "water": "Medium", "yield": "40-50 tonnes/hectare", "desc": "High value vegetable"},
    "onion": {"season": "Rabi", "water": "Low", "yield": "20-25 tonnes/hectare", "desc": "Hardy vegetable crop"},
    "jute": {"season": "Kharif", "water": "High", "yield": "2-3 tonnes/hectare", "desc": "Fiber crop for humid areas"},
    "coffee": {"season": "Year-round", "water": "Medium", "yield": "1-2 tonnes/hectare", "desc": "Plantation crop"},
    "mungbean": {"season": "Kharif/Zaid", "water": "Low", "yield": "0.8-1 tonnes/hectare", "desc": "Short duration pulse"},
    "lentil": {"season": "Rabi", "water": "Low", "yield": "1-1.5 tonnes/hectare", "desc": "Cool season pulse"},
    "chickpea": {"season": "Rabi", "water": "Low", "yield": "1.5-2 tonnes/hectare", "desc": "Drought tolerant pulse"},
    "kidneybeans": {"season": "Kharif", "water": "Medium", "yield": "1-1.5 tonnes/hectare", "desc": "High protein legume"},
    "pigeonpeas": {"season": "Kharif", "water": "Low", "yield": "1-1.5 tonnes/hectare", "desc": "Drought resistant pulse"},
    "mothbeans": {"season": "Kharif", "water": "Low", "yield": "0.5-0.8 tonnes/hectare", "desc": "Arid region crop"},
    "blackgram": {"season": "Kharif", "water": "Low", "yield": "0.8-1 tonnes/hectare", "desc": "Short duration pulse"},
    "banana": {"season": "Year-round", "water": "High", "yield": "40-50 tonnes/hectare", "desc": "Tropical fruit crop"},
    "mango": {"season": "Summer", "water": "Medium", "yield": "8-10 tonnes/hectare", "desc": "King of fruits"},
    "grapes": {"season": "Year-round", "water": "Medium", "yield": "20-25 tonnes/hectare", "desc": "High value fruit"},
    "watermelon": {"season": "Summer", "water": "High", "yield": "25-30 tonnes/hectare", "desc": "Summer fruit crop"},
    "muskmelon": {"season": "Summer", "water": "Medium", "yield": "15-20 tonnes/hectare", "desc": "Sweet summer fruit"},
    "apple": {"season": "Year-round", "water": "Medium", "yield": "10-15 tonnes/hectare", "desc": "Temperate fruit"},
    "orange": {"season": "Winter", "water": "Medium", "yield": "15-20 tonnes/hectare", "desc": "Citrus fruit"},
    "papaya": {"season": "Year-round", "water": "Medium", "yield": "40-60 tonnes/hectare", "desc": "Tropical fruit"},
    "coconut": {"season": "Year-round", "water": "Medium", "yield": "80-100 nuts/tree", "desc": "Coastal plantation"},
    "pomegranate": {"season": "Year-round", "water": "Low", "yield": "15-20 tonnes/hectare", "desc": "Drought tolerant fruit"},
}


@router.post("/recommend", response_model=CropResponse)
async def recommend_crops(input_data: CropInput):
    """
    Get AI-powered crop recommendations based on soil and climate parameters.
    Uses trained Random Forest model with 99%+ accuracy.
    """
    """
    try:
        from starlette.concurrency import run_in_threadpool
        
        # Get ML predictions (Non-blocking)
        predictions = await run_in_threadpool(
            predict_crop,
            nitrogen=input_data.nitrogen,
            phosphorus=input_data.phosphorus,
            potassium=input_data.potassium,
            temperature=input_data.temperature,
            humidity=input_data.humidity,
            ph=input_data.ph,
            rainfall=input_data.rainfall
        )
        
        recommendations = []
        for pred in predictions[:3]:
            crop_name = pred['crop_name'].lower()
            data = CROP_DATA.get(crop_name, {
                "season": "Variable", 
                "water": "Medium", 
                "yield": "Variable",
                "desc": "Suitable for your conditions"
            })
            
            recommendations.append(CropRecommendation(
                crop_name=pred['crop_name'].capitalize(),
                confidence=round(pred['confidence'], 2),
                description=data.get("desc", "Recommended for your soil"),
                season=data.get("season", "Year-round"),
                water_requirement=data.get("water", "Medium"),
                expected_yield=data.get("yield", "Variable")
            ))
        
        # Assess soil health
        soil_health = "Good"
        if input_data.nitrogen < 30 or input_data.phosphorus < 20:
            soil_health = "Needs Improvement"
        elif input_data.nitrogen > 100 and input_data.phosphorus > 80:
            soil_health = "Excellent"
        
        # Generate advisory
        top_crop = recommendations[0].crop_name if recommendations else "crops"
        advisory = (
            f"Based on your soil parameters (N:{input_data.nitrogen}, P:{input_data.phosphorus}, "
            f"K:{input_data.potassium}, pH:{input_data.ph}), we recommend {top_crop} as your primary crop. "
            f"Expected rainfall of {input_data.rainfall}mm is {'adequate' if input_data.rainfall > 100 else 'low - consider irrigation'}."
        )
        
        return CropResponse(
            success=True,
            recommendations=recommendations,
            soil_health=soil_health,
            advisory=advisory
        )
        
    except Exception as e:
        import traceback
        print(f"❌ Crop Prediction Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/crops")
async def list_crops():
    """Get list of all supported crops"""
    return {
        "crops": list(CROP_DATA.keys()),
        "total": len(CROP_DATA)
    }


@router.get("/seasons")
async def get_seasons():
    """Get crop seasons information"""
    return {
        "kharif": {
            "months": "June - October",
            "crops": ["rice", "maize", "cotton", "sugarcane", "jute"],
            "description": "Monsoon season crops"
        },
        "rabi": {
            "months": "October - March",
            "crops": ["wheat", "potato", "onion", "mustard", "chickpea", "lentil"],
            "description": "Winter season crops"
        },
        "zaid": {
            "months": "March - June",
            "crops": ["watermelon", "cucumber", "muskmelon", "mungbean"],
            "description": "Summer season crops"
        }
    }
