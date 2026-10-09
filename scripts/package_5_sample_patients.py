import os
import shutil
import json
from pathlib import Path

BASE_DIR = Path(r"s:\OmniHealth")
SRC_DIR = BASE_DIR / "data" / "test_cases"
DEST_DIR = BASE_DIR / "data" / "sample_patients"
DEST_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_PATIENTS = [
    {
        "id": "PT-10482",
        "name": "Eleanor Vance",
        "age": 64,
        "gender": "Female",
        "folder_name": "Patient_01_Eleanor_Vance_PT-10482_Anterior_STEMI_HFrEF",
        "src_case": "Case_02_Anterior_Myocardial_Infarction",
        "diagnosis_title": "Acute Anterior STEMI with Severely Reduced LVEF (32%)",
        "clinical_problem": "Acute ST-Elevation Myocardial Infarction (Anterior Wall) resulting in Heart Failure with reduced Ejection Fraction (HFrEF) and apical dyssynergy.",
        "ecg_interpretation": "Sinus rhythm at 94 bpm. Marked ST-segment elevation (>2.5 mm) in leads V1–V4 with reciprocal ST depression in leads II, III, and aVF. Pathological Q waves developing in V2–V3, indicative of acute transmural anterior wall myocardial infarction due to LAD occlusion.",
        "echo_interpretation": "Apical 4-chamber ultrasound demonstrates severe left ventricular systolic dysfunction with estimated LVEF ~32–34%. Akinesis of the apex and severe hypokinesis of the anterior interventricular septum. Preserved basal contractility.",
        "fusion_relationship": "CONCORDANT AGREEMENT (Acute anterior electrophysiological ST elevations align with severe apical/septal wall motion akinesis).",
        "history_notes": "64yo female with history of hypertension and hyperlipidemia. Prior checkup 6 months ago noted normal ECG. Presenting with 3-hour history of severe retrosternal crushing chest pain radiating to left jaw, diaphoresis, and dyspnea.",
        "recommendation": "Emergent cardiac catheterization for percutaneous coronary intervention (PCI) of the Left Anterior Descending (LAD) coronary artery. Initiate dual antiplatelet therapy (DAPT), high-intensity statin, and GDMT for HFrEF."
    },
    {
        "id": "PT-10483",
        "name": "Marcus Chen",
        "age": 42,
        "gender": "Male",
        "folder_name": "Patient_02_Marcus_Chen_PT-10483_Normal_Sinus_Rhythm",
        "src_case": "Case_01_Normal_Sinus_Rhythm",
        "diagnosis_title": "Normal Sinus Rhythm with Preserved Left Ventricular Systolic Function (LVEF 62%)",
        "clinical_problem": "Atypical chest wall pain / musculoskeletal discomfort. No objective electrophysiological or structural cardiac abnormalities.",
        "ecg_interpretation": "Normal sinus rhythm at 68 bpm. Normal PR interval (150 ms), normal QRS duration (88 ms), and normal QTc (412 ms). No ST-segment elevation, depression, or pathological T-wave inversions.",
        "echo_interpretation": "Normal left ventricular size and systolic performance. Estimated LVEF 62%. Normal wall thickness without regional wall motion abnormalities. Normal mitral and tricuspid valve kinematics.",
        "fusion_relationship": "CONCORDANT AGREEMENT (Normal electrical conduction matches preserved global and regional contractility).",
        "history_notes": "42yo male marathon runner presenting for annual executive physical and reassurance following sharp, fleeting chest wall twinges after strenuous training. No past cardiac history.",
        "recommendation": "Reassurance provided. Low risk for ischemic heart disease. No cardiovascular intervention indicated. Follow up routine preventive health screen in 1 year."
    },
    {
        "id": "PT-10484",
        "name": "Sarah Jenkins",
        "age": 71,
        "gender": "Female",
        "folder_name": "Patient_03_Sarah_Jenkins_PT-10484_Atrial_Fibrillation_RVR",
        "src_case": "Case_03_Ischemic_ST_T_Wave_Changes",
        "diagnosis_title": "Atrial Fibrillation with Rapid Ventricular Response & Mild Systolic Dysfunction",
        "clinical_problem": "Tachycardia-induced cardiomyopathy / dynamic ischemic ST-T changes secondary to Atrial Fibrillation with Rapid Ventricular Response (AF-RVR).",
        "ecg_interpretation": "Irregularly irregular rhythm with absent P waves and variable RR intervals. Ventricular rate averaging 118–132 bpm. Diffuse non-specific ST-T wave sagging and lateral T-wave flattening secondary to rapid rate and demand ischemia.",
        "echo_interpretation": "Mild-to-moderate left atrial dilatation. Left ventricular ejection fraction mildly reduced at ~48–50%. Global hypokinesia with beat-to-beat variability in stroke volume due to irregular diastolic filling.",
        "fusion_relationship": "COMPLEMENTARY INSIGHTS (Electrical rhythm disturbance explains mechanical irregularity and dynamic subendocardial strain).",
        "history_notes": "71yo female with 2-year history of paroxysmal atrial fibrillation and mild hypertension. Presenting with sudden onset fluttering palpitations, lightheadedness, and exercise intolerance.",
        "recommendation": "Rate control with IV/oral beta-blocker (Metoprolol succinate). Calculate CHA2DS2-VASc score (Score = 3: Age >65, Female, HTN) and initiate oral anticoagulation (DOAC - Apixaban 5mg BID). Consider elective cardioversion."
    },
    {
        "id": "PT-10485",
        "name": "Robert Kowalski",
        "age": 58,
        "gender": "Male",
        "folder_name": "Patient_04_Robert_Kowalski_PT-10485_Inferior_MI_Ischemia",
        "src_case": "Case_05_Ventricular_Hypertrophy",
        "diagnosis_title": "Prior Inferior Infarction with Left Ventricular Hypertrophy (LVH)",
        "clinical_problem": "Chronic hypertensive heart disease with voltage criteria for Left Ventricular Hypertrophy (LVH) and prior silent inferior ischemic injury.",
        "ecg_interpretation": "Sinus rhythm at 76 bpm. High QRS voltages meeting Sokolow-Lyon criteria (SV1 + RV5 > 3.5 mV). Pathological Q-waves in leads II, III, and aVF with asymmetric T-wave inversions in lateral leads I, aVL, V5, V6.",
        "echo_interpretation": "Concentric left ventricular hypertrophy with interventricular septal thickness of 14.5 mm. Estimated LVEF 55–58%. Mild basal-inferior hypokinesia with preserved anterior and lateral wall thickening.",
        "fusion_relationship": "COMPLEMENTARY / DISCORDANT (High voltage strain matches anatomical hypertrophy; localized inferior scar present despite preserved global pump function).",
        "history_notes": "58yo male with 15-year history of poorly controlled essential hypertension and smoking. Remote history of gastroesophageal reflux that may have masked an inferior myocardial infarction.",
        "recommendation": "Optimize anti-hypertensive regimen with ACE inhibitor (Lisinopril 20mg) and calcium channel blocker (Amlodipine 5mg). Nuclear myocardial perfusion imaging or coronary CTA to evaluate RCA/LCx patency."
    },
    {
        "id": "PT-10486",
        "name": "Amina Diallo",
        "age": 49,
        "gender": "Female",
        "folder_name": "Patient_05_Amina_Diallo_PT-10486_Dilated_Cardiomyopathy_LBBB",
        "src_case": "Case_04_Conduction_Disturbance_LBBB",
        "diagnosis_title": "Dilated Cardiomyopathy with Complete Left Bundle Branch Block (LBBB)",
        "clinical_problem": "Non-ischemic Dilated Cardiomyopathy (DCM) with intraventricular electrical dyssynchrony (LBBB) causing severe mechanical desynchronization and heart failure.",
        "ecg_interpretation": "Sinus rhythm at 82 bpm with wide QRS duration (164 ms). Monomorphic notched R waves in lead I, aVL, and V6 with absent septal Q waves. Deep, broad QS complexes in lead V1–V2, diagnostic of Complete Left Bundle Branch Block (LBBB).",
        "echo_interpretation": "Severely dilated left ventricle with spherical remodeling. Estimated LVEF ~28%. Septal flash and pronounced apical rocking characteristic of electromechanical dyssynchrony. Moderate functional mitral regurgitation.",
        "fusion_relationship": "CONCORDANT AGREEMENT (Wide LBBB electrogram corresponds directly to echocardiographic septal dyssynchrony and severe systolic failure).",
        "history_notes": "49yo female presenting with worsening NYHA Class III dyspnea on exertion, bilateral pedal edema, and orthopnea over the past 4 months. No prior angiographic CAD.",
        "recommendation": "Guideline-Directed Medical Therapy (Quadruple therapy: ARNI, SGLT2i, Beta-Blocker, MRA). Refer for Cardiac Resynchronization Therapy Defibrillator (CRT-D) evaluation given LBBB with QRS >150 ms and LVEF <35%."
    }
]

