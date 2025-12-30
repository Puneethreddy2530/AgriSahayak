"""
AgriSahayak - FastAPI Backend
AI-Powered Smart Agriculture Platform
""",

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import torch

from app.api.v1.router import api_router
from app.core.config import settings
from app.ml_service import load_all_models
from app.db import create_tables, get_db_info


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting AgriSahayak Backend...")
    print(f"🔥 CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"🎮 GPU: {torch.cuda.get_device_name(0)}")
    
    # Initialize database
    print("📦 Initializing database...")
    create_tables()
    db_info = get_db_info()
    print(f"✅ Database ready: {db_info['engine']}")
    
    # Load all ML models
    load_all_models()
    
    yield
    # Shutdown
    print("👋 Shutting down AgriSahayak...")


app = FastAPI(
    title="AgriSahayak API",
    description="AI-Powered Smart Agriculture & Farmer Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000", "http://127.0.0.1:4200", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "🌾 AgriSahayak API - Smart Agriculture Platform",
        "version": "1.0.0",
        "cuda_available": torch.cuda.is_available(),
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    db_info = get_db_info()
    return {
        "status": "healthy",
        "cuda": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "database": db_info
    }

