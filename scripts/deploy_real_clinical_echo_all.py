import os
import shutil
from pathlib import Path

BASE_DIR = Path(r"s:\OmniHealth")
TEMP_DIR = BASE_DIR / "temp_real_videos"
TEST_DIR = BASE_DIR / "data" / "test_cases"
SAMPLE_DIR = BASE_DIR / "data" / "sample_patients"
UPLOADS_DIR = BASE_DIR / "uploads"
SAMPLE_DATA_ECHO = BASE_DIR / "sample_data" / "echo"

REAL_VIDEOS = {
    "stemi": TEMP_DIR / "stemi_real.mp4",
    "normal": TEMP_DIR / "normal_real.mp4",
    "afib": TEMP_DIR / "afib_real.mp4",
    "lvh": TEMP_DIR / "lvh_real.mp4",
    "dcm": TEMP_DIR / "dcm_real.mp4",
}

# Verify all source videos exist
for k, path in REAL_VIDEOS.items():
    if not path.exists():
        raise FileNotFoundError(f"Source video {path} not found!")
    print(f"Verified source {k}: {path} ({path.stat().st_size:,} bytes)")

# Mapping for data/test_cases
TEST_CASE_MAPPINGS = {
    "Case_01_Normal_Sinus_Rhythm": "normal",
    "Case_02_Anterior_Myocardial_Infarction": "stemi",
    "Case_03_Atrial_Fibrillation_RVR": "afib",
    "Case_03_Ischemic_ST_T_Wave_Changes": "afib",
    "Case_04_Conduction_Disturbance_LBBB": "dcm",
    "Case_04_Inferior_MI_Hypertrophy": "lvh",
    "Case_05_Dilated_Cardiomyopathy_LBBB": "dcm",
    "Case_05_Ventricular_Hypertrophy": "lvh",
    "Case_06_Inferolateral_STEMI": "stemi",
    "Case_07_HOCM_Septal_Hypertrophy": "lvh",
    "Case_08_Severe_Aortic_Stenosis": "lvh",
    "Case_09_Acute_Myopericarditis": "stemi",
    "Case_10_Ventricular_Tachycardia": "stemi",
    "Case_11_Apical_Ventricular_Aneurysm": "stemi",
    "Case_12_Mitral_Valve_Prolapse_Flail": "afib",
    "Case_13_Takotsubo_Cardiomyopathy": "stemi",
    "Case_14_Mobitz_II_AV_Block": "normal",
    "Case_15_Cardiac_Amyloidosis": "lvh",
}

print("\n--- Deploying Real Videos to data/test_cases ---")
for folder_name, v_type in TEST_CASE_MAPPINGS.items():
    folder_path = TEST_DIR / folder_name
    if folder_path.exists():
        target = folder_path / "echo_apical4c.mp4"
        shutil.copy2(REAL_VIDEOS[v_type], target)
        print(f"  [+] {folder_name} -> {v_type} ({target.stat().st_size:,} bytes)")

# Root test_cases video
root_target = TEST_DIR / "echo_apical4c.mp4"
shutil.copy2(REAL_VIDEOS["stemi"], root_target)
print(f"  [+] data/test_cases/echo_apical4c.mp4 -> stemi ({root_target.stat().st_size:,} bytes)")

# Mapping for sample_patients
SAMPLE_PATIENT_MAPPINGS = {
    "Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF": "stemi",
    "Patient_02_Marcus_Chen_PT-10483_Normal_Sinus_Rhythm": "normal",
    "Patient_03_Sarah_Jenkins_PT-10484_Atrial_Fibrillation_RVR": "afib",
    "Patient_04_Robert_Kowalski_PT-10485_Inferior_MI_Ischemia": "lvh",
    "Patient_05_Amina_Diallo_PT-10486_Dilated_Cardiomyopathy_LBBB": "dcm",
}

if SAMPLE_DIR.exists():
    print("\n--- Deploying Real Videos to data/sample_patients ---")
    for folder_name, v_type in SAMPLE_PATIENT_MAPPINGS.items():
        folder_path = SAMPLE_DIR / folder_name
        if folder_path.exists():
            target = folder_path / "echo_apical4c.mp4"
            shutil.copy2(REAL_VIDEOS[v_type], target)
            print(f"  [+] {folder_name} -> {v_type} ({target.stat().st_size:,} bytes)")

# Deploy to sample_data/echo
if SAMPLE_DATA_ECHO.exists():
    print("\n--- Deploying Real Videos to sample_data/echo ---")
    shutil.copy2(REAL_VIDEOS["stemi"], SAMPLE_DATA_ECHO / "anterior_apical_akinesis_a4c.mp4")
    shutil.copy2(REAL_VIDEOS["normal"], SAMPLE_DATA_ECHO / "normal_lv_contractility_a4c.mp4")
    shutil.copy2(REAL_VIDEOS["afib"], SAMPLE_DATA_ECHO / "atrial_dilation_a4c.mp4")
    shutil.copy2(REAL_VIDEOS["lvh"], SAMPLE_DATA_ECHO / "inferior_wall_hypokinesia_a4c.mp4")
    shutil.copy2(REAL_VIDEOS["dcm"], SAMPLE_DATA_ECHO / "dilated_lv_dyssynchrony_a4c.mp4")
    print("  [+] sample_data/echo videos updated with real recordings.")

# Deploy to uploads/PT-*_echo.mp4
print("\n--- Deploying Real Videos to uploads/ ---")
UPLOAD_MAPPINGS = {
    "PT-10482_echo.mp4": "stemi",
    "PT-10483_echo.mp4": "normal",
    "PT-10484_echo.mp4": "afib",
    "PT-10485_echo.mp4": "lvh",
    "PT-10486_echo.mp4": "dcm",
    "PT-10487_echo.mp4": "stemi",
    "PT-10488_echo.mp4": "lvh",
    "PT-10489_echo.mp4": "lvh",
    "PT-10490_echo.mp4": "stemi",
    "PT-10491_echo.mp4": "stemi",
    "PT-10492_echo.mp4": "stemi",
    "PT-10493_echo.mp4": "afib",
    "PT-10494_echo.mp4": "stemi",
    "PT-10495_echo.mp4": "normal",
    "PT-10496_echo.mp4": "lvh",
}

for filename, v_type in UPLOAD_MAPPINGS.items():
    target = UPLOADS_DIR / filename
    shutil.copy2(REAL_VIDEOS[v_type], target)
    print(f"  [+] uploads/{filename} -> {v_type} ({target.stat().st_size:,} bytes)")

print("\n[SUCCESS] All test cases, sample patients, and upload files restored to authentic real clinical echocardiograms!")
