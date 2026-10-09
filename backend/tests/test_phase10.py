import pytest
import numpy as np
import torch
from pathlib import Path

from backend.explainability.ecg_explainer import (
    compute_ecg_saliency,
    generate_ecg_saliency_figure,
    WaveformRegion,
)
from backend.explainability.gradcam import EchoGradCAM
from backend.models.ecg_model import ECGClassifier
from backend.models.echo_model import EchoNetLite
from backend.utils.signal_processing import generate_synthetic_ecg
from backend.agents.ecg_agent import ecg_agent_node
from backend.graph.state import OmniHealthState

def test_compute_ecg_saliency():
    model = ECGClassifier(n_leads=12, n_classes=5, seq_len=5000)
    ecg = generate_synthetic_ecg(duration_sec=10, fs=500, n_leads=12)

    regions = compute_ecg_saliency(model, ecg, target_class=0, window_size=50)
    assert len(regions) > 0
    assert len(regions) <= 5
    for r in regions:
        assert isinstance(r, WaveformRegion)
        assert 0 <= r.lead < 12
        assert r.start_sample < r.end_sample
        assert r.attribution_score >= 0.0
        r_dict = r.to_dict()
        assert "lead" in r_dict
        assert "attribution_score" in r_dict

def test_generate_ecg_saliency_figure(tmp_path):
    model = ECGClassifier(n_leads=12, n_classes=5, seq_len=5000)
    ecg = generate_synthetic_ecg(duration_sec=6, fs=500, n_leads=12)
    regions = compute_ecg_saliency(model, ecg, target_class=0)

    fig_path = str(tmp_path / "ecg_saliency_lead1.png")
    saved_path = generate_ecg_saliency_figure(ecg, regions, output_path=fig_path, lead_to_plot=0, fs=500)

    assert Path(saved_path).exists()
    assert Path(saved_path).stat().st_size > 1000

def test_echo_gradcam_spatiotemporal(tmp_path):
    model = EchoNetLite()
    gradcam = EchoGradCAM(model, model.conv2[0])
    dummy_video = torch.randn(1, 1, 32, 112, 112)

    cam = gradcam.generate(dummy_video, class_idx=0)
    assert cam.shape == (32, 112, 112)
    assert 0.0 <= cam.min() <= cam.max() <= 1.0

    frame = np.random.randint(0, 255, (112, 112), dtype=np.uint8)
    out_path = str(tmp_path / "echo_gradcam_overlay.jpg")
    saved = EchoGradCAM.save_gradcam_overlay(frame, cam[16], out_path)
    assert Path(saved).exists()
    gradcam.remove_hooks()

def test_ecg_agent_populates_waveform_regions(tmp_path):
    ecg_data = generate_synthetic_ecg(duration_sec=5, fs=500, n_leads=12)
    csv_file = tmp_path / "ecg_explain.csv"
    np.savetxt(csv_file, ecg_data, delimiter=",", header=",".join([f"l{i}" for i in range(12)]), comments="")

    state: OmniHealthState = {
        "patient_id": "PT-EXPLAIN-01",
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

    res_state = ecg_agent_node(state)
    assert res_state["ecg_evidence"] is not None
    assert res_state["ecg_evidence"].waveform_regions is not None
    assert len(res_state["ecg_evidence"].waveform_regions) > 0
