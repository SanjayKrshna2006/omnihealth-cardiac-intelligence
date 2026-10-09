import pytest
from backend.agents.fusion_agent import fusion_agent_node, _rule_based_fusion
from backend.api.schemas import (
    ECGEvidenceSchema,
    EchoEvidenceSchema,
    FusionStatus,
)
from backend.graph.state import OmniHealthState

def test_fusion_both_missing():
    result = _rule_based_fusion(None, None)
    assert result.status == FusionStatus.MISSING_MODALITY
    assert "ECG" in result.missing_modalities
    assert "Echo" in result.missing_modalities
    assert len(result.combined_evidence) == 0

def test_fusion_single_modality():
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm — no significant electrical abnormalities detected.",
        confidence=0.95,
        supporting_evidence=["NORM: 95%"],
        limitations=[]
    )
    result = _rule_based_fusion(ecg, None)
    assert result.status == FusionStatus.MISSING_MODALITY
    assert result.missing_modalities == ["Echo"]
    assert result.ecg_finding == ecg.finding
    assert result.echo_finding is None

def test_fusion_agreement_normal():
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm — no significant electrical abnormalities detected.",
        confidence=0.92,
        supporting_evidence=["NORM: 92%"],
        limitations=[]
    )
    echo = EchoEvidenceSchema(
        finding="Normal EF (≥55%)",
        confidence=0.88,
        evidence=["Estimated LVEF: 62%"],
        limitations=[]
    )
    result = _rule_based_fusion(ecg, echo)
    assert result.status == FusionStatus.AGREEMENT
    assert "Concordant normal findings" in result.agreement_summary
    assert result.conflict_description is None
    assert len(result.combined_evidence) >= 2

def test_fusion_agreement_pathological():
    ecg = ECGEvidenceSchema(
        finding="ECG pattern consistent with myocardial infarction changes.",
        confidence=0.85,
        supporting_evidence=["MI: 85%"],
        limitations=[]
    )
    echo = EchoEvidenceSchema(
        finding="Reduced EF (≤40%)",
        confidence=0.90,
        evidence=["Estimated LVEF: 35%"],
        limitations=[]
    )
    result = _rule_based_fusion(ecg, echo)
    assert result.status == FusionStatus.AGREEMENT
    assert "Concordant pathological findings" in result.agreement_summary

def test_fusion_complementary():
    ecg = ECGEvidenceSchema(
        finding="ST-segment and T-wave changes detected — indicative of possible myocardial ischemia or strain.",
        confidence=0.79,
        supporting_evidence=["STTC: 79%"],
        limitations=[]
    )
    echo = EchoEvidenceSchema(
        finding="Normal EF (≥55%)",
        confidence=0.86,
        evidence=["Estimated LVEF: 58%"],
        limitations=[]
    )
    result = _rule_based_fusion(ecg, echo)
    assert result.status == FusionStatus.COMPLEMENTARY
    assert "Complementary findings" in result.agreement_summary

def test_fusion_conflict():
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm — no significant electrical or repolarization abnormalities detected.",
        confidence=0.95,
        supporting_evidence=["NORM: 95%"],
        limitations=[]
    )
    echo = EchoEvidenceSchema(
        finding="Reduced EF (≤40%)",
        confidence=0.91,
        evidence=["Estimated LVEF: 28%"],
        limitations=[]
    )
    result = _rule_based_fusion(ecg, echo)
    assert result.status == FusionStatus.CONFLICT
    assert result.conflict_description is not None
    assert "discordant" in result.conflict_description.lower() or "discrepancy" in result.agreement_summary.lower()

def test_fusion_agent_node():
    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm",
        confidence=0.92,
        supporting_evidence=["NORM: 92%"],
        limitations=[]
    )
    echo = EchoEvidenceSchema(
        finding="Normal EF (≥55%)",
        confidence=0.88,
        evidence=["Estimated LVEF: 62%"],
        limitations=[]
    )
    state: OmniHealthState = {
        "patient_id": "PT-FUSION-01",
        "ecg_file_path": "/path/to/ecg.csv",
        "echo_file_path": "/path/to/echo.mp4",
        "previous_ecg_path": None,
        "previous_echo_path": None,
        "previous_reports": [],
        "ecg_evidence": ecg,
        "echo_evidence": echo,
        "fusion_result": None,
        "history_analysis": None,
        "final_assessment": None,
        "errors": [],
        "pipeline_stage": "initialized",
        "missing_modalities": [],
    }

    updated_state = fusion_agent_node(state)
    assert updated_state["pipeline_stage"] == "multimodal_fusion"
    assert updated_state["fusion_result"] is not None
    assert updated_state["fusion_result"].status in [FusionStatus.AGREEMENT, FusionStatus.COMPLEMENTARY]
