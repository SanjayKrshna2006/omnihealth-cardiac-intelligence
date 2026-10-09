from fastapi import APIRouter, HTTPException, Query
from backend.db.repositories.patient_repo import PatientRepository
from backend.db.repositories.report_repo import ReportRepository
from backend.api.schemas import PatientSchema
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
_patient_repo = PatientRepository()
_report_repo = ReportRepository()

@router.get("")
@router.get("/")
async def list_patients(
    limit: int = Query(50, ge=1, le=100),
    doctor_id: Optional[str] = Query(None),
    doctor_email: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """List registered patients optionally filtered by assigned doctor."""
    return await _patient_repo.list_patients(limit=limit, doctor_id=doctor_id, doctor_email=doctor_email)

@router.post("")
@router.post("/")
async def create_or_update_patient(patient: PatientSchema) -> Dict[str, Any]:
    """Create or update patient demographic and clinical metadata."""
    pid = await _patient_repo.create_patient(patient)
    return {"status": "success", "patient_id": pid}

@router.get("/{patient_id}")
async def get_patient(patient_id: str) -> Dict[str, Any]:
    """Retrieve patient demographic and summary information."""
    patient = await _patient_repo.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return patient

@router.get("/{patient_id}/reports")
async def get_patient_reports(patient_id: str) -> List[Dict[str, Any]]:
    """Retrieve all historical assessment reports for a specific patient."""
    reports = await _report_repo.get_patient_reports(patient_id)
    return reports

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str) -> Dict[str, Any]:
    """Delete a patient record and all associated assessment reports."""
    deleted_patient = await _patient_repo.delete_patient(patient_id)
    deleted_reports_count = await _report_repo.delete_patient_reports(patient_id)
    logger.info(f"Deleted patient {patient_id} (Patient Record: {deleted_patient}, Reports Deleted: {deleted_reports_count})")
    return {
        "status": "success",
        "message": f"Patient {patient_id} and {deleted_reports_count} reports removed successfully.",
        "patient_id": patient_id,
        "deleted_reports_count": deleted_reports_count
    }
