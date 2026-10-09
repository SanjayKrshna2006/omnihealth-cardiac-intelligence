import pytest
import numpy as np
from pathlib import Path
from backend.graph.workflow import get_graph, has_echo, has_history
from backend.graph.state import OmniHealthState
from backend.utils.signal_processing import generate_synthetic_ecg
from backend.utils.video_processing import generate_synthetic_echo_video
from backend.api.schemas import FusionStatus

def test_graph_compilation():
    graph = get_graph()
    assert graph is not None

def test_routing_conditions():
    state_empty: OmniHealthState = {
        "patient_id": "P-0",
        "ecg_file_path": None,
        "echo_file_path": None,
        "previous_ecg_path": None,
        "previous_echo_path": None,
        "previous_reports": None,
        "ecg_evidence": None,
        "echo_evidence": None,
        "fusion_result": None,
        "history_analysis": None,
        "final_assessment": None,
        "errors": [],
        "pipeline_stage": "initialized",
        "missing_modalities": [],
    }
    assert has_echo(state_empty) == "skip_echo"
    assert has_history(state_empty) == "skip_history"

    state_with_files: OmniHealthState = {
        **state_empty,
        "echo_file_path": "echo.mp4",
        "previous_reports": ["Prior normal ECG report."],
    }
    assert has_echo(state_with_files) == "run_echo"
    assert has_history(state_with_files) == "run_history"

def test_full_pipeline_execution(tmp_path):
    # 1. Synthesize ECG CSV
    ecg_data = generate_synthetic_ecg(duration_sec=5, fs=500, n_leads=12)
    ecg_file = tmp_path / "test_ecg.csv"
    np.savetxt(ecg_file, ecg_data, delimiter=",", header=",".join([f"l{i}" for i in range(12)]), comments="")

    # 2. Synthesize Echo MP4
    echo_file = tmp_path / "test_echo.mp4"
    generate_synthetic_echo_video(str(echo_file), duration_sec=2, fps=30)

    # 3. Create prior history text file
    hist_file = tmp_path / "prior_record.txt"
    hist_file.write_text("Prior discharge summary: Normal sinus rhythm with EF 60%.", encoding="utf-8")

    initial_state: OmniHealthState = {
        "patient_id": "PT-GRAPH-FULL",
        "ecg_file_path": str(ecg_file),
        "echo_file_path": str(echo_file),
        "previous_ecg_path": str(hist_file),
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

    graph = get_graph()
    final_state = graph.invoke(initial_state)

    assert final_state["ecg_evidence"] is not None
    assert final_state["echo_evidence"] is not None
    assert final_state["fusion_result"] is not None
    assert final_state["history_analysis"] is not None
    assert final_state["final_assessment"] is not None
    assert final_state["final_assessment"].requires_clinical_review is True
    assert len(final_state["final_assessment"].supported_findings) > 0

def test_ecg_only_pipeline_execution(tmp_path):
    ecg_data = generate_synthetic_ecg(duration_sec=5, fs=500, n_leads=12)
    ecg_file = tmp_path / "ecg_only.csv"
    np.savetxt(ecg_file, ecg_data, delimiter=",", header=",".join([f"l{i}" for i in range(12)]), comments="")

    initial_state: OmniHealthState = {
        "patient_id": "PT-GRAPH-ECG-ONLY",
        "ecg_file_path": str(ecg_file),
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

    graph = get_graph()
    final_state = graph.invoke(initial_state)

    assert final_state["ecg_evidence"] is not None
    assert final_state["echo_evidence"] is None
    assert final_state["fusion_result"] is not None
    assert final_state["fusion_result"].status == FusionStatus.MISSING_MODALITY
    assert "Echo" in final_state["fusion_result"].missing_modalities
    assert final_state["final_assessment"] is not None
    assert final_state["final_assessment"].evidence_sufficiency == "partial"
