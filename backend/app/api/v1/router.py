"""
API Router - Combines all endpoint routes
ALL DATA IS PERSISTED TO DATABASE - No in-memory storage
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, crop, disease, disease_history, weather, market, 
    schemes, farmer, cropcycle, fertilizer, expense, ivr, export, complaints
)

api_router = APIRouter()

# Authentication (first) - BACKEND AS SOURCE OF TRUTH
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(farmer.router, prefix="/farmer", tags=["Farmer Profile"])
api_router.include_router(cropcycle.router, prefix="/cropcycle", tags=["Crop Lifecycle"])
api_router.include_router(crop.router, prefix="/crop", tags=["Crop Advisory"])
api_router.include_router(fertilizer.router, prefix="/fertilizer", tags=["Fertilizer Advisory"])
api_router.include_router(expense.router, prefix="/expense", tags=["Expense & Profit"])
api_router.include_router(disease.router, prefix="/disease", tags=["Disease Detection"])
api_router.include_router(disease_history.router, prefix="/disease-history", tags=["Disease History & Trends"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather Intelligence"])
api_router.include_router(market.router, prefix="/market", tags=["Market Prices"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Government Schemes"])
api_router.include_router(ivr.router, prefix="/ivr", tags=["IVR Helpline"])

# Complaints System - Farmers submit, Admin reviews
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints System"])

# CSV Export endpoints for research - Professional feature
api_router.include_router(export.router, prefix="/export", tags=["Data Export (Research)"])




