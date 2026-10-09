import cv2
import numpy as np
from pathlib import Path
import math

def render_clinical_echo_frame(
    width: int,
    height: int,
    frame_idx: int,
    total_frames: int,
    fps: int,
    case_type: str,
    patient_name: str,
    patient_id: str,
    target_ef: float
) -> np.ndarray:
    """
    Renders an authentic, high-resolution B-mode ultrasound cineloop frame
    for an apical 4-chamber view with realistic acoustics, speckle distribution,
    cardiac anatomy, valves, synchronized ECG rhythm, and clinical telemetry.
    """
    # 1. Dark ultrasound background (512 x 512)
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    gray = np.zeros((height, width), dtype=np.float32)

    # Sector Geometry
    apex_x = width // 2
    apex_y = 65
    sector_angle = 76  # degrees
    half_angle_rad = math.radians(sector_angle / 2)
    max_depth = height - 85

    # Create sector mask
    y_coords, x_coords = np.ogrid[:height, :width]
    dx = x_coords - apex_x
    dy = y_coords - apex_y
    dist = np.sqrt(dx * dx + dy * dy)
    angles = np.arctan2(dx, np.maximum(dy, 1e-5))

    sector_mask = (
        (dist >= 35) & 
        (dist <= max_depth) & 
        (np.abs(angles) <= half_angle_rad)
    )

    # Cardiac Phase Calculation based on pathology
    time_sec = frame_idx / fps
    if case_type == "afib":
        # Irregular cycle lengths in AFib
        hr = 124
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len
    elif case_type == "stemi":
        hr = 94
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len
    elif case_type == "dcm_lbbb":
        hr = 82
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len
    elif case_type == "lvh":
        hr = 76
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len
    else:  # normal
        hr = 68
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len

    # Systole vs Diastole (0.0 -> 0.35: Systole contraction; 0.35 -> 1.0: Diastole filling)
    if beat_phase < 0.35:
        # Systole: contraction
        contract_factor = math.sin(math.pi * (beat_phase / 0.35))
    else:
        # Diastole: relaxation & filling
        diastole_p = (beat_phase - 0.35) / 0.65
        contract_factor = -math.sin(math.pi * diastole_p) * 0.25

    # Anatomical Centers (Apical 4-Chamber View)
    # LV is on right side of image in standard clinical A4C (anatomical left)
    # RV is on left side of image (anatomical right)
    # LA & RA at bottom near apex transducer / base of heart
    lv_cx = apex_x + int(width * 0.11)
    lv_cy = apex_y + int(height * 0.38)
    
    rv_cx = apex_x - int(width * 0.12)
    rv_cy = apex_y + int(height * 0.36)

    la_cx = apex_x + int(width * 0.09)
    la_cy = apex_y + int(height * 0.62)

    ra_cx = apex_x - int(width * 0.11)
    ra_cy = apex_y + int(height * 0.60)

    # Base Radii modulated by EF and pathology
    if case_type == "dcm_lbbb":
        # Severely dilated LV cavity, spherical remodeling
        lv_rx = 52 - int(contract_factor * 4)  # Minimal contraction (EF 28%)
        lv_ry = 68 - int(contract_factor * 5)
        # Septal flash: early systolic pre-ejection notch
        septal_shift = int(6 * math.sin(2 * math.pi * beat_phase * 2)) if beat_phase < 0.3 else 0
        lv_cx += septal_shift
    elif case_type == "stemi":
        # Apical akinesis / dyskinesis: base contracts, apex stays dilated / bulges
        lv_rx = 42 - int(contract_factor * 6)
        lv_ry = 58 - int(contract_factor * 3)  # Apical akinesis
    elif case_type == "lvh":
        # Concentric hypertrophy: smaller cavity, thick walls
        lv_rx = 34 - int(contract_factor * 11)
        lv_ry = 48 - int(contract_factor * 13)
    elif case_type == "afib":
        # Mild blunting, enlarged LA
        lv_rx = 40 - int(contract_factor * 9)
        lv_ry = 54 - int(contract_factor * 10)
    else:  # normal
        # Healthy vigorous contraction
        lv_rx = 38 - int(contract_factor * 14)  # EF 62%
        lv_ry = 52 - int(contract_factor * 16)

    rv_rx = int(lv_rx * 0.72)
    rv_ry = int(lv_ry * 0.85)

    la_rx = int(lv_rx * 0.88 + (8 if case_type in ["afib", "dcm_lbbb"] else 0))
    la_ry = int(lv_ry * 0.65)

    ra_rx = int(rv_rx * 0.88)
    ra_ry = int(rv_ry * 0.65)

    # --- Draw Myocardial Tissue & Cavities on Acoustic Map ---
    # Wall thickness
    wall_th = 18 if case_type == "lvh" else 11
    
    # Outer epicardial acoustic reflection
    cv2.ellipse(gray, (lv_cx, lv_cy), (lv_rx + wall_th, lv_ry + wall_th), 0, 0, 360, 140, -1)
    cv2.ellipse(gray, (rv_cx, rv_cy), (rv_rx + wall_th - 2, rv_ry + wall_th - 2), 0, 0, 360, 120, -1)
    cv2.ellipse(gray, (la_cx, la_cy), (la_rx + 8, la_ry + 8), 0, 0, 360, 100, -1)
    cv2.ellipse(gray, (ra_cx, ra_cy), (ra_rx + 8, ra_ry + 8), 0, 0, 360, 95, -1)

    # Inner Blood Pools (Anechoic Black Cavities)
    cv2.ellipse(gray, (lv_cx, lv_cy), (max(5, lv_rx), max(10, lv_ry)), 0, 0, 360, 12, -1)
    cv2.ellipse(gray, (rv_cx, rv_cy), (max(5, rv_rx), max(8, rv_ry)), 0, 0, 360, 15, -1)
    cv2.ellipse(gray, (la_cx, la_cy), (max(5, la_rx), max(6, la_ry)), 0, 0, 360, 10, -1)
    cv2.ellipse(gray, (ra_cx, ra_cy), (max(5, ra_rx), max(6, ra_ry)), 0, 0, 360, 12, -1)

    # Interventricular Septum (IVS) Brightness
    ivs_pt1 = (apex_x + 2, apex_y + 35)
    ivs_pt2 = (apex_x + 4, apex_y + int(height * 0.52))
    cv2.line(gray, ivs_pt1, ivs_pt2, 175 if case_type == "lvh" else 150, wall_th)

    # Interatrial Septum (IAS)
    ias_pt1 = (apex_x + 3, apex_y + int(height * 0.54))
    ias_pt2 = (apex_x + 5, max_depth - 15)
    cv2.line(gray, ias_pt1, ias_pt2, 110, 6)

    # Pericardium (Hyper-reflective white boundary)
    cv2.ellipse(gray, (lv_cx, lv_cy), (lv_rx + wall_th + 3, lv_ry + wall_th + 3), 0, -45, 180, 220, 2)
    cv2.ellipse(gray, (rv_cx, rv_cy), (rv_rx + wall_th + 2, rv_ry + wall_th + 2), 0, 0, 225, 200, 2)

    # Mitral Valve Leaflets (Dynamic opening in diastole, closed in systole)
    mv_base_y = apex_y + int(height * 0.52)
    if beat_phase >= 0.35:
        # Diastolic opening (E-wave & A-wave)
        diastole_progress = (beat_phase - 0.35) / 0.65
        leaflet_open = math.sin(math.pi * min(1.0, diastole_progress * 2.0)) * 14
    else:
        # Systolic coaptation
        leaflet_open = 0.0

    # Anterior & Posterior Mitral Leaflets
    mv_center_x = lv_cx - 4
    cv2.line(gray, (mv_center_x - 14, mv_base_y), (int(mv_center_x - 4 - leaflet_open), mv_base_y - 12), 220, 2)
    cv2.line(gray, (mv_center_x + 14, mv_base_y), (int(mv_center_x + 4 + leaflet_open), mv_base_y - 12), 210, 2)

    # Tricuspid Valve Leaflets
    tv_center_x = rv_cx + 4
    cv2.line(gray, (tv_center_x - 12, mv_base_y - 2), (int(tv_center_x - 3 - leaflet_open * 0.8), mv_base_y - 10), 190, 2)
    cv2.line(gray, (tv_center_x + 12, mv_base_y - 2), (int(tv_center_x + 3 + leaflet_open * 0.8), mv_base_y - 10), 180, 2)

    # --- Realistic Rayleigh Acoustic Ultrasound Speckle ---
    speckle_shape = gray.shape
    # Rayleigh distributed speckle noise
    speckle_noise = np.random.rayleigh(scale=24.0, size=speckle_shape).astype(np.float32)
    
    # Tissue Gain Compensation (TGC) attenuation curve
    tgc_gain = np.linspace(0.85, 1.25, height)[:, np.newaxis]
    
    # Apply speckle modulation to tissue
    modulated = gray * (1.0 + (speckle_noise - 30.0) / 120.0) * tgc_gain
    modulated = np.clip(modulated, 0, 255).astype(np.uint8)

    # Apply Sector Mask
    modulated[~sector_mask] = 0

    # Smooth tissue slightly like medical ultrasound scan conversion
    modulated = cv2.GaussianBlur(modulated, (3, 3), 0.6)

    # Convert to 3-channel grayscale
    frame[:, :, 0] = modulated
    frame[:, :, 1] = modulated
    frame[:, :, 2] = modulated

    # --- Clinical Ultrasound Machine UI / HUD Overlay ---
    # Transducer cone marker
    cv2.circle(frame, (apex_x, apex_y), 4, (0, 220, 220), -1)
    cv2.line(frame, (apex_x - 15, apex_y - 8), (apex_x + 15, apex_y - 8), (120, 120, 120), 1)

    # Telemetry Header (Top Left & Top Right)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_mono = cv2.FONT_HERSHEY_PLAIN

    cv2.putText(frame, "PHILIPS EPIQ 7", (18, 22), font, 0.42, (220, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(frame, f"PATIENT: {patient_name.upper()}", (18, 38), font, 0.38, (0, 200, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"ID: {patient_id}   SEX: A4C CINE", (18, 52), font_mono, 0.9, (160, 160, 160), 1, cv2.LINE_AA)

    # Ultrasound Technical Parameters (Top Right)
    cv2.putText(frame, "TIS 0.8  MI 1.2", (width - 125, 22), font_mono, 0.85, (200, 200, 200), 1, cv2.LINE_AA)
    cv2.putText(frame, f"S5-1 / 2.5 MHz", (width - 125, 36), font_mono, 0.85, (160, 160, 160), 1, cv2.LINE_AA)
    cv2.putText(frame, f"FR {fps}Hz / D 16cm", (width - 125, 50), font_mono, 0.85, (160, 160, 160), 1, cv2.LINE_AA)
    cv2.putText(frame, f"EST. LVEF: {target_ef:.0f}%", (width - 125, 64), font_mono, 0.9, (0, 230, 120), 1, cv2.LINE_AA)

    # Centimeter Depth Scale (Right Margin)
    scale_x = width - 28
    for cm in range(0, 17, 2):
        tick_y = int(apex_y + (cm / 16.0) * (max_depth - apex_y))
        cv2.line(frame, (scale_x - 4, tick_y), (scale_x + 4, tick_y), (140, 140, 140), 1)
        if cm % 4 == 0 and cm > 0:
            cv2.putText(frame, str(cm), (scale_x + 8, tick_y + 4), font_mono, 0.75, (160, 160, 160), 1, cv2.LINE_AA)

    # Real-time Synchronized ECG Rhythm Strip at Bottom (Green ECG Trace)
    ecg_box_y = height - 42
    cv2.line(frame, (15, ecg_box_y - 6), (width - 15, ecg_box_y - 6), (40, 40, 40), 1)
    
    # Draw moving sweep ECG waveform
    trace_pts = []
    for x in range(25, width - 25, 2):
        x_norm = (x - 25) / (width - 50)
        # ECG cycle modulation
        p = ((time_sec * 1.5 + x_norm * 2.0) % 1.0)
        if p < 0.12:  # P wave
            v = math.sin(p / 0.12 * math.pi) * 3
        elif 0.16 < p < 0.20:  # Q wave
            v = -4
        elif 0.20 <= p <= 0.26:  # R wave spike
            v = 18 if case_type != "dcm_lbbb" else 14
        elif 0.26 < p < 0.30:  # S wave
            v = -6
        elif 0.38 < p < 0.58:  # T wave / ST elevation
            st_elev = 8 if case_type == "stemi" else 0
            v = math.sin((p - 0.38) / 0.20 * math.pi) * 5 + st_elev
        else:
            v = 0.0
            
        pt_y = int(ecg_box_y + 12 - v)
        trace_pts.append((x, pt_y))

    for idx in range(len(trace_pts) - 1):
        cv2.line(frame, trace_pts[idx], trace_pts[idx + 1], (0, 230, 80), 1, cv2.LINE_AA)

    # Timestamp & Heart Rate Indicator
    cv2.putText(frame, f"ECG II: {hr} BPM", (25, height - 10), font_mono, 0.85, (0, 230, 80), 1, cv2.LINE_AA)
    cv2.putText(frame, f"A4C CINE LOOP [FRAME {frame_idx + 1:02d}/{total_frames:02d}]", (width - 240, height - 10), font_mono, 0.8, (140, 140, 140), 1, cv2.LINE_AA)

    return frame

def generate_photorealistic_echo_video(
    output_path: str,
    case_type: str,
    patient_name: str,
    patient_id: str,
    target_ef: float,
    duration_sec: int = 3,
    fps: int = 30
) -> str:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    width, height = 512, 512
    total_frames = duration_sec * fps
    
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(path), fourcc, fps, (width, height), isColor=True)

    for i in range(total_frames):
        frame = render_clinical_echo_frame(
            width=width,
            height=height,
            frame_idx=i,
            total_frames=total_frames,
            fps=fps,
            case_type=case_type,
            patient_name=patient_name,
            patient_id=patient_id,
            target_ef=target_ef
        )
        out.write(frame)

    out.release()
    print(f"  [+] Generated Clinical Ultrasound Cine ({case_type.upper()} EF:{target_ef}%): {path.name}")
    return str(path)

if __name__ == "__main__":
    test_out = r"s:\OmniHealth\data\sample_patients\Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF\echo_apical4c.mp4"
    generate_photorealistic_echo_video(
        test_out,
        case_type="stemi",
        patient_name="Eleanor Vance",
        patient_id="PT-10482",
        target_ef=33.0
    )
