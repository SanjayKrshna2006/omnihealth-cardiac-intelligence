import pytest
import numpy as np
import os
import tempfile
from pathlib import Path
import torch

from backend.utils.signal_processing import (
    generate_synthetic_ecg,
    load_ecg_signal,
    preprocess_ecg,
    extract_ecg_features,
)
from backend.models.ecg_model import (
    ECGClassifier,
    ECGModelWrapper,
    ECG_LABELS,
)
from backend.agents.ecg_agent import ecg_agent_node
from backend.graph.state import OmniHealthState

def test_synthetic_ecg_and_preprocessing():
    # Generate 12-lead synthetic ECG (5 seconds at 500 Hz = 2500 samples)
    ecg = generate_synthetic_ecg(duration_sec=5, fs=500, n_leads=12)
    assert ecg.shape == (2500, 12)

    # Preprocess
    preprocessed = preprocess_ecg(ecg, fs=500)
    assert "lead_0" in preprocessed
    assert "lead_11" in preprocessed
    assert "cleaned_signal" in preprocessed["lead_0"]

    # Feature extraction
    features = extract_ecg_features(preprocessed)
    assert isinstance(features, np.ndarray)

def test_ecg_classifier_forward():
    model = ECGClassifier(n_leads=12, n_classes=5, seq_len=5000)
    model.eval()

    # Input: (batch=2, leads=12, seq_len=5000)
    dummy_input = torch.randn(2, 12, 5000)
    with torch.no_grad():
        output = model(dummy_input)

    assert output.shape == (2, 5)

def test_ecg_model_wrapper_predictions():
    wrapper = ECGModelWrapper(mock_mode=False)
    ecg = generate_synthetic_ecg(duration_sec=10, fs=500, n_leads=12)
    preds = wrapper.predict(ecg)

    assert len(preds) == len(ECG_LABELS)
    for label in ECG_LABELS:
        assert label in preds
        assert 0.0 <= preds[label] <= 1.0

    # Probabilities should sum to approximately 1.0
    total_prob = sum(preds.values())
    assert pytest.approx(total_prob, 0.01) == 1.0

    # Test mock mode
    mock_wrapper = ECGModelWrapper(mock_mode=True)
    mock_preds = mock_wrapper.predict(ecg)
    assert mock_preds["NORM"] == 0.78

def test_ecg_agent_node_with_file(tmp_path):
    # Create temporary CSV ECG file
    ecg_data = generate_synthetic_ecg(duration_sec=6, fs=500, n_leads=12)
    csv_file = tmp_path / "sample_ecg.csv"
    
    # Save header + data
    header = ",".join([f"lead_{i}" for i in range(12)])
    np.savetxt(csv_file, ecg_data, delimiter=",", header=header, comments="")

    state: OmniHealthState = {
        "patient_id": "PT-ECG-01",
        "ecg_file_path": str(csv_file),
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

    updated_state = ecg_agent_node(state)
    assert updated_state["pipeline_stage"] == "ecg_analysis"
    assert updated_state["ecg_evidence"] is not None
    assert updated_state["ecg_evidence"].modality == "ECG"
    assert len(updated_state["ecg_evidence"].supporting_evidence) > 0
    assert updated_state["ecg_evidence"].raw_predictions is not None

def test_ecg_agent_node_missing_file():
    state: OmniHealthState = {
        "patient_id": "PT-ECG-NONE",
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

    updated_state = ecg_agent_node(state)
    assert "ECG" in updated_state["missing_modalities"]
    assert updated_state["ecg_evidence"] is None
