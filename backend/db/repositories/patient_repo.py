from datetime import datetime, timezone
from backend.db.mongo import get_db
from backend.api.schemas import PatientSchema
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class PatientRepository:
    COLLECTION = "patients"
    _in_memory_patients: Dict[str, Dict[str, Any]] = {}

    async def create_patient(self, patient: PatientSchema) -> str:
        doc = patient.model_dump()
        doc["updated_at"] = datetime.now(timezone.utc)
        try:
            db = await get_db()
            await db[self.COLLECTION].update_one(
                {"patient_id": patient.patient_id},
                {"$set": doc},
                upsert=True
            )
            self._in_memory_patients[patient.patient_id] = doc
            return patient.patient_id
        except Exception as e:
            logger.warning(f"MongoDB patient upsert failed ({e}). Storing in-memory.")
            self._in_memory_patients[patient.patient_id] = doc
            return patient.patient_id

    async def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = await get_db()
            doc = await db[self.COLLECTION].find_one({"patient_id": patient_id})
            if doc:
                doc["_id"] = str(doc.get("_id", patient_id))
                return doc
        except Exception as e:
            logger.warning(f"MongoDB patient get failed ({e}). Checking memory.")

        return self._in_memory_patients.get(patient_id)

    async def list_patients(self, limit: int = 50, doctor_id: Optional[str] = None, doctor_email: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if doctor_id:
            query["assigned_doctor_id"] = doctor_id
        elif doctor_email:
            query["assigned_doctor_email"] = doctor_email

        try:
            db = await get_db()
            cursor = db[self.COLLECTION].find(query).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            for d in docs:
                d["_id"] = str(d.get("_id", d.get("patient_id")))
            if docs:
                return docs
        except Exception as e:
            logger.warning(f"MongoDB list patients failed ({e}). Checking memory.")

        results = list(self._in_memory_patients.values())
        if doctor_id:
            results = [p for p in results if p.get("assigned_doctor_id") == doctor_id]
        elif doctor_email:
            results = [p for p in results if p.get("assigned_doctor_email") == doctor_email]
        return results[:limit]

    async def delete_patient(self, patient_id: str) -> bool:
        """Delete a patient record from database or in-memory store."""
        deleted = False
        try:
            db = await get_db()
            res = await db[self.COLLECTION].delete_one({"patient_id": patient_id})
            if res.deleted_count > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"MongoDB delete patient failed ({e}). Checking memory.")

        if patient_id in self._in_memory_patients:
            del self._in_memory_patients[patient_id]
            deleted = True

        return deleted
