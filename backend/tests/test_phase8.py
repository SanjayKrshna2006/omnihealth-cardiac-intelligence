import pytest
import asyncio
import io
import numpy as np
from httpx import AsyncClient, ASGITransport
from backend.api.main import app
from backend.utils.signal_processing import generate_synthetic_ecg

@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "OMNIHEALTH" in data["service"]

        api_response = await client.get("/api/health")
        assert api_response.status_code == 200

@pytest.mark.asyncio
async def test_patients_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create patient
        patient_payload = {
            "patient_id": "PT-TEST-007",
            "name": "Jane Smith",
            "age": 52,
            "gender": "Female",
            "medical_history_summary": "Hypertension, Hyperlipidemia"
        }
        post_res = await client.post("/api/patients/", json=patient_payload)
        assert post_res.status_code == 200
        assert post_res.json()["patient_id"] == "PT-TEST-007"

        # Get patient
        get_res = await client.get("/api/patients/PT-TEST-007")
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Jane Smith"

        # List patients
        list_res = await client.get("/api/patients/")
        assert list_res.status_code == 200
        assert isinstance(list_res.json(), list)

@pytest.mark.asyncio
async def test_demo_analysis_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger demo analysis
        demo_res = await client.post("/api/analysis/demo?patient_id=DEMO-PT-99")
        assert demo_res.status_code == 200
        job_data = demo_res.json()
        assert "job_id" in job_data
        job_id = job_data["job_id"]

        # 2. Poll for completion
        completed = False
        report_id = None
        for _ in range(20):
            await asyncio.sleep(1.0)
            status_res = await client.get(f"/api/analysis/{job_id}/status")
            assert status_res.status_code == 200
            status_data = status_res.json()
            if status_data.get("status") == "complete":
                completed = True
                report_id = status_data.get("report_id")
                break

        assert completed is True
        assert report_id is not None

        # 3. Retrieve generated report
        rep_res = await client.get(f"/api/reports/{report_id}")
        assert rep_res.status_code == 200
        rep_data = rep_res.json()
        assert rep_data["report_id"] == report_id
        assert rep_data["ecg_analysis"] is not None
        assert rep_data["echo_analysis"] is not None
        assert rep_data["fusion_result"] is not None
        assert rep_data["final_assessment"] is not None
        assert rep_data["final_assessment"]["requires_clinical_review"] is True

@pytest.mark.asyncio
async def test_analysis_run_multipart():
    # Synthesize ECG data
    ecg_data = generate_synthetic_ecg(duration_sec=5, fs=500, n_leads=12)
    csv_bytes = io.BytesIO()
    np.savetxt(csv_bytes, ecg_data, delimiter=",", header=",".join([f"l{i}" for i in range(12)]), comments="")
    csv_bytes.seek(0)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {
            "ecg_file": ("ecg_upload.csv", csv_bytes, "text/csv")
        }
        data = {
            "patient_id": "PT-MULTIPART-01",
            "previous_notes": "Prior normal checkup in 2024."
        }
        run_res = await client.post("/api/analysis/run", data=data, files=files)
        assert run_res.status_code == 200
        run_json = run_res.json()
        assert "job_id" in run_json
        job_id = run_json["job_id"]

        # Poll status
        completed = False
        for _ in range(15):
            await asyncio.sleep(1.0)
            status_res = await client.get(f"/api/analysis/{job_id}/status")
            if status_res.json().get("status") == "complete":
                completed = True
                break

        assert completed is True
