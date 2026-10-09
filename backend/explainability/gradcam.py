import torch
import numpy as np
import cv2
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EchoGradCAM:
    """
    Grad-CAM for 3D spatiotemporal echocardiogram video model.
    Extracts gradient-weighted activation maps from target 3D convolutional layer.
    """
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None
        self._hooks = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self._hooks.append(self.target_layer.register_forward_hook(forward_hook))
        self._hooks.append(self.target_layer.register_full_backward_hook(backward_hook))

    def remove_hooks(self):
        for hook in self._hooks:
            hook.remove()
        self._hooks = []

    def generate(self, input_tensor: torch.Tensor, class_idx: int = 0) -> np.ndarray:
        """
        Generate 3D spatiotemporal CAM for input video tensor.
        Input: (1, 1, T, H, W)
        Returns: numpy array of shape (T, H, W) normalized to [0, 1]
        """
        self.model.eval()
        self.model.zero_grad()

        input_var = input_tensor.clone().detach().requires_grad_(True)
        _, class_out = self.model(input_var)

        if class_out.shape[1] > class_idx:
            score = class_out[0, class_idx]
        else:
            score = class_out[0, 0]

        score.backward()

        if self.gradients is None or self.activations is None:
            # Fallback if hooks were not triggered
            T = input_tensor.shape[2]
            H = input_tensor.shape[3]
            W = input_tensor.shape[4]
            return np.ones((T, H, W), dtype=np.float32) * 0.5

        # Pool gradients across spatial dimensions (keep temporal)
        weights = self.gradients.mean(dim=[3, 4], keepdim=True)  # (1, C, T, 1, 1)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)  # (1, 1, T, H_feat, W_feat)
        cam = torch.relu(cam).squeeze().cpu().numpy()  # (T, H_feat, W_feat)

        # Upsample temporal/spatial CAM to target resolution (T=32, H=112, W=112)
        T_target = input_tensor.shape[2]
        H_target = input_tensor.shape[3]
        W_target = input_tensor.shape[4]

        # Resize each slice spatially
        resized_cam = np.zeros((T_target, H_target, W_target), dtype=np.float32)
        
        # If temporal dimension needs interpolation
        cam_t_len = cam.shape[0] if cam.ndim == 3 else 1
        for t in range(T_target):
            t_idx = int(t * (cam_t_len - 1) / max(1, T_target - 1))
            slice_cam = cam[t_idx] if cam.ndim == 3 else cam
            resized_slice = cv2.resize(slice_cam, (W_target, H_target))
            resized_cam[t] = resized_slice

        # Normalize to [0, 1]
        cam_min, cam_max = resized_cam.min(), resized_cam.max()
        if cam_max > cam_min:
            resized_cam = (resized_cam - cam_min) / (cam_max - cam_min)
        else:
            resized_cam = np.zeros_like(resized_cam)

        return resized_cam

    @staticmethod
    def overlay_on_frame(frame: np.ndarray, cam_slice: np.ndarray) -> np.ndarray:
        """
        Overlay a 2D Grad-CAM heatmap on a grayscale or RGB frame.
        """
        h, w = frame.shape[:2]
        heatmap = cv2.resize(cam_slice, (w, h))
        heatmap_uint8 = np.uint8(255 * np.clip(heatmap, 0, 1))
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        if frame.ndim == 2:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
        else:
            frame_rgb = frame

        overlay = cv2.addWeighted(frame_rgb, 0.6, colored_heatmap, 0.4, 0)
        return overlay

    @staticmethod
    def save_gradcam_overlay(frame: np.ndarray, cam_slice: np.ndarray, output_path: str) -> str:
        """
        Saves the heatmap overlay to output_path and returns the path string.
        """
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        overlay = EchoGradCAM.overlay_on_frame(frame, cam_slice)
        cv2.imwrite(str(path), overlay)
        return str(path)
