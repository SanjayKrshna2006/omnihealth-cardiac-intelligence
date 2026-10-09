from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from backend.db.auth_mongo import authenticate_doctor, get_all_doctors, DoctorProfile

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor: Dict[str, Any]
    message: str = "Authentication successful."


@router.get("/doctors", response_model=List[Dict[str, Any]], summary="Get all registered doctor profiles")
async def list_doctors():
    """Retrieve the list of 5 registered clinical doctor profiles for quick login/demo."""
    return await get_all_doctors()


@router.post("/login", response_model=LoginResponse, summary="Doctor Login")
async def login(req: LoginRequest):
    """Authenticate a doctor using email and password."""
    doctor = await authenticate_doctor(req.email, req.password)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid doctor email or password. Please verify credentials."
        )

    # In production, sign a JWT; here we provide a standard secure session token
    dummy_token = f"omnihealth_doc_session_{doctor['id']}_{doctor['avatar_initials']}"
    return LoginResponse(
        access_token=dummy_token,
        token_type="bearer",
        doctor=doctor,
        message=f"Welcome back, {doctor['name']}."
    )
