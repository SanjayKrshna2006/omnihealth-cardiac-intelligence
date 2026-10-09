import cv2
import numpy as np
from pathlib import Path
import torch
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

ECHO_FRAME_SIZE: Tuple[int, int] = (112, 112)
ECHO_FRAME_COUNT: int = 32  # Standard clip length for EchoNet-Dynamic

def load_echo_video(file_path: str) -> np.ndarray:
    """
    Load echocardiogram video and return as (T=32, H=112, W=112) grayscale numpy array.
    Samples ECHO_FRAME_COUNT evenly-spaced frames.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Echo video file not found: {file_path}")

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {file_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        # If frame count is unavailable, read sequentially
        raw_frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            raw_frames.append(frame)
        cap.release()
        total_frames = len(raw_frames)
        if total_frames == 0:
            raise ValueError(f"Video file is empty or corrupted: {file_path}")
        indices = np.linspace(0, total_frames - 1, ECHO_FRAME_COUNT, dtype=int)
        sampled_frames = [raw_frames[i] for i in indices]
    else:
        indices = np.linspace(0, total_frames - 1, ECHO_FRAME_COUNT, dtype=int)
        sampled_frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if ret and frame is not None:
                sampled_frames.append(frame)
            else:
                # If seek failed, create a black frame placeholder
                sampled_frames.append(np.zeros((ECHO_FRAME_SIZE[1], ECHO_FRAME_SIZE[0], 3), dtype=np.uint8))
        cap.release()

    processed_frames = []
    for frame in sampled_frames:
        resized = cv2.resize(frame, ECHO_FRAME_SIZE)
        if resized.ndim == 3 and resized.shape[2] == 3:
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        elif resized.ndim == 2:
            gray = resized
        else:
            gray = resized[:, :, 0]
        processed_frames.append(gray)

    return np.stack(processed_frames)  # Shape: (32, 112, 112)

def preprocess_echo_for_model(frames: np.ndarray) -> torch.Tensor:
    """
    Normalize and reshape echo frames for EchoNet-Dynamic 3D model input.
    Input: (T=32, H=112, W=112) uint8
    Output: torch.Tensor of shape (1, 1, T=32, H=112, W=112)
    """
    normalized = frames.astype(np.float32) / 255.0
    mean, std = 0.1307, 0.3081  # EchoNet-Dynamic standard normalization
    normalized = (normalized - mean) / std
    tensor = torch.tensor(normalized, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
    return tensor

def generate_synthetic_echo_video(output_path: str, duration_sec: int = 2, fps: int = 30) -> str:
    """
    Generate a synthetic apical 4-chamber pulsating echocardiogram clip for testing.
    Saves to output_path and returns the path.
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    total_frames = duration_sec * fps
    width, height = 224, 224
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(path), fourcc, fps, (width, height), isColor=True)

    for i in range(total_frames):
        # Create dark ultrasound background with sector cone
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Sector beam background
        pts = np.array([[width // 2, 20], [20, height - 20], [width - 20, height - 20]], np.int32)
        cv2.fillPoly(img, [pts], (30, 30, 30))

        # Pulsating heart chamber (sinusoidal expansion / contraction)
        phase = 2 * np.pi * (i / (fps * 0.8))  # ~75 bpm
        radius = int(35 + 10 * np.sin(phase))

        # Left ventricle ellipse
        center = (width // 2, height // 2 + 10)
        cv2.ellipse(img, center, (radius, radius + 15), 0, 0, 360, (180, 180, 180), 2)
        cv2.circle(img, (center[0] - 15, center[1] + 10), radius // 2, (100, 100, 100), 1)

        # Speckle noise typical of ultrasound
        noise = np.random.normal(0, 15, img.shape).astype(np.int16)
        noisy_img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        out.write(noisy_img)

    out.release()
    return str(path)
