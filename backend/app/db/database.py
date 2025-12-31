"""
Database Connection and Session Management
Supports PostgreSQL with fallback to SQLite for development
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
import os
from typing import Generator

from app.db.models import Base
import logging

logger = logging.getLogger(__name__)


# ==================================================
# DATABASE CONFIGURATION
# ==================================================
# Get database URL from environment variable
# PostgreSQL: postgresql://user:password@localhost:5432/agrisahayak
# SQLite (dev): sqlite:///./agrisahayak.db

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./agrisahayak.db"  # Default to SQLite for easy setup
)

# Check if using SQLite
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# Create engine with appropriate settings
if IS_SQLITE:
    # SQLite specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
        poolclass=StaticPool,
        echo=False  # Set to True for SQL debugging
    )
    
    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==================================================
# DATABASE OPERATIONS
# ==================================================
def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created successfully")


def drop_tables():
    """Drop all tables (use with caution!)"""
    Base.metadata.drop_all(bind=engine)
    logger.warning("⚠️ All database tables dropped")


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.
    
    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session():
    """
    Context manager for database sessions (for non-FastAPI use).
    
    Usage:
        with get_db_session() as db:
            farmer = db.query(Farmer).first()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ==================================================
# HEALTH CHECK
# ==================================================
def check_db_connection() -> bool:
    """Check if database connection is working"""
    from sqlalchemy import text
    try:
        with get_db_session() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def get_db_info() -> dict:
    """Get database information"""
    return {
        "database_url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
        "engine": "PostgreSQL" if not IS_SQLITE else "SQLite",
        "is_connected": check_db_connection()
    }
