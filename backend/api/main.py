from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from backend.db.mongo import get_db, close_db, check_db_health
from backend.db.auth_mongo import init_auth_mongo
from backend.db.seed_sample_patients import seed_all_sample_patients
from backend.api.routers import analysis, patients, reports, auth
from backend.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("omnihealth.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"Initializing OMNIHEALTH API ({settings.environment} mode)...")
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    is_healthy = await check_db_health()
    if is_healthy:
        logger.info("Connected to MongoDB successfully.")
    else:
        logger.info("Using high-speed in-memory store for patients and reports.")
    
    # Initialize Auth DB (MongoDB or high-speed in-memory store)
    try:
        await init_auth_mongo()
    except Exception as e:
        logger.warning(f"Auth DB initialization notice ({e})")

    # Auto-seed the 5 sample patient cases and multimodal reports
    try:
        await seed_all_sample_patients()
    except Exception as e:
        logger.warning(f"Auto-seeding sample patients failed ({e})")
        
    yield
    logger.info("Shutting down OMNIHEALTH API...")
    await close_db()

app = FastAPI(
    title="OMNIHEALTH API",
    description="Multimodal AI for Explainable Cardiac Assessment (ECG, Echo, Fusion, History, Final Assessment)",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and explainability overlays (Grad-CAM, saliency)
settings = get_settings()
upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Include domain routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "OMNIHEALTH Multimodal Cardiac AI API",
        "version": "0.1.0",
        "status": "online",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_url": "/health",
        "frontend_url": "http://localhost:5173",
        "endpoints": {
            "analysis": "/api/analysis",
            "patients": "/api/patients",
            "reports": "/api/reports",
            "health": "/health"
        },
        "disclaimer": "AI-assisted research prototype. Not for clinical diagnosis."
    }

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "OMNIHEALTH API",
        "version": "0.1.0",
        "environment": get_settings().environment,
        "disclaimer": "AI-assisted research prototype. Not for clinical diagnosis."
    }
