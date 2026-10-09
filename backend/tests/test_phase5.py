import pytest
from pathlib import Path
from backend.agents.history_agent import (
    history_agent_node,
    _rule_based_history_comparison,
    _extract_text_from_file_or_string,
)
from backend.api.schemas import (
    HistoryRelationship,
    FusionResultSchema,
    FusionStatus,
    ECGEvidenceSchema,
    EchoEvidenceSchema,
)
from backend.graph.state import OmniHealthState

def test_history_empty():
    result = _rule_based_history_comparison(
        history_text="",
        current_summary="Normal sinus rhythm with normal EF",
        fusion=None,
        ecg_finding="Normal sinus rhythm",
        echo_finding="Normal EF (≥55%)"
    )
    assert result.relationship == HistoryRelationship.UNKNOWN
    assert len(result.changes_detected) == 0

def test_history_similar_normal():
    result = _rule_based_history_comparison(
        history_text="Prior ECG from 2024: Normal sinus rhythm, HR 72, normal axis.",
        current_summary="Concordant normal findings",
        fusion=None,
        ecg_finding="Normal sinus rhythm",
        echo_finding="Normal EF (≥55%)"
    )
    assert result.relationship == HistoryRelationship.SIMILAR
    assert "Normal baseline" in result.persistent_findings[0]

def test_history_persistent_pathology():
    result = _rule_based_history_comparison(
        history_text="Prior discharge summary 2023: Documented anterior wall myocardial infarction.",
        current_summary="Concordant MI with reduced EF",
        fusion=None,
        ecg_finding="ECG pattern consistent with myocardial infarction changes.",
        echo_finding="Reduced EF (≤40%)"
    )
    assert result.relationship == HistoryRelationship.PERSISTENT
    assert "persists" in result.persistent_findings[0] or "persistence" in result.analysis_notes.lower()

def test_history_changed_worsening():
    result = _rule_based_history_comparison(
        history_text="Routine checkup 2025: Normal ECG, normal echocardiogram with EF 60%.",
        current_summary="Reduced ejection fraction detected",
        fusion=None,
        ecg_finding="ST-segment and T-wave changes detected",
        echo_finding="Reduced EF (≤40%)"
    )
    assert result.relationship == HistoryRelationship.CHANGED
    assert len(result.changes_detected) > 0

def test_extract_text_from_file(tmp_path):
    txt_file = tmp_path / "prior_record.txt"
    txt_file.write_text("Patient underwent baseline echo in 2022. Normal LV size and function.", encoding="utf-8")

    extracted = _extract_text_from_file_or_string(str(txt_file))
    assert "baseline echo in 2022" in extracted

    # String test
    raw_str = "Prior report text directly in memory."
    assert _extract_text_from_file_or_string(raw_str) == raw_str

def test_history_agent_node_no_history():
    state: OmniHealthState = {
        "patient_id": "PT-HIST-01",
        "ecg_file_path": None,
        "echo_file_path": None,
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

    updated_state = history_agent_node(state)
    assert updated_state["pipeline_stage"] == "history_analysis"
    assert updated_state["history_analysis"] is not None
    assert updated_state["history_analysis"].relationship == HistoryRelationship.UNKNOWN

def test_history_agent_node_with_history(tmp_path):
    prior_file = tmp_path / "prior_ecg.txt"
    prior_file.write_text("Prior ECG: Normal sinus rhythm without acute ischemic changes.", encoding="utf-8")

    ecg = ECGEvidenceSchema(
        finding="Normal sinus rhythm",
        confidence=0.92,
        supporting_evidence=["NORM: 92%"],
        limitations=[]
    )
    fusion = FusionResultSchema(
        status=FusionStatus.AGREEMENT,
        agreement_summary="Normal electrical and mechanical function",
        combined_evidence=[]
    )

    state: OmniHealthState = {
        "patient_id": "PT-HIST-02",
        "ecg_file_path": None,
        "echo_file_path": None,
        "previous_ecg_path": str(prior_file),
        "previous_echo_path": None,
        "previous_reports": ["Prior echo: EF 65%"],
        "ecg_evidence": ecg,
        "echo_evidence": None,
        "fusion_result": fusion,
        "history_analysis": None,
        "final_assessment": None,
        "errors": [],
        "pipeline_stage": "initialized",
        "missing_modalities": [],
    }

    updated_state = history_agent_node(state)
    assert updated_state["history_analysis"] is not None
    assert updated_state["history_analysis"].relationship == HistoryRelationship.SIMILAR
