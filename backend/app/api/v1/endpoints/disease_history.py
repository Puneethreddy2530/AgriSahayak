"""
Disease History & Trends Endpoints
Store detections, analyze patterns, generate insights for research
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from collections import defaultdict
import uuid
import os
import base64

router = APIRouter()


# ==================================================
# MODELS
# ==================================================
class DiseaseDetection(BaseModel):
    """Single disease detection record"""
    detection_id: str
    farmer_id: Optional[str] = None
    crop_cycle_id: Optional[str] = None
    
    disease_name: str
    disease_hindi: Optional[str] = None
    crop: str
    confidence: float
    severity: str  # mild, moderate, severe
    
    image_path: Optional[str] = None
    image_base64: Optional[str] = None
    
    treatment_recommended: Optional[str] = None
    treatment_applied: Optional[str] = None
    is_recovered: bool = False
    
    detected_at: str
    location: Optional[Dict] = None


class DiseaseTrend(BaseModel):
    """Disease trend analysis"""
    disease_name: str
    total_detections: int
    avg_confidence: float
    severity_distribution: Dict[str, int]
    affected_crops: List[str]
    monthly_trend: List[Dict]
    peak_month: str
    risk_level: str


class FarmDiseaseReport(BaseModel):
    """Farm-level disease report"""
    farmer_id: str
    total_detections: int
    diseases_detected: List[str]
    most_common_disease: str
    avg_confidence: float
    disease_history: List[DiseaseDetection]
    trend_analysis: str
    recommendations: List[str]


# ==================================================
# IN-MEMORY STORAGE (Use DB in production)
# ==================================================
DISEASE_HISTORY: Dict[str, dict] = {}
UPLOAD_DIR = "uploads/disease_images"

# Disease information database
DISEASE_INFO = {
    "early_blight": {
        "hindi": "अर्धांगवात",
        "crops": ["tomato", "potato"],
        "severity_guide": {"<0.5": "mild", "0.5-0.8": "moderate", ">0.8": "severe"},
        "treatment": "Apply Mancozeb 75% WP @ 2g/L or Copper oxychloride @ 3g/L"
    },
    "late_blight": {
        "hindi": "पछेती अंगमारी",
        "crops": ["tomato", "potato"],
        "treatment": "Apply Metalaxyl + Mancozeb @ 2.5g/L"
    },
    "leaf_curl": {
        "hindi": "पत्ती मोड़क",
        "crops": ["tomato", "chilli"],
        "treatment": "Control whitefly vector with Imidacloprid"
    },
    "bacterial_wilt": {
        "hindi": "जीवाणु म्लानि",
        "crops": ["tomato", "brinjal", "potato"],
        "treatment": "Soil drenching with Streptocycline @ 0.5g/L"
    },
    "powdery_mildew": {
        "hindi": "चूर्णिल फफूंद",
        "crops": ["wheat", "pea", "mango"],
        "treatment": "Spray Sulphur 80% WP @ 2g/L"
    },
    "rust": {
        "hindi": "रतुआ",
        "crops": ["wheat", "soybean"],
        "treatment": "Apply Propiconazole 25% EC @ 1ml/L"
    },
    "blast": {
        "hindi": "झुलसा",
        "crops": ["rice"],
        "treatment": "Spray Tricyclazole 75% WP @ 0.6g/L"
    },
    "brown_spot": {
        "hindi": "भूरा धब्बा",
        "crops": ["rice"],
        "treatment": "Apply Mancozeb @ 2.5g/L"
    },
    "anthracnose": {
        "hindi": "एन्थ्रेक्नोज",
        "crops": ["mango", "chilli", "banana"],
        "treatment": "Spray Carbendazim 50% WP @ 1g/L"
    },
    "yellow_mosaic": {
        "hindi": "पीला मोज़ेक",
        "crops": ["soybean", "moong"],
        "treatment": "Control whitefly vector, remove infected plants"
    },
    "healthy": {
        "hindi": "स्वस्थ",
        "crops": ["all"],
        "treatment": "No treatment needed - plant is healthy!"
    }
}

# Demo data seed
def seed_demo_data():
    """Seed demo disease history"""
    if DISEASE_HISTORY:
        return
    
    diseases = ["early_blight", "late_blight", "powdery_mildew", "rust", "healthy"]
    crops = ["tomato", "potato", "wheat", "rice"]
    
    for i in range(20):
        days_ago = i * 5
        disease = diseases[i % len(diseases)]
        crop = crops[i % len(crops)]
        
        det_id = f"DET{str(uuid.uuid4())[:6].upper()}"
        DISEASE_HISTORY[det_id] = {
            "detection_id": det_id,
            "farmer_id": "F123ABC" if i < 10 else "F456DEF",
            "crop_cycle_id": f"CC{i:03d}",
            "disease_name": disease,
            "disease_hindi": DISEASE_INFO.get(disease, {}).get("hindi", ""),
            "crop": crop,
            "confidence": 0.85 + (i % 5) * 0.03,
            "severity": ["mild", "moderate", "severe"][i % 3],
            "image_path": None,
            "treatment_recommended": DISEASE_INFO.get(disease, {}).get("treatment", ""),
            "is_recovered": i < 5,
            "detected_at": (datetime.now() - timedelta(days=days_ago)).isoformat(),
            "location": {"state": "Maharashtra", "district": "Pune"}
        }


# ==================================================
# HELPER FUNCTIONS
# ==================================================
def get_severity(confidence: float, disease: str) -> str:
    """Determine severity based on confidence"""
    if confidence < 0.5:
        return "mild"
    elif confidence < 0.8:
        return "moderate"
    else:
        return "severe"


def analyze_trends(detections: List[dict]) -> Dict:
    """Analyze disease trends from detections"""
    if not detections:
        return {"trend": "stable", "risk": "low"}
    
    # Group by month
    monthly = defaultdict(int)
    for d in detections:
        month = d["detected_at"][:7]  # YYYY-MM
        monthly[month] += 1
    
    # Calculate trend
    months = sorted(monthly.keys())
    if len(months) >= 2:
        recent = monthly[months[-1]]
        previous = monthly[months[-2]] if len(months) > 1 else recent
        if recent > previous * 1.5:
            trend = "increasing"
            risk = "high"
        elif recent < previous * 0.5:
            trend = "decreasing"
            risk = "low"
        else:
            trend = "stable"
            risk = "medium"
    else:
        trend = "stable"
        risk = "low"
    
    return {"trend": trend, "risk": risk, "monthly": dict(monthly)}


# ==================================================
# ENDPOINTS
# ==================================================
@router.post("/log")
async def log_disease_detection(
    disease_name: str = Form(...),
    crop: str = Form(...),
    confidence: float = Form(...),
    farmer_id: Optional[str] = Form(None),
    crop_cycle_id: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Log a disease detection to history.
    
    Stores:
    - Disease name, crop, confidence
    - Image (optional)
    - Farmer/cycle linkage
    - Timestamp and location
    """
    seed_demo_data()
    
    det_id = f"DET{str(uuid.uuid4())[:6].upper()}"
    
    # Save image if provided
    image_path = None
    if image:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        image_path = f"{UPLOAD_DIR}/{det_id}.{ext}"
        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)
    
    # Get disease info
    disease_lower = disease_name.lower().replace(" ", "_")
    info = DISEASE_INFO.get(disease_lower, {})
    
    detection = {
        "detection_id": det_id,
        "farmer_id": farmer_id,
        "crop_cycle_id": crop_cycle_id,
        "disease_name": disease_name,
        "disease_hindi": info.get("hindi", ""),
        "crop": crop,
        "confidence": confidence,
        "severity": get_severity(confidence, disease_name),
        "image_path": image_path,
        "treatment_recommended": info.get("treatment", "Consult local agricultural officer"),
        "is_recovered": False,
        "detected_at": datetime.now().isoformat(),
        "location": {"state": state, "district": district} if state else None
    }
    
    DISEASE_HISTORY[det_id] = detection
    
    return {
        "message": "Disease logged successfully",
        "detection_id": det_id,
        "severity": detection["severity"],
        "treatment": detection["treatment_recommended"]
    }


