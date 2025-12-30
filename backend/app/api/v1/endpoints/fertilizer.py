"""
Fertilizer & Pesticide Advisory Endpoints
Smart rule-based recommendations based on soil NPK + crop
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

router = APIRouter()


# ==================================================
# MODELS
# ==================================================
class SoilInput(BaseModel):
    """Soil nutrient input"""
    nitrogen: float = Field(..., ge=0, le=200, description="N content in kg/ha")
    phosphorus: float = Field(..., ge=0, le=150, description="P content in kg/ha")
    potassium: float = Field(..., ge=0, le=300, description="K content in kg/ha")
    ph: float = Field(default=7.0, ge=4.0, le=9.0)
    organic_carbon: Optional[float] = Field(None, ge=0, le=5, description="% organic carbon")


class FertilizerRecommendation(BaseModel):
    """Individual fertilizer recommendation"""
    name: str
    name_hindi: str
    type: str  # nitrogen/phosphorus/potassium/micronutrient/organic
    dosage_kg_per_acre: float
    application_method: str
    best_time: str
    cost_estimate: str
    priority: str  # high/medium/low


class PesticideRecommendation(BaseModel):
    """Pesticide/fungicide recommendation"""
    name: str
    target: str  # pest/disease name
    type: str  # insecticide/fungicide/herbicide
    dosage: str
    application_method: str
    safety_interval_days: int
    organic_alternative: Optional[str] = None


class AdvisoryResponse(BaseModel):
    """Complete advisory response"""
    crop: str
    soil_status: Dict[str, str]
    fertilizer_recommendations: List[FertilizerRecommendation]
    pesticide_recommendations: List[PesticideRecommendation]
    application_schedule: List[Dict]
    total_cost_estimate: str
    warnings: List[str]


# ==================================================
# CROP-SPECIFIC THRESHOLDS (kg/ha)
# ==================================================
CROP_THRESHOLDS = {
    "rice": {"N": {"low": 250, "medium": 350}, "P": {"low": 50, "medium": 80}, "K": {"low": 100, "medium": 150}},
    "wheat": {"N": {"low": 200, "medium": 280}, "P": {"low": 40, "medium": 60}, "K": {"low": 80, "medium": 120}},
    "maize": {"N": {"low": 280, "medium": 380}, "P": {"low": 60, "medium": 90}, "K": {"low": 100, "medium": 140}},
    "cotton": {"N": {"low": 150, "medium": 200}, "P": {"low": 50, "medium": 75}, "K": {"low": 80, "medium": 120}},
    "tomato": {"N": {"low": 200, "medium": 300}, "P": {"low": 80, "medium": 120}, "K": {"low": 150, "medium": 200}},
    "potato": {"N": {"low": 180, "medium": 250}, "P": {"low": 80, "medium": 120}, "K": {"low": 150, "medium": 200}},
    "onion": {"N": {"low": 100, "medium": 150}, "P": {"low": 50, "medium": 80}, "K": {"low": 80, "medium": 120}},
    "sugarcane": {"N": {"low": 300, "medium": 400}, "P": {"low": 80, "medium": 120}, "K": {"low": 150, "medium": 200}},
}

# Fertilizer database
FERTILIZERS = {
    "urea": {"name": "Urea", "hindi": "यूरिया", "type": "nitrogen", "n_percent": 46, "cost_per_kg": 6},
    "dap": {"name": "DAP", "hindi": "डीएपी", "type": "phosphorus", "p_percent": 46, "n_percent": 18, "cost_per_kg": 27},
    "mop": {"name": "MOP (Muriate of Potash)", "hindi": "पोटाश", "type": "potassium", "k_percent": 60, "cost_per_kg": 17},
    "ssp": {"name": "SSP (Single Super Phosphate)", "hindi": "एसएसपी", "type": "phosphorus", "p_percent": 16, "cost_per_kg": 9},
    "npk": {"name": "NPK 10-26-26", "hindi": "एनपीके", "type": "complex", "cost_per_kg": 25},
    "zinc_sulphate": {"name": "Zinc Sulphate", "hindi": "जिंक सल्फेट", "type": "micronutrient", "cost_per_kg": 45},
    "vermicompost": {"name": "Vermicompost", "hindi": "वर्मीकम्पोस्ट", "type": "organic", "cost_per_kg": 8},
    "neem_cake": {"name": "Neem Cake", "hindi": "नीम खली", "type": "organic", "cost_per_kg": 12},
}


# ==================================================
# RULE-BASED RECOMMENDATION ENGINE
# ==================================================
def get_nutrient_status(value: float, thresholds: dict) -> str:
    """Classify nutrient level"""
    if value < thresholds["low"]:
        return "deficient"
    elif value < thresholds["medium"]:
        return "low"
    else:
        return "adequate"


def calculate_fertilizer_dose(deficit: float, nutrient: str, soil_ph: float) -> List[FertilizerRecommendation]:
    """Calculate fertilizer recommendations based on deficit"""
    recommendations = []
    
    if nutrient == "nitrogen" and deficit > 0:
        # Urea recommendation
        urea_needed = min(deficit / 0.46, 120)  # Max 120 kg/acre
        if urea_needed > 10:
            recommendations.append(FertilizerRecommendation(
                name="Urea",
                name_hindi="यूरिया",
                type="nitrogen",
                dosage_kg_per_acre=round(urea_needed, 1),
                application_method="Split application: 50% basal, 25% at tillering, 25% at panicle initiation",
                best_time="Before irrigation",
                cost_estimate=f"₹{round(urea_needed * 6, 0)}",
                priority="high" if deficit > 50 else "medium"
            ))
    
    if nutrient == "phosphorus" and deficit > 0:
        # DAP recommendation
        dap_needed = min(deficit / 0.46, 60)
        if dap_needed > 5:
            recommendations.append(FertilizerRecommendation(
                name="DAP",
                name_hindi="डीएपी",
                type="phosphorus",
                dosage_kg_per_acre=round(dap_needed, 1),
                application_method="Full dose as basal application",
                best_time="At sowing/transplanting",
                cost_estimate=f"₹{round(dap_needed * 27, 0)}",
                priority="high" if deficit > 30 else "medium"
            ))
    
    if nutrient == "potassium" and deficit > 0:
        # MOP recommendation
        mop_needed = min(deficit / 0.60, 50)
        if mop_needed > 5:
            recommendations.append(FertilizerRecommendation(
                name="MOP",
                name_hindi="पोटाश",
                type="potassium",
                dosage_kg_per_acre=round(mop_needed, 1),
                application_method="Split: 50% basal, 50% at flowering",
                best_time="At sowing and flowering",
                cost_estimate=f"₹{round(mop_needed * 17, 0)}",
                priority="high" if deficit > 40 else "medium"
            ))
    
    # pH-based recommendations
    if soil_ph < 5.5:
        recommendations.append(FertilizerRecommendation(
            name="Agricultural Lime",
            name_hindi="कृषि चूना",
            type="amendment",
            dosage_kg_per_acre=200,
            application_method="Broadcast and incorporate into soil",
            best_time="2-3 weeks before sowing",
            cost_estimate="₹400",
            priority="high"
        ))
    elif soil_ph > 8.5:
        recommendations.append(FertilizerRecommendation(
            name="Gypsum",
            name_hindi="जिप्सम",
            type="amendment",
            dosage_kg_per_acre=150,
            application_method="Broadcast before irrigation",
            best_time="Before sowing",
            cost_estimate="₹300",
            priority="high"
        ))
    
    return recommendations


def get_pesticide_recommendations(crop: str, growth_stage: str = "vegetative") -> List[PesticideRecommendation]:
    """Get common pesticide recommendations for crop"""
    
    CROP_PESTS = {
        "rice": [
            {"name": "Chlorantraniliprole 18.5% SC", "target": "Stem Borer", "type": "insecticide",
             "dosage": "150 ml/acre", "method": "Foliar spray", "interval": 21, "organic": "Trichogramma cards"},
            {"name": "Propiconazole 25% EC", "target": "Blast/Sheath Blight", "type": "fungicide",
             "dosage": "200 ml/acre", "method": "Foliar spray", "interval": 14, "organic": "Pseudomonas spray"},
        ],
        "wheat": [
            {"name": "Propiconazole 25% EC", "target": "Rust", "type": "fungicide",
             "dosage": "200 ml/acre", "method": "Foliar spray", "interval": 14, "organic": None},
            {"name": "Chlorpyrifos 20% EC", "target": "Termites", "type": "insecticide",
             "dosage": "1L/acre", "method": "Soil drench", "interval": 30, "organic": "Neem cake application"},
        ],
        "tomato": [
            {"name": "Abamectin 1.9% EC", "target": "Mites/Leaf Miner", "type": "insecticide",
             "dosage": "200 ml/acre", "method": "Foliar spray", "interval": 7, "organic": "Neem oil 3%"},
            {"name": "Metalaxyl + Mancozeb", "target": "Late Blight", "type": "fungicide",
             "dosage": "500 g/acre", "method": "Foliar spray", "interval": 10, "organic": "Bordeaux mixture"},
        ],
        "cotton": [
            {"name": "Imidacloprid 17.8% SL", "target": "Whitefly/Jassids", "type": "insecticide",
             "dosage": "100 ml/acre", "method": "Foliar spray", "interval": 14, "organic": "Yellow sticky traps"},
            {"name": "Emamectin Benzoate 5% SG", "target": "Bollworm", "type": "insecticide",
             "dosage": "100 g/acre", "method": "Foliar spray", "interval": 14, "organic": "Bt spray"},
        ],
    }
    
    pests = CROP_PESTS.get(crop.lower(), [])
    return [PesticideRecommendation(
        name=p["name"],
        target=p["target"],
        type=p["type"],
        dosage=p["dosage"],
        application_method=p["method"],
        safety_interval_days=p["interval"],
        organic_alternative=p.get("organic")
    ) for p in pests]


# ==================================================
# ENDPOINTS
# ==================================================
@router.post("/recommend", response_model=AdvisoryResponse)
async def get_fertilizer_recommendation(
    crop: str = Query(..., description="Crop name"),
    soil: SoilInput = None
):
    """
    Get smart fertilizer and pesticide recommendations.
    
    Based on:
    - Soil NPK levels
    - Crop requirements
    - pH adjustments
    - Common pests/diseases
    """
    crop_lower = crop.lower()
    thresholds = CROP_THRESHOLDS.get(crop_lower, CROP_THRESHOLDS["rice"])
    
    # Analyze soil status
    n_status = get_nutrient_status(soil.nitrogen, thresholds["N"])
    p_status = get_nutrient_status(soil.phosphorus, thresholds["P"])
    k_status = get_nutrient_status(soil.potassium, thresholds["K"])
    
    soil_status = {
        "nitrogen": n_status,
        "phosphorus": p_status,
        "potassium": k_status,
        "ph": "acidic" if soil.ph < 6.5 else ("alkaline" if soil.ph > 7.5 else "neutral")
    }
    
    # Calculate deficits
    n_deficit = max(0, thresholds["N"]["medium"] - soil.nitrogen)
    p_deficit = max(0, thresholds["P"]["medium"] - soil.phosphorus)
    k_deficit = max(0, thresholds["K"]["medium"] - soil.potassium)
    
    # Get fertilizer recommendations
    fertilizer_recs = []
    fertilizer_recs.extend(calculate_fertilizer_dose(n_deficit, "nitrogen", soil.ph))
    fertilizer_recs.extend(calculate_fertilizer_dose(p_deficit, "phosphorus", soil.ph))
    fertilizer_recs.extend(calculate_fertilizer_dose(k_deficit, "potassium", soil.ph))
    
    # Add organic recommendation if OC is low
    if soil.organic_carbon and soil.organic_carbon < 0.5:
        fertilizer_recs.append(FertilizerRecommendation(
            name="Vermicompost",
            name_hindi="वर्मीकम्पोस्ट",
            type="organic",
            dosage_kg_per_acre=500,
            application_method="Mix with soil before sowing",
            best_time="2 weeks before sowing",
            cost_estimate="₹4000",
            priority="medium"
        ))
    
    # Add zinc for deficient soils
    if soil.ph > 7.5:
        fertilizer_recs.append(FertilizerRecommendation(
            name="Zinc Sulphate",
            name_hindi="जिंक सल्फेट",
            type="micronutrient",
            dosage_kg_per_acre=10,
            application_method="Broadcast or foliar spray (0.5%)",
            best_time="At sowing or tillering",
            cost_estimate="₹450",
            priority="medium"
        ))
    
    # Get pesticide recommendations
    pesticide_recs = get_pesticide_recommendations(crop_lower)
    
    # Create application schedule
    schedule = [
        {"timing": "Basal (at sowing)", "products": [r.name for r in fertilizer_recs if "basal" in r.application_method.lower()]},
        {"timing": "21 Days After Sowing", "products": ["Urea (25%)", "First pest scouting"]},
        {"timing": "45 Days After Sowing", "products": ["Urea (25%)", "MOP (if split)"]},
        {"timing": "At Flowering", "products": ["Foliar micronutrients", "Fungicide if needed"]}
    ]
    
    # Calculate total cost
    total_cost = sum(float(r.cost_estimate.replace("₹", "").replace(",", "")) for r in fertilizer_recs)
    
    # Warnings
    warnings = []
    if n_status == "deficient":
        warnings.append("⚠️ Severe nitrogen deficiency - yellowing of leaves expected")
    if soil.ph < 5.5:
        warnings.append("⚠️ Very acidic soil - apply lime before fertilizers")
    if soil.ph > 8.5:
        warnings.append("⚠️ Alkaline soil - zinc and iron deficiency likely")
    
    return AdvisoryResponse(
        crop=crop.capitalize(),
        soil_status=soil_status,
        fertilizer_recommendations=fertilizer_recs,
        pesticide_recommendations=pesticide_recs,
        application_schedule=schedule,
        total_cost_estimate=f"₹{round(total_cost, 0)}",
        warnings=warnings
    )


@router.get("/fertilizers")
async def list_fertilizers():
    """Get list of all fertilizers with details"""
    return {
        "fertilizers": [
            {
                "id": k,
                "name": v["name"],
                "name_hindi": v["hindi"],
                "type": v["type"],
                "nutrient_content": {
                    "N": v.get("n_percent", 0),
                    "P": v.get("p_percent", 0),
                    "K": v.get("k_percent", 0)
                },
                "cost_per_kg": v.get("cost_per_kg", 0)
            }
            for k, v in FERTILIZERS.items()
        ]
    }


@router.get("/crop-requirements/{crop}")
async def get_crop_requirements(crop: str):
    """Get nutrient requirements for a specific crop"""
    crop_lower = crop.lower()
    if crop_lower not in CROP_THRESHOLDS:
        return {"error": f"Crop '{crop}' not found", "available": list(CROP_THRESHOLDS.keys())}
    
    thresholds = CROP_THRESHOLDS[crop_lower]
    return {
        "crop": crop.capitalize(),
        "requirements_kg_per_ha": {
            "nitrogen": thresholds["N"]["medium"],
            "phosphorus": thresholds["P"]["medium"],
            "potassium": thresholds["K"]["medium"]
        },
        "deficiency_thresholds": thresholds,
        "basal_dose_percent": {"N": 50, "P": 100, "K": 50},
        "top_dress_timings": ["21 DAS", "45 DAS", "Flowering"]
    }


@router.get("/organic-options/{crop}")
async def get_organic_alternatives(crop: str):
    """Get organic fertilizer and pesticide alternatives"""
    return {
        "crop": crop.capitalize(),
        "organic_fertilizers": [
            {"name": "Vermicompost", "dose": "2-3 tons/acre", "nutrients": "Balanced NPK + micronutrients"},
            {"name": "FYM", "dose": "5 tons/acre", "nutrients": "0.5-0.3-0.5 NPK"},
            {"name": "Neem Cake", "dose": "200 kg/acre", "nutrients": "5-1-2 NPK + pest repellent"},
            {"name": "Green Manure (Dhaincha)", "dose": "Incorporate at 45 days", "nutrients": "25-30 kg N/acre"},
            {"name": "Bone Meal", "dose": "100 kg/acre", "nutrients": "High P, slow release"},
        ],
        "bio_fertilizers": [
            {"name": "Rhizobium", "for": "Legumes", "benefit": "Fixes 40-80 kg N/ha"},
            {"name": "Azotobacter", "for": "All crops", "benefit": "Fixes 20-40 kg N/ha"},
            {"name": "PSB (Phosphate Solubilizing Bacteria)", "for": "All crops", "benefit": "Increases P availability by 30%"},
        ],
        "organic_pesticides": [
            {"name": "Neem Oil 3%", "target": "Aphids, Mites, Whitefly", "safety": "0 days"},
            {"name": "Beauveria bassiana", "target": "Soft-bodied insects", "safety": "0 days"},
            {"name": "Trichoderma", "target": "Soil-borne fungi", "safety": "Preventive use"},
            {"name": "Pheromone Traps", "target": "Fruit borer, Stem borer", "safety": "Non-toxic"},
        ]
    }
