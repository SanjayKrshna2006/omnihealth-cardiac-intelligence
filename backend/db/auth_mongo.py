"""
Separate MongoDB Authentication & Doctors Database Module for OMNIHEALTH.
Handles physician authentication, doctor profiles, and user sessions.
You can configure a custom MongoDB connection string via MONGODB_AUTH_URI or .env.
"""

import logging
import os
import hashlib
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr

logger = logging.getLogger("omnihealth.auth_mongo")

# Dedicated MongoDB Auth URI (can be customized with your own Atlas or local connection string)
MONGODB_AUTH_URI = os.getenv("MONGODB_AUTH_URI", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
MONGODB_AUTH_DB = os.getenv("MONGODB_AUTH_DB", "omnihealth_auth")

_auth_client: Optional[AsyncIOMotorClient] = None
_auth_offline: bool = False

# High-speed in-memory store for fallback if MongoDB is not running locally
_IN_MEMORY_DOCTORS: Dict[str, Dict[str, Any]] = {}


class DoctorProfile(BaseModel):
    id: str
    name: str
    title: str
    email: str
    specialization: str
    department: str
    hospital: str
    avatar_initials: str
    license_number: str
    role: str = "Cardiologist"
    active_cases: int = 0


# 5 Clinical Doctors as requested
DEFAULT_DOCTORS = [
    {
        "id": "DOC-001",
        "name": "Dr. Sanjay Kumar, MBBS, MD, DM, FACC",
        "title": "Chief Interventional Cardiologist",
        "email": "sanjay@gmail.com",
        "password_hash": hashlib.sha256("sanjay@123".encode()).hexdigest(),
        "specialization": "Interventional Cardiology & Complex Coronary Angioplasty",
        "department": "Department of Interventional Cardiology",
        "hospital": "Metropolitan Heart Institute",
        "avatar_initials": "SK",
        "license_number": "MCI-TN-984210",
        "role": "Chief Cardiologist",
        "active_cases": 14
    },
    {
        "id": "DOC-002",
        "name": "Dr. Arun Mohan, MBBS, MD, DM, FHRS",
        "title": "Director of Cardiac Electrophysiology",
        "email": "arun@gmail.com",
        "password_hash": hashlib.sha256("arun@123".encode()).hexdigest(),
        "specialization": "Cardiac Electrophysiology, Arrhythmia Mapping & Ablation",
        "department": "Heart Rhythm & Electrophysiology Center",
        "hospital": "Apollo Heart Institute",
        "avatar_initials": "AM",
        "license_number": "MCI-TN-872419",
        "role": "Lead Electrophysiologist",
        "active_cases": 9
    },
    {
        "id": "DOC-003",
        "name": "Dr. Raman Sundaram, MBBS, MD, DNB, FASE",
        "title": "Head of Advanced Cardiac Imaging",
        "email": "raman@gmail.com",
        "password_hash": hashlib.sha256("raman@123".encode()).hexdigest(),
        "specialization": "3D Echocardiography, Strain Imaging & Structural Echo",
        "department": "Cardiovascular Imaging Laboratory",
        "hospital": "Fortis Heart & Vascular Institute",
        "avatar_initials": "RS",
        "license_number": "MCI-DL-652391",
        "role": "Senior Imaging Specialist",
        "active_cases": 16
    },
    {
        "id": "DOC-004",
        "name": "Dr. Samuel Davies, MD, PhD, FACC",
        "title": "Senior Consultant in Heart Failure & Transplant",
        "email": "sam@gmail.com",
        "password_hash": hashlib.sha256("sam@123".encode()).hexdigest(),
        "specialization": "Advanced Heart Failure (HFrEF/HFpEF), LVAD & Transplantation",
        "department": "Heart Failure Intensive Care Unit",
        "hospital": "St. Jude Academic Medical Center",
        "avatar_initials": "SD",
        "license_number": "GMC-UK-710492",
        "role": "Heart Failure Specialist",
        "active_cases": 11
    },
    {
        "id": "DOC-005",
        "name": "Dr. David Miller, MD, FACS, FRCS (CTh)",
        "title": "Chief of Cardiothoracic Surgery",
        "email": "david@gmail.com",
        "password_hash": hashlib.sha256("david@123".encode()).hexdigest(),
        "specialization": "Minimally Invasive Valve Repair & Aortic Reconstruction",
        "department": "Division of Cardiothoracic Surgery",
        "hospital": "University Cardiovascular Center",
        "avatar_initials": "DM",
        "license_number": "MED-NY-529183",
        "role": "Cardiothoracic Surgeon",
        "active_cases": 7
    }
]


async def get_auth_client() -> AsyncIOMotorClient:
    """Returns the MongoDB client dedicated for Auth."""
    global _auth_client, _auth_offline
    if _auth_offline:
        raise ConnectionError("Auth MongoDB is offline (using high-speed in-memory auth store).")
    if _auth_client is None:
        logger.info(f"Connecting to Auth MongoDB at: {MONGODB_AUTH_URI}")
        _auth_client = AsyncIOMotorClient(
            MONGODB_AUTH_URI,
            serverSelectionTimeoutMS=800
        )
    return _auth_client


async def get_auth_db() -> AsyncIOMotorDatabase:
    """Returns the Auth database instance."""
    client = await get_auth_client()
    return client[MONGODB_AUTH_DB]


async def init_auth_mongo():
    """Initializes Auth DB and seeds the 5 default doctor profiles."""
    global _auth_offline
    
    # Pre-populate in-memory store
    for doc in DEFAULT_DOCTORS:
        _IN_MEMORY_DOCTORS[doc["email"].lower()] = doc

    try:
        db = await get_auth_db()
        users_col = db["doctors"]
        # Ping
        client = await get_auth_client()
        await client.admin.command("ping")
        logger.info("Auth MongoDB connected successfully. Ensuring doctor credentials...")
        
        for doc in DEFAULT_DOCTORS:
            await users_col.update_one(
                {"email": doc["email"]},
                {"$setOnInsert": doc},
                upsert=True
            )
        logger.info("5 Doctors seeded into MongoDB Auth collection.")
    except Exception as e:
        logger.warning(f"Auth MongoDB connection skipped ({e}). Operating in resilient in-memory auth mode.")
        _auth_offline = True


async def get_all_doctors() -> List[Dict[str, Any]]:
    """Returns all 5 registered doctor profiles without password hashes."""
    global _auth_offline
    if not _auth_offline:
        try:
            db = await get_auth_db()
            cursor = db["doctors"].find({}, {"password_hash": 0, "_id": 0})
            docs = await cursor.to_list(length=100)
            if docs:
                return docs
        except Exception:
            pass

    # In-memory fallback
    return [
        {k: v for k, v in doc.items() if k != "password_hash"}
        for doc in _IN_MEMORY_DOCTORS.values()
    ]


async def authenticate_doctor(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validates doctor credentials and returns doctor profile."""
    global _auth_offline
    hashed = hashlib.sha256(password.encode()).hexdigest()
    normalized_email = email.strip().lower()

    if not _auth_offline:
        try:
            db = await get_auth_db()
            user = await db["doctors"].find_one({"email": normalized_email})
            if user and user.get("password_hash") == hashed:
                safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
                return safe_user
        except Exception as e:
            logger.warning(f"MongoDB auth lookup failed: {e}")

    # In-memory fallback
    doc = _IN_MEMORY_DOCTORS.get(normalized_email)
    if doc and doc.get("password_hash") == hashed:
        return {k: v for k, v in doc.items() if k != "password_hash"}

    return None