@router.get("/history")
async def get_disease_history(
    farmer_id: Optional[str] = None,
    crop: Optional[str] = None,
    disease: Optional[str] = None,
    days: int = Query(default=90, le=365),
    limit: int = Query(default=50, le=200)
):
    """Get disease detection history with filters"""
    seed_demo_data()
    
    cutoff = datetime.now() - timedelta(days=days)
    
    results = []
    for det in DISEASE_HISTORY.values():
        # Apply filters
        if farmer_id and det.get("farmer_id") != farmer_id:
            continue
        if crop and det.get("crop", "").lower() != crop.lower():
            continue
        if disease and disease.lower() not in det.get("disease_name", "").lower():
            continue
        
        # Check date
        det_date = datetime.fromisoformat(det["detected_at"])
        if det_date < cutoff:
            continue
        
        results.append(det)
    
    # Sort by date descending
    results.sort(key=lambda x: x["detected_at"], reverse=True)
    
    return {
        "total": len(results),
        "period": f"Last {days} days",
        "detections": results[:limit]
    }


@router.get("/farm-report/{farmer_id}")
async def get_farm_disease_report(farmer_id: str):
    """
    Get comprehensive disease report for a farm.
    
    Includes:
    - Disease history
    - Trend analysis
    - Risk assessment
    - Recommendations
    """
    seed_demo_data()
    
    # Get farmer's detections
    detections = [d for d in DISEASE_HISTORY.values() if d.get("farmer_id") == farmer_id]
    
    if not detections:
        return {
            "farmer_id": farmer_id,
            "message": "No disease history found",
            "total_detections": 0
        }
    
    # Analyze
    diseases = [d["disease_name"] for d in detections if d["disease_name"] != "healthy"]
    disease_counts = defaultdict(int)
    for d in diseases:
        disease_counts[d] += 1
    
    most_common = max(disease_counts.keys(), key=lambda x: disease_counts[x]) if disease_counts else "None"
    avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
    
    # Trend analysis
    trend_data = analyze_trends(detections)
    
    # Generate recommendations
    recommendations = []
    if trend_data["risk"] == "high":
        recommendations.append("⚠️ High disease incidence - implement preventive spraying schedule")
    if most_common in DISEASE_INFO:
        recommendations.append(f"Focus on controlling {most_common}: {DISEASE_INFO[most_common].get('treatment', '')}")
    if avg_confidence > 0.8:
        recommendations.append("High detection confidence - ML model performing well")
    recommendations.append("📸 Continue regular disease monitoring with image uploads")
    
    return {
        "farmer_id": farmer_id,
        "total_detections": len(detections),
        "healthy_scans": len([d for d in detections if d["disease_name"] == "healthy"]),
        "diseases_detected": list(set(diseases)),
        "disease_counts": dict(disease_counts),
        "most_common_disease": most_common,
        "avg_confidence": round(avg_confidence, 3),
        "trend": trend_data["trend"],
        "risk_level": trend_data["risk"],
        "monthly_distribution": trend_data.get("monthly", {}),
        "disease_history": sorted(detections, key=lambda x: x["detected_at"], reverse=True)[:10],
        "recommendations": recommendations
    }


