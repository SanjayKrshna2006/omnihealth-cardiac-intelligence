from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum

class FusionStatus(str, Enum):
    AGREEMENT = "agreement"
    COMPLEMENTARY = "complementary"
    CONFLICT = "conflict"
    MISSING_MODALITY = "missing_modality"
    INSUFFICIENT = "insufficient"

class HistoryRelationship(str, Enum):
    SIMILAR = "similar"
    PERSISTENT = "persistent"
    CHANGED = "changed"
    NEW = "new"
    CONFLICTING = "conflicting"
    UNKNOWN = "unknown"

class ECGEvidenceSchema(BaseModel):
    modality: Literal["ECG"] = "ECG"
    finding: str
    confidence: Optional[float] = None  # Only if calibrated
    supporting_evidence: List[str] = Field(default_factory=list)
    model_name: str = "ECG-CNN-PTB-XL"
    model_version: str = "0.1.0"
    limitations: List[str] = Field(default_factory=list)
    raw_predictions: Optional[Dict[str, float]] = None
    waveform_regions: Optional[List[Dict[str, Any]]] = None  # For explainability
    signal_samples: Optional[Dict[str, List[float]]] = None  # 12-lead downsampled voltage points for interactive waveform viewer
    heart_rate: Optional[int] = None
    pr_interval: Optional[int] = None
    qrs_duration: Optional[int] = None
    qtc_interval: Optional[int] = None
    rhythm_type: Optional[str] = None

class EchoEvidenceSchema(BaseModel):
    modality: Literal["Echocardiogram"] = "Echocardiogram"
    finding: str
    confidence: Optional[float] = None
    evidence: List[str] = Field(default_factory=list)
    visual_evidence_path: Optional[str] = None  # Grad-CAM output overlay path
    model_name: str = "EchoNet-Dynamic (Lite)"
    model_version: str = "0.1.0"
    limitations: List[str] = Field(default_factory=list)
    raw_predictions: Optional[Dict[str, Any]] = None
    lvef: Optional[float] = None

class FusionResultSchema(BaseModel):
    status: FusionStatus
    ecg_finding: Optional[str] = None
    echo_finding: Optional[str] = None
    agreement_summary: str
    conflict_description: Optional[str] = None
    missing_modalities: List[str] = Field(default_factory=list)
    combined_evidence: List[str] = Field(default_factory=list)
    fusion_confidence: Optional[float] = None

class HistoryAnalysisSchema(BaseModel):
    relationship: HistoryRelationship
    previous_ecg_finding: Optional[str] = None
    previous_echo_finding: Optional[str] = None
    current_summary: str
    changes_detected: List[str] = Field(default_factory=list)
    persistent_findings: List[str] = Field(default_factory=list)
    new_findings: List[str] = Field(default_factory=list)
    analysis_notes: str = ""

class DifferentialDiagnosisSchema(BaseModel):
    condition: str
    probability: str
    evidence: str
    status: Literal["suspected", "secondary", "ruled_out"] = "suspected"

class FinalAssessmentSchema(BaseModel):
    supported_findings: List[str] = Field(default_factory=list)
    primary_assessment: str
    suspected_condition: Optional[str] = None
    clinical_priority: Optional[str] = None
    priority_level: Optional[Literal["critical", "high", "moderate", "routine"]] = "moderate"
    differential_diagnoses: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    diagnostic_recommendations: Optional[List[str]] = Field(default_factory=list)
    ecg_evidence_summary: str
    echo_evidence_summary: str
    historical_evidence_summary: str
    cross_modal_analysis: str
    explanation: str
    limitations: List[str] = Field(default_factory=list)
    evidence_sufficiency: Literal["sufficient", "partial", "insufficient"]
    requires_clinical_review: bool = True

class PatientSchema(BaseModel):
    patient_id: str
    name: Optional[str] = "Anonymous Patient"
    age: Optional[int] = None
    gender: Optional[str] = "Other"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    medical_history_summary: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_email: Optional[str] = None

class OmniHealthReportSchema(BaseModel):
    report_id: str
    patient_id: str
    assessment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ecg_analysis: Optional[ECGEvidenceSchema] = None
    echo_analysis: Optional[EchoEvidenceSchema] = None
    fusion_result: FusionResultSchema
    history_analysis: Optional[HistoryAnalysisSchema] = None
    final_assessment: FinalAssessmentSchema
    pipeline_version: str = "0.1.0"
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_email: Optional[str] = None
    disclaimer: str = (
        "This is an AI-assisted research prototype. "
        "Not for clinical diagnosis. Always consult a qualified physician."
    )
