"""
API Router - Combines all endpoint routes
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, crop, disease, disease_history, weather, market, schemes, farmer, cropcycle, fertilizer, expense, ivr

api_router = APIRouter()

# Authentication (first)
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




