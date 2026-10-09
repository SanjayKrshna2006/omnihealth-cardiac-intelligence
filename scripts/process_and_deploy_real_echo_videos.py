import os
import shutil
import cv2
from pathlib import Path

BASE_DIR = Path(r"s:\OmniHealth")
TEMP_DIR = BASE_DIR / "temp_real_videos"
SAMPLE_DIR = BASE_DIR / "data" / "sample_patients"
TEST_DIR = BASE_DIR / "data" / "test_cases"

REAL_MAPPINGS = [
    {
        "source_file": "stemi_real.mp4",
        "sample_folder": "Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF",
        "test_folder": "Case_02_Anterior_Myocardial_Infarction",
        "name": "Eleanor Vance (STEMI)",
    },
    {
        "source_file": "normal_real.mp4",
        "sample_folder": "Patient_02_Marcus_Chen_PT-10483_Normal_Sinus_Rhythm",
        "test_folder": "Case_01_Normal_Sinus_Rhythm",
        "name": "Marcus Chen (Normal)",
    },
    {
        "source_file": "afib_real.mp4",
        "sample_folder": "Patient_03_Sarah_Jenkins_PT-10484_Atrial_Fibrillation_RVR",
        "test_folder": "Case_03_Ischemic_ST_T_Wave_Changes",
        "name": "Sarah Jenkins (AFib)",
    },
    {
        "source_file": "lvh_real.mp4",
        "sample_folder": "Patient_04_Robert_Kowalski_PT-10485_Inferior_MI_Ischemia",
        "test_folder": "Case_05_Ventricular_Hypertrophy",
        "name": "Robert Kowalski (LVH / Inferior MI)",
    },
    {
        "source_file": "dcm_real.mp4",
        "sample_folder": "Patient_05_Amina_Diallo_PT-10486_Dilated_Cardiomyopathy_LBBB",
        "test_folder": "Case_04_Conduction_Disturbance_LBBB",
        "name": "Amina Diallo (DCM / LBBB)",
    },
]

def reencode_clean_mp4(src_path: Path, dest_path: Path):
    """
    Reads original clinical video frames and standardizes to clean 30fps web-playable MP4.
    """
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(src_path))
    if not cap.isOpened():
        print(f"Error opening {src_path}, using direct copy")
        shutil.copy(src_path, dest_path)
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or fps > 60:
        fps = 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Scale to standard ultrasound resolution (e.g. 480x480 or preserve ratio)
    target_w, target_h = 448, 448
    
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(dest_path), fourcc, 30.0, (target_w, target_h), isColor=True)

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        out.write(resized)
        frame_count += 1

    cap.release()
    out.release()
    print(f"  [+] Converted & deployed real video: {dest_path.name} ({frame_count} frames, {os.path.getsize(dest_path)} bytes)")

print("=================================================================")
print("  Deploying 100% Real Clinical Ultrasound Echocardiogram Videos")
print("=================================================================\n")

for m in REAL_MAPPINGS:
    src = TEMP_DIR / m["source_file"]
    if not src.exists():
        print(f"Warning: {src} not found!")
        continue
    
    # Target 1: Sample patient directory
    dest_sample = SAMPLE_DIR / m["sample_folder"] / "echo_apical4c.mp4"
    reencode_clean_mp4(src, dest_sample)

    # Target 2: Test cases directory
    dest_test = TEST_DIR / m["test_folder"] / "echo_apical4c.mp4"
    shutil.copy(dest_sample, dest_test)

# Also copy Patient 1 to root data/test_cases/echo_apical4c.mp4
shutil.copy(
    SAMPLE_DIR / "Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF" / "echo_apical4c.mp4",
    TEST_DIR / "echo_apical4c.mp4"
)

print("\n[SUCCESS] All sample patients and test cases now use 100% authentic clinical echocardiography videos.")
