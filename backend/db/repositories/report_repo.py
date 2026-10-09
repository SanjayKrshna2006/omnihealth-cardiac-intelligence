from datetime import datetime, timezone
from bson import ObjectId
from backend.db.mongo import get_db
from backend.api.schemas import OmniHealthReportSchema
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ReportRepository:
    COLLECTION = "reports"
    _in_memory_reports: Dict[str, Dict[str, Any]] = {}

    async def save_report(self, report: OmniHealthReportSchema) -> str:
        doc = report.model_dump()
        doc["created_at"] = datetime.now(timezone.utc)
        try:
            db = await get_db()
            result = await db[self.COLLECTION].insert_one(doc)
            report_id = str(result.inserted_id)
            self._in_memory_reports[report_id] = doc
            return report_id
        except Exception as e:
            logger.warning(f"MongoDB save failed ({e}). Storing in-memory cache.")
            report_id = report.report_id or str(ObjectId())
            doc["_id"] = report_id
            self._in_memory_reports[report_id] = doc
            return report_id

    async def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = await get_db()
            doc = None
            if ObjectId.is_valid(report_id):
                doc = await db[self.COLLECTION].find_one({"_id": ObjectId(report_id)})
            if not doc:
                doc = await db[self.COLLECTION].find_one({"report_id": report_id})
            if doc:
                doc["_id"] = str(doc["_id"])
                return doc
        except Exception as e:
            logger.warning(f"MongoDB query failed ({e}). Checking in-memory cache.")

        return self._in_memory_reports.get(report_id)

    async def get_patient_reports(self, patient_id: str) -> List[Dict[str, Any]]:
        try:
            db = await get_db()
            cursor = db[self.COLLECTION].find(
                {"patient_id": patient_id}
            ).sort("assessment_date", -1)
            docs = await cursor.to_list(length=50)
            for d in docs:
                d["_id"] = str(d["_id"])
            if docs:
                return docs
        except Exception as e:
            logger.warning(f"MongoDB patient reports query failed ({e}). Checking in-memory cache.")

        return [
            doc for doc in self._in_memory_reports.values()
            if doc.get("patient_id") == patient_id
        ]

    async def delete_patient_reports(self, patient_id: str) -> int:
        """Delete all reports associated with a patient."""
        count = 0
        try:
            db = await get_db()
            res = await db[self.COLLECTION].delete_many({"patient_id": patient_id})
            count += res.deleted_count
        except Exception as e:
            logger.warning(f"MongoDB delete reports failed ({e}). Checking memory.")

        to_del = [k for k, v in self._in_memory_reports.items() if v.get("patient_id") == patient_id]
        for k in to_del:
            del self._in_memory_reports[k]
            count += 1
        return count