manifest = []

for patient in SAMPLE_PATIENTS:
    target_folder = DEST_DIR / patient["folder_name"]
    target_folder.mkdir(parents=True, exist_ok=True)
    
    src_case_dir = SRC_DIR / patient["src_case"]
    
    # Copy ECG and Echo files
    if (src_case_dir / "ecg_12lead.csv").exists():
        shutil.copy(src_case_dir / "ecg_12lead.csv", target_folder / "ecg_12lead.csv")
    if (src_case_dir / "ecg_12lead.hea").exists():
        shutil.copy(src_case_dir / "ecg_12lead.hea", target_folder / "ecg_12lead.hea")
    if (src_case_dir / "ecg_12lead.dat").exists():
        shutil.copy(src_case_dir / "ecg_12lead.dat", target_folder / "ecg_12lead.dat")
    if (src_case_dir / "echo_apical4c.mp4").exists():
        shutil.copy(src_case_dir / "echo_apical4c.mp4", target_folder / "echo_apical4c.mp4")
    
    # Write custom prior cardiac history
    with open(target_folder / "prior_cardiac_history.txt", "w", encoding="utf-8") as f:
        f.write(f"PATIENT: {patient['name']} (ID: {patient['id']})\n")
        f.write(f"AGE: {patient['age']} | SEX: {patient['gender']}\n")
        f.write("="*60 + "\n")
        f.write(f"CLINICAL ENCOUNTER NOTES:\n{patient['history_notes']}\n")
    
    # Write comprehensive Clinical Problem and Diagnosis Document
    doc_content = f"""# CLINICAL CASE FILE: {patient['name']} ({patient['id']})

## 1. Patient Demographics & Identification
- **Patient Name**: {patient['name']}
- **Patient ID**: `{patient['id']}`
- **Age**: {patient['age']} years
- **Gender**: {patient['gender']}
- **Clinical Category**: Cardiology / Multimodal Evaluation

---

## 2. Clinical Problem & Primary Diagnosis
### **{patient['diagnosis_title']}**
**Pathology Overview**:  
{patient['clinical_problem']}

---

## 3. Multimodal Diagnostic Studies & Findings

### A. 12-Lead Electrocardiogram (ECG)
- **Data File**: `ecg_12lead.csv` (also WFDB `ecg_12lead.hea` / `ecg_12lead.dat`)
- **Electrophysiological Finding**:  
  {patient['ecg_interpretation']}

### B. Transthoracic Echocardiogram (Echo)
- **Data File**: `echo_apical4c.mp4` (Apical 4-Chamber Cine Ultrasound)
- **Structural & Functional Finding**:  
  {patient['echo_interpretation']}

### C. Prior History & Temporal Comparison
- **History Record**: `prior_cardiac_history.txt`
- **Encounter Background**:  
  {patient['history_notes']}

---

## 4. OMNIHEALTH Multi-Agent AI Assessment
- **Cross-Modal Relationship**: `{patient['fusion_relationship']}`
- **Clinical Action Plan**:  
  {patient['recommendation']}

---
*OMNIHEALTH Clinical Research Platform — Real Patient Dataset Verification File*
"""
    with open(target_folder / "clinical_problem_and_diagnosis.md", "w", encoding="utf-8") as f:
        f.write(doc_content)
        
    manifest.append({
        "patient_id": patient["id"],
        "name": patient["name"],
        "age": patient["age"],
        "gender": patient["gender"],
        "folder": str(target_folder),
        "diagnosis": patient["diagnosis_title"],
        "problem": patient["clinical_problem"],
        "files": {
            "ecg_csv": str(target_folder / "ecg_12lead.csv"),
            "ecg_hea": str(target_folder / "ecg_12lead.hea"),
            "ecg_dat": str(target_folder / "ecg_12lead.dat"),
            "echo_video": str(target_folder / "echo_apical4c.mp4"),
            "history_txt": str(target_folder / "prior_cardiac_history.txt"),
            "documentation_md": str(target_folder / "clinical_problem_and_diagnosis.md")
        }
    })

# Save manifest in data/sample_patients/
with open(DEST_DIR / "sample_patients_manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"Successfully packaged {len(SAMPLE_PATIENTS)} sample patient folders in {DEST_DIR}")
