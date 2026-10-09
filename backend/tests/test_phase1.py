import pytest
from datetime import datetime, timezone
from backend.api.schemas import (
    FusionStatus,
    HistoryRelationship,
    ECGEvidenceSchema,
    EchoEvidenceSchema,
    FusionResultSchema,
    HistoryAnalysisSchema,
    FinalAssessmentSchema,
    OmniHealthReportSchema,
    PatientSchema,
)
from backend.graph.state import OmniHealthState
from backend.db.repositories.report_repo import ReportRepository
from backend.db.repositories.patient_repo import PatientRepository

def test_pydantic_schemas_instantiation():
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm",
        confidence=0.92,
        supporting_evidence=["NORM: 92%"],
        limitations=["AI prototype"]
    )
    assert ecg.modality == "ECG"
    assert ecg.confidence == 0.92

    echo = EchoEvidenceSchema(
        finding="Normal EF (≥55%)",
        confidence=0.88,
        evidence=["Estimated LVEF: 60%"],
        limitations=["Image quality dependent"]
    )
    assert echo.modality == "Echocardiogram"

    fusion = FusionResultSchema(
        status=FusionStatus.AGREEMENT,
        ecg_finding=ecg.finding,
        echo_finding=echo.finding,
        agreement_summary="Both ECG and Echo indicate normal cardiac function.",
        combined_evidence=["Sinus rhythm", "Normal EF"]
    )
    assert fusion.status == FusionStatus.AGREEMENT

    history = HistoryAnalysisSchema(
        relationship=HistoryRelationship.SIMILAR,
        current_summary=fusion.agreement_summary,
        changes_detected=[],
        persistent_findings=["Normal rhythm"],
        new_findings=[]
    )
    assert history.relationship == HistoryRelationship.SIMILAR

    final = FinalAssessmentSchema(
        supported_findings=["Normal Sinus Rhythm", "Preserved Ejection Fraction"],
        primary_assessment="Assessment supports preserved global cardiac function.",
        ecg_evidence_summary="Normal sinus rhythm with no ST deviations.",
        echo_evidence_summary="Normal LV chamber dimensions and EF 60%.",
        historical_evidence_summary="Stable compared to previous record.",
        cross_modal_analysis="Electrical and functional metrics are concordant.",
        explanation="Step-by-step multimodal synthesis indicates no acute distress.",
        limitations=["Research prototype, not for diagnostic use."],
        evidence_sufficiency="sufficient",
        requires_clinical_review=True,
    )
    assert final.requires_clinical_review is True

    report = OmniHealthReportSchema(
        report_id="test-rep-001",
        patient_id="patient-123",
        assessment_date=datetime.now(timezone.utc),
        ecg_analysis=ecg,
        echo_analysis=echo,
        fusion_result=fusion,
        history_analysis=history,
        final_assessment=final,
    )
    assert report.report_id == "test-rep-001"
    dumped = report.model_dump()
    assert dumped["patient_id"] == "patient-123"

def test_omnihealth_state_structure():
    state: OmniHealthState = {
        "patient_id": "P-001",
        "ecg_file_path": "/path/to/ecg.dat",
        "echo_file_path": "/path/to/echo.avi",
        "previous_ecg_path": None,
        "previous_echo_path": None,
        "previous_reports": [],
        "ecg_evidence": None,
        "echo_evidence": None,
        "fusion_result": None,
        "history_analysis": None,
        "final_assessment": None,
        "errors": [],
        "pipeline_stage": "initialized",
        "missing_modalities": [],
    }
    assert state["patient_id"] == "P-001"
    assert state["errors"] == []

@pytest.mark.asyncio
async def test_repositories():
    patient_repo = PatientRepository()
    patient = PatientSchema(
        patient_id="PT-999",
        name="John Doe",
        age=58,
        gender="Male",
        medical_history_summary="Hypertension"
    )
    saved_pid = await patient_repo.create_patient(patient)
    assert saved_pid == "PT-999"

    retrieved_patient = await patient_repo.get_patient("PT-999")
    assert retrieved_patient is not None
    assert retrieved_patient["name"] == "John Doe"

    report_repo = ReportRepository()
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm",
        confidence=0.92,
        supporting_evidence=["NORM: 92%"],
        limitations=["AI prototype"]
    )
    fusion = FusionResultSchema(
        status=FusionStatus.AGREEMENT,
        agreement_summary="Concordant normal findings",
        combined_evidence=[]
    )
    final = FinalAssessmentSchema(
        supported_findings=["Normal sinus rhythm"],
        primary_assessment="Normal baseline",
        ecg_evidence_summary="Normal",
        echo_evidence_summary="Normal",
        historical_evidence_summary="None",
        cross_modal_analysis="Concordant",
        explanation="Normal findings",
        limitations=["Prototype"],
        evidence_sufficiency="sufficient",
        requires_clinical_review=True
    )
    rep = OmniHealthReportSchema(
        report_id="rep-12345",
        patient_id="PT-999",
        assessment_date=datetime.now(timezone.utc),
        ecg_analysis=ecg,
        fusion_result=fusion,
        final_assessment=final
    )
    saved_rid = await report_repo.save_report(rep)
    assert saved_rid is not None

    fetched_rep = await report_repo.get_report(saved_rid)
    assert fetched_rep is not None
    assert fetched_rep["patient_id"] == "PT-999"
