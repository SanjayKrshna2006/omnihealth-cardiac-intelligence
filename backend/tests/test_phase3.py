import pytest
import numpy as np
import torch
from pathlib import Path

from backend.utils.video_processing import (
    generate_synthetic_echo_video,
    load_echo_video,
    preprocess_echo_for_model,
    ECHO_FRAME_COUNT,
    ECHO_FRAME_SIZE,
)
from backend.models.echo_model import (
    EchoNetLite,
    EchoModelWrapper,
    LVEF_CLASSES,
)
from backend.explainability.gradcam import EchoGradCAM
from backend.agents.echo_agent import echo_agent_node
from backend.graph.state import OmniHealthState

def test_synthetic_echo_video_and_loading(tmp_path):
    video_file = str(tmp_path / "test_echo.mp4")
    generated_path = generate_synthetic_echo_video(video_file, duration_sec=2, fps=30)
    assert Path(generated_path).exists()

    frames = load_echo_video(generated_path)
    assert frames.shape == (ECHO_FRAME_COUNT, ECHO_FRAME_SIZE[1], ECHO_FRAME_SIZE[0])
    assert frames.dtype == np.uint8

    tensor = preprocess_echo_for_model(frames)
    assert tensor.shape == (1, 1, 32, 112, 112)
    assert tensor.dtype == torch.float32

def test_echonet_lite_forward():
    model = EchoNetLite()
    model.eval()

    dummy_input = torch.randn(1, 1, 32, 112, 112)
    with torch.no_grad():
        lvef, logits = model(dummy_input)

    assert lvef.shape == (1, 1)
    assert logits.shape == (1, 3)

def test_echo_gradcam_generation(tmp_path):
    model = EchoNetLite()
    model.eval()

    gradcam = EchoGradCAM(model, model.conv2[0])
    dummy_input = torch.randn(1, 1, 32, 112, 112)

    cam = gradcam.generate(dummy_input, class_idx=0)
    assert cam.shape == (32, 112, 112)
    assert cam.min() >= 0.0
    assert cam.max() <= 1.0

    gradcam.remove_hooks()

    # Test overlay saving
    frame = np.random.randint(0, 255, (112, 112), dtype=np.uint8)
    cam_slice = cam[16]
    overlay_path = str(tmp_path / "gradcam_overlay.jpg")
    saved_path = EchoGradCAM.save_gradcam_overlay(frame, cam_slice, overlay_path)
    assert Path(saved_path).exists()

def test_echo_model_wrapper():
    wrapper = EchoModelWrapper(mock_mode=False)
    dummy_tensor = torch.randn(1, 1, 32, 112, 112)
    preds = wrapper.predict(dummy_tensor)

    assert "lvef_estimate" in preds
    assert "class_probabilities" in preds
    assert "predicted_class" in preds
    assert 20.0 <= preds["lvef_estimate"] <= 75.0
    assert preds["predicted_class"] in LVEF_CLASSES

    # Mock mode check
    mock_wrapper = EchoModelWrapper(mock_mode=True)
    mock_preds = mock_wrapper.predict(dummy_tensor)
    assert mock_preds["lvef_estimate"] == 58.2

def test_echo_agent_node_with_video(tmp_path):
    video_file = str(tmp_path / "echo_clip.mp4")
    generate_synthetic_echo_video(video_file, duration_sec=2, fps=30)

    state: OmniHealthState = {
        "patient_id": "PT-ECHO-01",
        "ecg_file_path": None,
        "echo_file_path": video_file,
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

    updated_state = echo_agent_node(state)
    assert updated_state["pipeline_stage"] == "echo_analysis"
    assert updated_state["echo_evidence"] is not None
    assert updated_state["echo_evidence"].modality == "Echocardiogram"
    assert "Estimated Left Ventricular Ejection Fraction (LVEF)" in updated_state["echo_evidence"].evidence[0]
    assert updated_state["echo_evidence"].visual_evidence_path is not None
    assert Path(updated_state["echo_evidence"].visual_evidence_path).exists()

def test_echo_agent_node_missing_video():
    state: OmniHealthState = {
        "patient_id": "PT-ECHO-NONE",
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

    updated_state = echo_agent_node(state)
    assert "Echo" in updated_state["missing_modalities"]
    assert updated_state["echo_evidence"] is None
