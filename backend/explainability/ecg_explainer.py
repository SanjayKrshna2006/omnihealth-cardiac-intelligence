import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server-side generation
import matplotlib.pyplot as plt
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

@dataclass
class WaveformRegion:
    lead: int
    start_sample: int
    end_sample: int
    attribution_score: float
    label: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lead": int(self.lead),
            "start_sample": int(self.start_sample),
            "end_sample": int(self.end_sample),
            "attribution_score": round(float(self.attribution_score), 4),
            "label": str(self.label),
        }

def compute_ecg_saliency(
    model: torch.nn.Module,
    signal: np.ndarray,
    target_class: int = 0,
    window_size: int = 50,
) -> List[WaveformRegion]:
    """
    Computes input gradient saliency attribution for 12-lead ECG signal.
    Identifies the highest-attribution temporal windows contributing to the target classification.
    """
    model.eval()
    if signal.ndim == 1:
        signal = signal.reshape(-1, 1)

    samples, leads = signal.shape
    target_leads = 12
    target_len = 5000

    # Standardize input to (1, 12, 5000)
    formatted = signal.copy()
    if leads < target_leads:
        padding = np.tile(formatted, (1, int(np.ceil(target_leads / leads))))
        formatted = padding[:, :target_leads]
    elif leads > target_leads:
        formatted = formatted[:, :target_leads]

    if samples < target_len:
        pad_width = target_len - samples
        formatted = np.pad(formatted, ((0, pad_width), (0, 0)), mode="edge")
    elif samples > target_len:
        formatted = formatted[:target_len, :]

    tensor = torch.tensor(formatted.T, dtype=torch.float32).unsqueeze(0)
    tensor.requires_grad_(True)

    logits = model(tensor)
    if logits.shape[1] > target_class:
        score = logits[0, target_class]
    else:
        score = logits[0, 0]

    score.backward()

    if tensor.grad is None:
        return []

    saliency = tensor.grad.data.abs().squeeze().cpu().numpy()  # (12, 5000)
    regions: List[WaveformRegion] = []

    for lead_idx in range(min(12, saliency.shape[0])):
        lead_sal = saliency[lead_idx]
        n_windows = len(lead_sal) // window_size
        if n_windows == 0:
            continue

        window_scores = [
            float(lead_sal[i * window_size : (i + 1) * window_size].mean())
            for i in range(n_windows)
        ]
        top_window = int(np.argmax(window_scores))
        max_score = window_scores[top_window]

        regions.append(
            WaveformRegion(
                lead=lead_idx,
                start_sample=top_window * window_size,
                end_sample=(top_window + 1) * window_size,
                attribution_score=max_score,
                label=f"Lead {lead_idx + 1} Saliency Peak (Samples {top_window * window_size}-{(top_window + 1) * window_size})",
            )
        )

    # Sort by attribution score and return top 5
    sorted_regions = sorted(regions, key=lambda r: -r.attribution_score)
    return sorted_regions[:5]

def generate_ecg_saliency_figure(
    signal: np.ndarray,
    regions: List[WaveformRegion],
    output_path: str,
    lead_to_plot: int = 0,
    fs: int = 500,
) -> str:
    """
    Plots the lead waveform with highlighted salient regions and saves to disk.
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    if signal.ndim == 1:
        lead_signal = signal
    else:
        lead_idx = min(lead_to_plot, signal.shape[1] - 1)
        lead_signal = signal[:, lead_idx]

    time_axis = np.arange(len(lead_signal)) / fs

    plt.figure(figsize=(10, 3.5), dpi=150)
    plt.plot(time_axis, lead_signal, color="#1e293b", linewidth=1.2, label=f"Lead {lead_to_plot + 1} Waveform")

    # Highlight salient regions for this lead
    lead_regions = [r for r in regions if r.lead == lead_to_plot]
    for r in lead_regions:
        start_t = r.start_sample / fs
        end_t = r.end_sample / fs
        if start_t < time_axis[-1]:
            plt.axvspan(
                start_t,
                min(end_t, time_axis[-1]),
                color="#ef4444",
                alpha=0.35,
                label="High Saliency Attribution Region" if "High Saliency" not in plt.gca().get_legend_handles_labels()[1] else "",
            )

    plt.title(f"12-Lead ECG Waveform Saliency Attribution (Lead {lead_to_plot + 1})", fontsize=11, fontweight="bold", pad=10)
    plt.xlabel("Time (seconds)", fontsize=9)
    plt.ylabel("Voltage (mV)", fontsize=9)
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.legend(loc="upper right", fontsize=8)
    plt.tight_layout()

    plt.savefig(str(path), dpi=150)
    plt.close()
    return str(path)
