"""
CSV Export Endpoints for Research
GET /export/diseases - Export all disease detection logs
GET /export/yields - Export all yield predictions
GET /export/farmers - Export farmer statistics (admin only)

Professional feature for academic and research purposes
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import csv
import io

from app.db.database import get_db
from app.db.models import DiseaseLog, YieldPrediction, CropCycle, Farmer, Land
from app.api.v1.endpoints.auth import get_current_user, require_role, UserInfo, optional_auth

router = APIRouter()


def generate_csv(rows: list, headers: list) -> str:
    """Generate CSV string from rows"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()


@router.get("/diseases")
async def export_disease_logs(
    start_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    plant_type: Optional[str] = Query(None, description="Filter by plant type"),
    limit: int = Query(1000, le=10000, description="Max records"),
    format: str = Query("csv", description="Export format: csv or json"),
    db: Session = Depends(get_db),
    user: Optional[UserInfo] = Depends(optional_auth)
):
    """
    Export disease detection logs for research purposes.
    
    Useful for:
    - Academic research on plant diseases
    - ML model training data
    - Agricultural statistics
    
    Returns CSV with columns:
    - log_id, disease_name, confidence, severity, plant_type, detected_at
    """
    query = db.query(DiseaseLog).order_by(DiseaseLog.detected_at.desc())
    
    # Apply filters
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(DiseaseLog.detected_at >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(DiseaseLog.detected_at <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    if plant_type:
        query = query.filter(DiseaseLog.disease_name.ilike(f"%{plant_type}%"))
    
    logs = query.limit(limit).all()
    
    if format == "json":
        return {
            "export_type": "disease_detections",
            "generated_at": datetime.now().isoformat(),
            "total_records": len(logs),
            "data": [
                {
                    "log_id": log.log_id,
                    "disease_name": log.disease_name,
                    "disease_hindi": log.disease_hindi,
                    "confidence": log.confidence,
                    "severity": log.severity,
                    "affected_area_percent": log.affected_area_percent,
                    "treatment_recommended": log.treatment_recommended,
                    "detected_at": log.detected_at.isoformat() if log.detected_at else None
                }
                for log in logs
            ]
        }
    
    # Generate CSV
    headers = [
        "log_id", "disease_name", "disease_hindi", "confidence", 
        "severity", "affected_area_percent", "treatment_recommended", "detected_at"
    ]
    
    rows = [
        [
            log.log_id,
            log.disease_name,
            log.disease_hindi or "",
            log.confidence,
            log.severity or "",
            log.affected_area_percent or "",
            log.treatment_recommended or "",
            log.detected_at.isoformat() if log.detected_at else ""
        ]
        for log in logs
    ]
    
    csv_content = generate_csv(rows, headers)
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=disease_logs_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/yields")
async def export_yield_predictions(
    crop: Optional[str] = Query(None, description="Filter by crop"),
    limit: int = Query(1000, le=10000, description="Max records"),
    format: str = Query("csv", description="Export format: csv or json"),
    db: Session = Depends(get_db),
    user: Optional[UserInfo] = Depends(optional_auth)
):
    """
    Export yield predictions for research purposes.
    
    Useful for:
    - Agricultural yield analysis
    - ML model validation
    - Economic research
    
    Returns CSV with columns:
    - prediction_id, crop, predicted_yield_kg, confidence, growth_stage, predicted_at
    """
    query = db.query(YieldPrediction).join(CropCycle).order_by(YieldPrediction.predicted_at.desc())
    
    if crop:
        query = query.filter(CropCycle.crop.ilike(f"%{crop}%"))
    
    predictions = query.limit(limit).all()
    
    if format == "json":
        return {
            "export_type": "yield_predictions",
            "generated_at": datetime.now().isoformat(),
            "total_records": len(predictions),
            "data": [
                {
                    "prediction_id": pred.prediction_id,
                    "crop": pred.crop_cycle.crop if pred.crop_cycle else None,
                    "predicted_yield_kg": pred.predicted_yield_kg,
                    "confidence": pred.confidence,
                    "growth_stage_at_prediction": pred.growth_stage_at_prediction,
                    "days_since_sowing": pred.days_since_sowing,
                    "model_version": pred.model_version,
                    "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None
                }
                for pred in predictions
            ]
        }
    
    # Generate CSV
    headers = [
        "prediction_id", "crop", "predicted_yield_kg", "confidence",
        "growth_stage_at_prediction", "days_since_sowing", "model_version", "predicted_at"
    ]
    
    rows = [
        [
            pred.prediction_id,
            pred.crop_cycle.crop if pred.crop_cycle else "",
            pred.predicted_yield_kg,
            pred.confidence,
            pred.growth_stage_at_prediction or "",
            pred.days_since_sowing or "",
            pred.model_version or "",
            pred.predicted_at.isoformat() if pred.predicted_at else ""
        ]
        for pred in predictions
    ]
    
    csv_content = generate_csv(rows, headers)
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=yield_predictions_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/crop-cycles")
async def export_crop_cycles(
    crop: Optional[str] = Query(None, description="Filter by crop"),
    season: Optional[str] = Query(None, description="Filter by season"),
    active_only: bool = Query(False, description="Only active cycles"),
    limit: int = Query(1000, le=10000, description="Max records"),
    format: str = Query("csv", description="Export format: csv or json"),
    db: Session = Depends(get_db),
    user: Optional[UserInfo] = Depends(optional_auth)
):
    """
    Export crop cycle data for research purposes.
    
    Returns CSV with columns:
    - cycle_id, crop, season, sowing_date, expected_harvest, growth_stage, health_status, yield
    """
    query = db.query(CropCycle).order_by(CropCycle.sowing_date.desc())
    
    if crop:
        query = query.filter(CropCycle.crop.ilike(f"%{crop}%"))
    if season:
        query = query.filter(CropCycle.season == season)
    if active_only:
        query = query.filter(CropCycle.is_active == True)
    
    cycles = query.limit(limit).all()
    
    if format == "json":
        return {
            "export_type": "crop_cycles",
            "generated_at": datetime.now().isoformat(),
            "total_records": len(cycles),
            "data": [
                {
                    "cycle_id": cycle.cycle_id,
                    "crop": cycle.crop,
                    "season": cycle.season,
                    "sowing_date": cycle.sowing_date.isoformat() if cycle.sowing_date else None,
                    "expected_harvest": cycle.expected_harvest.isoformat() if cycle.expected_harvest else None,
                    "actual_harvest": cycle.actual_harvest.isoformat() if cycle.actual_harvest else None,
                    "growth_stage": cycle.growth_stage,
                    "health_status": cycle.health_status,
                    "predicted_yield_kg": cycle.predicted_yield_kg,
                    "actual_yield_kg": cycle.actual_yield_kg,
                    "total_cost": cycle.total_cost,
                    "total_revenue": cycle.total_revenue,
                    "profit": cycle.profit,
                    "is_active": cycle.is_active
                }
                for cycle in cycles
            ]
        }
    
    # Generate CSV
    headers = [
        "cycle_id", "crop", "season", "sowing_date", "expected_harvest", 
        "actual_harvest", "growth_stage", "health_status", "predicted_yield_kg",
        "actual_yield_kg", "total_cost", "total_revenue", "profit", "is_active"
    ]
    
    rows = [
        [
            cycle.cycle_id,
            cycle.crop,
            cycle.season,
            cycle.sowing_date.isoformat() if cycle.sowing_date else "",
            cycle.expected_harvest.isoformat() if cycle.expected_harvest else "",
            cycle.actual_harvest.isoformat() if cycle.actual_harvest else "",
            cycle.growth_stage,
            cycle.health_status,
            cycle.predicted_yield_kg or "",
            cycle.actual_yield_kg or "",
            cycle.total_cost or "",
            cycle.total_revenue or "",
            cycle.profit or "",
            cycle.is_active
        ]
        for cycle in cycles
    ]
    
    csv_content = generate_csv(rows, headers)
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=crop_cycles_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/statistics")
async def export_platform_statistics(
    db: Session = Depends(get_db),
    user: Optional[UserInfo] = Depends(optional_auth)
):
    """
    Get platform-wide statistics summary.
    
    Returns aggregated data for:
    - Total farmers, lands, crop cycles
    - Disease detection counts by type
    - Yield prediction accuracy metrics
    """
    from sqlalchemy import func
    
    # Basic counts
    farmer_count = db.query(func.count(Farmer.id)).scalar()
    land_count = db.query(func.count(Land.id)).scalar()
    cycle_count = db.query(func.count(CropCycle.id)).scalar()
    active_cycles = db.query(func.count(CropCycle.id)).filter(CropCycle.is_active == True).scalar()
    disease_count = db.query(func.count(DiseaseLog.id)).scalar()
    yield_count = db.query(func.count(YieldPrediction.id)).scalar()
    
    # Disease distribution
    disease_dist = db.query(
        DiseaseLog.disease_name,
        func.count(DiseaseLog.id).label('count')
    ).group_by(DiseaseLog.disease_name).all()
    
    # Crop distribution
    crop_dist = db.query(
        CropCycle.crop,
        func.count(CropCycle.id).label('count')
    ).group_by(CropCycle.crop).all()
    
    return {
        "generated_at": datetime.now().isoformat(),
        "platform_statistics": {
            "total_farmers": farmer_count,
            "total_lands": land_count,
            "total_crop_cycles": cycle_count,
            "active_crop_cycles": active_cycles,
            "total_disease_detections": disease_count,
            "total_yield_predictions": yield_count
        },
        "disease_distribution": [
            {"disease": d[0], "count": d[1]} for d in disease_dist
        ],
        "crop_distribution": [
            {"crop": c[0], "count": c[1]} for c in crop_dist
        ]
    }