@router.get("/trends")
async def get_disease_trends(
    days: int = Query(default=90, le=365),
    state: Optional[str] = None
):
    """
    Get regional disease trends.
    
    Great for:
    - Research
    - SRFP publications
    - Pattern analysis
    """
    seed_demo_data()
    
    cutoff = datetime.now() - timedelta(days=days)
    
    # Filter by date and state
    detections = []
    for det in DISEASE_HISTORY.values():
        det_date = datetime.fromisoformat(det["detected_at"])
        if det_date < cutoff:
            continue
        if state and det.get("location", {}).get("state", "").lower() != state.lower():
            continue
        if det["disease_name"] != "healthy":
            detections.append(det)
    
    # Aggregate by disease
    disease_stats = defaultdict(lambda: {
        "count": 0,
        "confidences": [],
        "severities": defaultdict(int),
        "crops": set(),
        "monthly": defaultdict(int)
    })
    
    for det in detections:
        name = det["disease_name"]
        disease_stats[name]["count"] += 1
        disease_stats[name]["confidences"].append(det["confidence"])
        disease_stats[name]["severities"][det["severity"]] += 1
        disease_stats[name]["crops"].add(det["crop"])
        month = det["detected_at"][:7]
        disease_stats[name]["monthly"][month] += 1
    
    # Build trend response
    trends = []
    for name, stats in disease_stats.items():
        monthly = dict(stats["monthly"])
        peak_month = max(monthly.keys(), key=lambda x: monthly[x]) if monthly else "N/A"
        
        avg_conf = sum(stats["confidences"]) / len(stats["confidences"]) if stats["confidences"] else 0
        
        trends.append({
            "disease_name": name,
            "disease_hindi": DISEASE_INFO.get(name.lower().replace(" ", "_"), {}).get("hindi", ""),
            "total_detections": stats["count"],
            "avg_confidence": round(avg_conf, 3),
            "severity_distribution": dict(stats["severities"]),
            "affected_crops": list(stats["crops"]),
            "monthly_trend": [{"month": m, "count": c} for m, c in sorted(monthly.items())],
            "peak_month": peak_month,
            "risk_level": "high" if stats["count"] > 10 else ("medium" if stats["count"] > 5 else "low")
        })
    
    # Sort by count
    trends.sort(key=lambda x: x["total_detections"], reverse=True)
    
    return {
        "period": f"Last {days} days",
        "state_filter": state or "All India",
        "total_detections": len(detections),
        "unique_diseases": len(trends),
        "trends": trends,
        "top_diseases": [t["disease_name"] for t in trends[:5]],
        "generated_at": datetime.now().isoformat()
    }


