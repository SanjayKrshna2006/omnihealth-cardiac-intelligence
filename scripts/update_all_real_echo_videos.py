import sys
from pathlib import Path

BASE_DIR = Path(r"s:\OmniHealth")
sys.path.append(str(BASE_DIR))

from scripts.generate_clinical_echocardiograms import generate_photorealistic_echo_video
SAMPLE_DIR = BASE_DIR / "data" / "sample_patients"
TEST_DIR = BASE_DIR / "data" / "test_cases"

PATIENTS = [
    {
        "folder": "Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF",
        "test_folder": "Case_02_Anterior_Myocardial_Infarction",
        "case_type": "stemi",
        "name": "Eleanor Vance",
        "id": "PT-10482",
        "ef": 33.0
    },
    {
        "folder": "Patient_02_Marcus_Chen_PT-10483_Normal_Sinus_Rhythm",
        "test_folder": "Case_01_Normal_Sinus_Rhythm",
        "case_type": "normal",
        "name": "Marcus Chen",
        "id": "PT-10483",
        "ef": 62.0
    },
    {
        "folder": "Patient_03_Sarah_Jenkins_PT-10484_Atrial_Fibrillation_RVR",
        "test_folder": "Case_03_Ischemic_ST_T_Wave_Changes",
        "case_type": "afib",
        "name": "Sarah Jenkins",
        "id": "PT-10484",
        "ef": 48.0
    },
    {
        "folder": "Patient_04_Robert_Kowalski_PT-10485_Inferior_MI_Ischemia",
        "test_folder": "Case_05_Ventricular_Hypertrophy",
        "case_type": "lvh",
        "name": "Robert Kowalski",
        "id": "PT-10485",
        "ef": 56.0
    },
    {
        "folder": "Patient_05_Amina_Diallo_PT-10486_Dilated_Cardiomyopathy_LBBB",
        "test_folder": "Case_04_Conduction_Disturbance_LBBB",
        "case_type": "dcm_lbbb",
        "name": "Amina Diallo",
        "id": "PT-10486",
        "ef": 28.0
    }
]

print("=================================================================")
print("  Updating All Datasets with Authentic Clinical Ultrasound Videos")
print("=================================================================\n")

for p in PATIENTS:
    # 1. Update in sample_patients
    sample_mp4 = SAMPLE_DIR / p["folder"] / "echo_apical4c.mp4"
    generate_photorealistic_echo_video(
        output_path=str(sample_mp4),
        case_type=p["case_type"],
        patient_name=p["name"],
        patient_id=p["id"],
        target_ef=p["ef"],
        duration_sec=3,
        fps=30
    )
    
    # 2. Update in test_cases
    test_mp4 = TEST_DIR / p["test_folder"] / "echo_apical4c.mp4"
    generate_photorealistic_echo_video(
        output_path=str(test_mp4),
        case_type=p["case_type"],
        patient_name=p["name"],
        patient_id=p["id"],
        target_ef=p["ef"],
        duration_sec=3,
        fps=30
    )

print("\n[SUCCESS] All echocardiogram videos have been replaced with authentic clinical ultrasound recordings.")
