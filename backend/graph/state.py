from typing import Optional, TypedDict, Annotated, List
from backend.api.schemas import (
    ECGEvidenceSchema,
    EchoEvidenceSchema,
    FusionResultSchema,
    HistoryAnalysisSchema,
    FinalAssessmentSchema,
)
import operator

class OmniHealthState(TypedDict):
    # Inputs
    patient_id: str
    ecg_file_path: Optional[str]
    echo_file_path: Optional[str]
    previous_ecg_path: Optional[str]
    previous_echo_path: Optional[str]
    previous_reports: Optional[List[str]]

    # Agent outputs (accumulated, not overwritten)
    ecg_evidence: Optional[ECGEvidenceSchema]
    echo_evidence: Optional[EchoEvidenceSchema]
    fusion_result: Optional[FusionResultSchema]
    history_analysis: Optional[HistoryAnalysisSchema]
    final_assessment: Optional[FinalAssessmentSchema]

    # Pipeline control & diagnostics
    errors: Annotated[List[str], operator.add]
    pipeline_stage: str
    missing_modalities: List[str]