@router.get("/research-export")
async def export_for_research(
    days: int = Query(default=365, le=730),
    format: str = Query(default="json", description="json or csv")
):
    """
    Export disease data for research/publications.
    
    Anonymized data suitable for:
    - Academic research
    - SRFP publications
    - ML model training
    """
    seed_demo_data()
    
    cutoff = datetime.now() - timedelta(days=days)
    
    export_data = []
    for det in DISEASE_HISTORY.values():
        det_date = datetime.fromisoformat(det["detected_at"])
        if det_date < cutoff:
            continue
        
        # Anonymize for research
        export_data.append({
            "disease": det["disease_name"],
            "crop": det["crop"],
            "confidence": det["confidence"],
            "severity": det["severity"],
            "detected_month": det["detected_at"][:7],
            "state": det.get("location", {}).get("state") if det.get("location") else None,
            "is_recovered": det.get("is_recovered", False)
        })
    
    if format == "csv":
        # Simple CSV format
        if not export_data:
            return {"csv": "disease,crop,confidence,severity,month,state,recovered"}
        
        headers = list(export_data[0].keys())
        lines = [",".join(headers)]
        for row in export_data:
            lines.append(",".join(str(row.get(h, "")) for h in headers))
        
        return {"format": "csv", "rows": len(export_data), "data": "\n".join(lines)}
    
    return {
        "format": "json",
        "period": f"Last {days} days",
        "total_records": len(export_data),
        "data": export_data,
        "metadata": {
            "exported_at": datetime.now().isoformat(),
            "anonymized": True,
            "suitable_for": ["research", "publications", "ML training"]
        }
    }


@router.post("/{detection_id}/recover")
async def mark_recovered(detection_id: str):
    """Mark a disease detection as recovered"""
    if detection_id not in DISEASE_HISTORY:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    DISEASE_HISTORY[detection_id]["is_recovered"] = True
    DISEASE_HISTORY[detection_id]["recovery_date"] = datetime.now().isoformat()
    
    return {"message": "Marked as recovered", "detection_id": detection_id}
