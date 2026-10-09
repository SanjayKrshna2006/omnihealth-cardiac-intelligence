import os
import cv2
import numpy as np
import math
import shutil
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE_DIR = Path(r"s:\OmniHealth")
TEST_CASES_DIR = BASE_DIR / "data" / "test_cases"
UPLOADS_DIR = BASE_DIR / "uploads"
TEST_CASES_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# 15 Detailed Clinical Patient Definitions
PATIENT_CASES = [
    {
        "case_id": "Case_01_Normal_Sinus_Rhythm",
        "patient_id": "PT-10483",
        "name": "Marcus Chen",
        "age": 42,
        "gender": "Male",
        "hr": 68,
        "lvef": 62.0,
        "case_type": "normal",
        "diagnosis_title": "Normal Sinus Rhythm with Preserved Left Ventricular Systolic Function (LVEF 62%)",
        "history": "42yo male marathon runner presenting for executive health screen after transient chest twinges. Normal baseline.",
        "ecg_notes": "Normal sinus rhythm (68 bpm), normal intervals (PR: 154ms, QRS: 88ms, QTc: 412ms), isoelectric ST segments.",
        "echo_notes": "Normal LV chamber dimensions and preserved contractility. LVEF 62%. Normal wall thickness without defect."
    },
    {
        "case_id": "Case_02_Anterior_Myocardial_Infarction",
        "patient_id": "PT-10482",
        "name": "Eleanor Vance",
        "age": 64,
        "gender": "Female",
        "hr": 94,
        "lvef": 33.0,
        "case_type": "stemi_anterior",
        "diagnosis_title": "Acute Anterior STEMI with Severely Reduced LVEF (33%) and Apical Akinesis",
        "history": "64yo female with hypertension presenting with 3h retrosternal crushing pain. New acute plaque rupture.",
        "ecg_notes": "Marked ST elevation in leads V1-V4 with reciprocal inferior ST depression in II, III, aVF. Pathological Q-waves developing.",
        "echo_notes": "Severely reduced LVEF (33%). Apical cap akinesis and anterior interventricular septal severe hypokinesia."
    },
    {
        "case_id": "Case_03_Atrial_Fibrillation_RVR",
        "patient_id": "PT-10484",
        "name": "Sarah Jenkins",
        "age": 71,
        "gender": "Female",
        "hr": 124,
        "lvef": 48.0,
        "case_type": "afib",
        "diagnosis_title": "Atrial Fibrillation with Rapid Ventricular Response (124 bpm) & Mild Systolic Blunting",
        "history": "71yo female with hypertension presenting with sudden palpitations, lightheadedness, and exertional fatigue.",
        "ecg_notes": "Atrial Fibrillation with variable RR intervals and ventricular rate 118-132 bpm. Diffuse rate-related ST sagging.",
        "echo_notes": "Mildly reduced LVEF (48%) with left atrial enlargement and beat-to-beat stroke volume variability."
    },
    {
        "case_id": "Case_04_Inferior_MI_Hypertrophy",
        "patient_id": "PT-10485",
        "name": "Robert Kowalski",
        "age": 58,
        "gender": "Male",
        "hr": 76,
        "lvef": 56.0,
        "case_type": "lvh_inferior",
        "diagnosis_title": "Concentric Left Ventricular Hypertrophy with Prior Silent Inferior MI",
        "history": "58yo male with 15-year history of poorly controlled hypertension and smoking. Intermittent atypical burning.",
        "ecg_notes": "Sokolow-Lyon voltage 3.9 mV (LVH criteria positive). Pathological Q-waves in II, III, aVF with lateral strain pattern.",
        "echo_notes": "Concentric septal hypertrophy (14.5 mm) with preserved LVEF (56%) and localized basal-inferior hypokinesis."
    },
    {
        "case_id": "Case_05_Dilated_Cardiomyopathy_LBBB",
        "patient_id": "PT-10486",
        "name": "Amina Diallo",
        "age": 49,
        "gender": "Female",
        "hr": 82,
        "lvef": 28.0,
        "case_type": "dcm_lbbb",
        "diagnosis_title": "Non-Ischemic Dilated Cardiomyopathy with Complete LBBB and Severe Systolic Failure (28%)",
        "history": "49yo female with subacute NYHA Class III heart failure symptoms, orthopnea, and lower extremity edema over 4 months.",
        "ecg_notes": "Wide QRS (164 ms) Complete LBBB morphology with broad notched R-waves in I, aVL, V6 and deep QS complexes in V1-V2.",
        "echo_notes": "Severely dilated LV (LVEDD 66 mm), LVEF 28%, pronounced septal flash and electromechanical dyssynchrony."
    },
    {
        "case_id": "Case_06_Inferolateral_STEMI",
        "patient_id": "PT-10487",
        "name": "David Miller",
        "age": 67,
        "gender": "Male",
        "hr": 88,
        "lvef": 42.0,
        "case_type": "stemi_inferolateral",
        "diagnosis_title": "Acute Inferolateral STEMI with Basal-Lateral Wall Akinesis (LVEF 42%)",
        "history": "67yo male diabetic presenting with acute diaphoresis, nausea, and burning epigastric discomfort radiating to back.",
        "ecg_notes": "Convex ST-segment elevation in leads II, III, aVF and V5-V6 with reciprocal ST depression in lead aVL.",
        "echo_notes": "Moderately reduced LVEF (42%) with marked basal and mid-lateral wall akinesis in LCx/RCA territory."
    },
    {
        "case_id": "Case_07_HOCM_Septal_Hypertrophy",
        "patient_id": "PT-10488",
        "name": "Sofia Rossi",
        "age": 38,
        "gender": "Female",
        "hr": 74,
        "lvef": 72.0,
        "case_type": "hocm",
        "diagnosis_title": "Hypertrophic Obstructive Cardiomyopathy (HOCM) with Asymmetric Septal Hypertrophy (IVS 22mm)",
        "history": "38yo female presenting with exertional presyncope and harsh systolic ejection murmur along left sternal border.",
        "ecg_notes": "Marked voltage criteria for LVH with deep dagger-like septal Q waves in lateral leads (I, aVL, V5-V6).",
        "echo_notes": "Hyperdynamic preserved ejection fraction (LVEF 72%), asymmetric septal thickness 22 mm, Systolic Anterior Motion (SAM) of mitral valve."
    },
    {
        "case_id": "Case_08_Severe_Aortic_Stenosis",
        "patient_id": "PT-10489",
        "name": "James Wilson",
        "age": 78,
        "gender": "Male",
        "hr": 70,
        "lvef": 52.0,
        "case_type": "aortic_stenosis",
        "diagnosis_title": "Severe Calcific Aortic Valve Stenosis with Concentric Remodeling (AV Vmax 4.4 m/s)",
        "history": "78yo male presenting with progressive exertional angina, fatigue, and near-syncope while walking uphill.",
        "ecg_notes": "Left ventricular hypertrophy with prominent repolarization strain pattern (ST depression and T-wave inversion in V4-V6).",
        "echo_notes": "Severely calcified, restricted aortic valve leaflets (AVA 0.7 cm2, peak velocity 4.4 m/s, mean gradient 46 mmHg)."
    },
    {
        "case_id": "Case_09_Acute_Myopericarditis",
        "patient_id": "PT-10490",
        "name": "Chloe Dubois",
        "age": 29,
        "gender": "Female",
        "hr": 92,
        "lvef": 50.0,
        "case_type": "pericarditis",
        "diagnosis_title": "Acute Viral Myopericarditis with Diffuse PR Depression & Concave ST Elevation",
        "history": "29yo female presenting with sharp pleuritic chest pain that worsens when supine and improves when leaning forward.",
        "ecg_notes": "Widespread diffuse concave ST-segment elevations across leads I, II, aVF, V2-V6 with PR-segment depression in lead II and PR elevation in aVR.",
        "echo_notes": "Mild global left ventricular systolic blunting (LVEF 50%) with small circumferential pericardial effusion without tamponade."
    },
    {
        "case_id": "Case_10_Ventricular_Tachycardia",
        "patient_id": "PT-10491",
        "name": "Carlos Morales",
        "age": 61,
        "gender": "Male",
        "hr": 165,
        "lvef": 30.0,
        "case_type": "vtach",
        "diagnosis_title": "Sustained Monomorphic Ventricular Tachycardia (165 bpm) with Post-Infarct Scar",
        "history": "61yo male with prior coronary bypass surgery presenting with sudden severe palpitations, dizziness, and hypotension.",
        "ecg_notes": "Wide complex regular tachycardia at 165 bpm (QRS 170 ms) with AV dissociation, positive concordance in chest leads, and fusion beats.",
        "echo_notes": "Severely reduced ejection fraction (LVEF 30%) with extensive anterior and apical wall thinning/akinesis and dyssynchronous ventricular pacing."
    },
    {
        "case_id": "Case_11_Apical_Ventricular_Aneurysm",
        "patient_id": "PT-10492",
        "name": "Margaret Kim",
        "age": 74,
        "gender": "Female",
        "hr": 80,
        "lvef": 26.0,
        "case_type": "aneurysm",
        "diagnosis_title": "Chronic Ischemic Cardiomyopathy with Apical Left Ventricular Aneurysm (LVEF 26%)",
        "history": "74yo female with chronic heart failure presenting with lower extremity edema and orthopnea.",
        "ecg_notes": "Persistent ST elevations in V1-V4 with deep pathological Q waves, unchanged over 6 months indicating anatomical aneurysm formation.",
        "echo_notes": "Severe systolic dysfunction (LVEF 26%) with large, thin-walled, dyskinetic apical ventricular aneurysm and mural laminar thrombus."
    },
    {
        "case_id": "Case_12_Mitral_Valve_Prolapse_Flail",
        "patient_id": "PT-10493",
        "name": "Lucas Meyer",
        "age": 52,
        "gender": "Male",
        "hr": 84,
        "lvef": 58.0,
        "case_type": "mitral_prolapse",
        "diagnosis_title": "Severe Mitral Valve Prolapse with Flail Posterior Leaflet and Eccentric Regurgitation",
        "history": "52yo male presenting with sudden onset acute dyspnea, orthopnea, and a holosystolic blowing murmur radiating to axilla.",
        "ecg_notes": "Sinus rhythm with biphasic P-waves in V1 (left atrial enlargement criteria) and non-specific inferolateral repolarization changes.",
        "echo_notes": "Flail posterior mitral leaflet (P2 segment) with torn chordae tendineae and severe anteriorly directed eccentric mitral regurgitation jet."
    },
    {
        "case_id": "Case_13_Takotsubo_Cardiomyopathy",
        "patient_id": "PT-10494",
        "name": "Helen Campbell",
        "age": 66,
        "gender": "Female",
        "hr": 86,
        "lvef": 35.0,
        "case_type": "takotsubo",
        "diagnosis_title": "Takotsubo (Stress-Induced) Cardiomyopathy with Classic Apical Ballooning Syndrome",
        "history": "66yo female presenting with severe acute substernal chest pain following acute emotional bereavement. Coronaries patent on angiogram.",
        "ecg_notes": "Marked diffuse deep T-wave inversions across precordial leads V1-V6 and I, aVL with significant QTc prolongation (510 ms).",
        "echo_notes": "Classic 'apical ballooning' appearance: Severe akinesis of mid-to-apical left ventricular segments with compensatory hypercontractile basal segments (LVEF 35%)."
    },
    {
        "case_id": "Case_14_Mobitz_II_AV_Block",
        "patient_id": "PT-10495",
        "name": "Richard Hansen",
        "age": 82,
        "gender": "Male",
        "hr": 44,
        "lvef": 54.0,
        "case_type": "av_block",
        "diagnosis_title": "Symptomatic 2nd Degree Mobitz Type II Atrioventricular Block (Ventricular Rate 44 bpm)",
        "history": "82yo male presenting following sudden unprovoked syncope while gardening. No preceding aura or palpitations.",
        "ecg_notes": "Sinus rhythm with intermittent, non-conducted P-waves with constant PR intervals (2:1 and 3:2 conduction block). Right Bundle Branch Block morphology.",
        "echo_notes": "Preserved left ventricular systolic function (LVEF 54%) with normal chamber geometry and preserved wall motion."
    },
    {
        "case_id": "Case_15_Cardiac_Amyloidosis",
        "patient_id": "PT-10496",
        "name": "Yuki Tanaka",
        "age": 70,
        "gender": "Male",
        "hr": 78,
        "lvef": 45.0,
        "case_type": "amyloidosis",
        "diagnosis_title": "Cardiac Transthyretin Amyloidosis with Restrictive Filling Pattern & Low ECG Voltage",
        "history": "70yo male with carpal tunnel syndrome history presenting with progressive exercise intolerance and peripheral edema.",
        "ecg_notes": "Low QRS voltages throughout all limb leads (QRS amplitude < 5 mm) despite profound structural ventricular wall thickening (discordance). Pseudo-infarct pattern V1-V3.",
        "echo_notes": "Marked concentric biventricular wall thickening (IVS 18 mm) with characteristic granular 'sparkling' myocardial texture, biatrial enlargement, and apical sparing longitudinal strain."
    }
]

def generate_custom_ecg_csv(patient_info: dict, filepath: Path):
    """Generate realistic 12-lead ECG CSV matching specific pathology."""
    fs = 500
    duration_sec = 10
    n_samples = fs * duration_sec
    hr = patient_info["hr"]
    case_type = patient_info["case_type"]
    
    t = np.linspace(0, duration_sec, n_samples)
    leads = np.zeros((n_samples, 12), dtype=np.float32)
    
    # Base beat frequency
    beat_freq = hr / 60.0
    
    for lead_idx in range(12):
        # Baseline
        lead_signal = np.zeros(n_samples)
        
        # Beat simulation
        phase = (t * beat_freq) % 1.0
        
        # P wave
        p_wave = 0.12 * np.exp(-((phase - 0.15) ** 2) / (2 * 0.02 ** 2))
        
        # QRS complex
        q_wave = -0.15 * np.exp(-((phase - 0.22) ** 2) / (2 * 0.008 ** 2))
        r_wave = 1.0 * np.exp(-((phase - 0.25) ** 2) / (2 * 0.012 ** 2))
        s_wave = -0.25 * np.exp(-((phase - 0.28) ** 2) / (2 * 0.01 ** 2))
        
        # T wave
        t_wave = 0.3 * np.exp(-((phase - 0.45) ** 2) / (2 * 0.04 ** 2))
        
        # ST level
        st_level = 0.0
        
        # Pathology adjustments
        if case_type == "stemi_anterior":
            if lead_idx in [6, 7, 8, 9]:  # V1-V4
                st_level = 0.35 + 0.1 * (lead_idx - 6)
                r_wave *= 0.4
                q_wave *= 2.5
            elif lead_idx in [1, 2, 5]:  # II, III, aVF
                st_level = -0.2
        elif case_type == "stemi_inferolateral":
            if lead_idx in [1, 2, 5, 10, 11]:  # II, III, aVF, V5, V6
                st_level = 0.3
            elif lead_idx in [4]:  # aVL
                st_level = -0.25
        elif case_type == "afib":
            p_wave = 0.04 * np.sin(2 * np.pi * 7.5 * t)  # fibrillatory waves
            phase = (t * (beat_freq + 0.2 * np.sin(t * 1.5))) % 1.0
            st_level = -0.08
        elif case_type == "dcm_lbbb":
            r_wave = 0.8 * np.exp(-((phase - 0.25) ** 2) / (2 * 0.035 ** 2))  # Wide QRS
            if lead_idx in [6, 7]:  # V1-V2
                r_wave *= 0.1
                s_wave *= 2.8
        elif case_type == "lvh_inferior":
            if lead_idx in [0, 4, 10, 11]:
                r_wave *= 2.2
            if lead_idx in [1, 2, 5]:
                q_wave *= 2.0
                st_level = -0.1
        elif case_type == "hocm":
            if lead_idx in [0, 4, 10, 11]:
                q_wave = -0.6 * np.exp(-((phase - 0.22) ** 2) / (2 * 0.008 ** 2))  # Dagger Q
                r_wave *= 2.4
        elif case_type == "pericarditis":
            st_level = 0.2  # diffuse concave ST elevation
            if lead_idx == 3:  # aVR
                st_level = -0.15
        elif case_type == "vtach":
            # Monomorphic wide regular rhythm
            r_wave = 1.4 * np.sin(2 * np.pi * beat_freq * t)
            p_wave = 0.0
            q_wave = 0.0
            s_wave = 0.0
            t_wave = 0.0
        elif case_type == "takotsubo":
            if lead_idx in [6, 7, 8, 9, 10]:
                t_wave = -0.7 * np.exp(-((phase - 0.5) ** 2) / (2 * 0.06 ** 2))  # Giant negative T
        elif case_type == "amyloidosis":
            r_wave *= 0.35  # Low voltage
            s_wave *= 0.35
            
        lead_signal = p_wave + q_wave + r_wave + s_wave + t_wave + st_level
        # Add subtle noise
        lead_signal += 0.02 * np.random.randn(n_samples)
        leads[:, lead_idx] = lead_signal

    header = ",".join([f"lead_{i+1}" for i in range(12)])
    np.savetxt(filepath, leads, delimiter=",", header=header, comments="")

def render_echo_video(patient_info: dict, filepath: Path):
    """Render a clinical B-mode Apical-4-Chamber echocardiogram ultrasound cine loop."""
    width, height = 480, 480
    fps = 30
    duration_sec = 2.5
    total_frames = int(fps * duration_sec)
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(filepath), fourcc, fps, (width, height))
    
    hr = patient_info["hr"]
    case_type = patient_info["case_type"]
    lvef = patient_info["lvef"]
    name = patient_info["name"]
    pid = patient_info["patient_id"]
    
    for f_idx in range(total_frames):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Sector background
        apex_x = width // 2
        apex_y = 55
        max_depth = height - 70
        
        # Time and cardiac phase
        time_sec = f_idx / fps
        cycle_len = 60.0 / hr
        beat_phase = (time_sec % cycle_len) / cycle_len
        
        # Contraction factor based on LVEF
        if beat_phase < 0.35:
            contract_p = math.sin(math.pi * (beat_phase / 0.35))
        else:
            contract_p = -math.sin(math.pi * ((beat_phase - 0.35) / 0.65)) * 0.2
            
        contract_amplitude = (lvef / 100.0) * 16.0
        
        # Chamber Centers
        lv_cx = apex_x + int(width * 0.12)
        lv_cy = apex_y + int(height * 0.38)
        
        rv_cx = apex_x - int(width * 0.12)
        rv_cy = apex_y + int(height * 0.36)
        
        la_cx = apex_x + int(width * 0.10)
        la_cy = apex_y + int(height * 0.62)
        
        ra_cx = apex_x - int(width * 0.10)
        ra_cy = apex_y + int(height * 0.60)
        
        # Ultrasound sector cone
        pts = np.array([
            [apex_x, apex_y],
            [apex_x - int(width * 0.44), max_depth],
            [apex_x + int(width * 0.44), max_depth]
        ])
        cv2.fillPoly(frame, [pts], (18, 22, 28))
        
        # Draw Left Ventricle with wall motion defect simulation
        lv_rx = int(44 - contract_p * contract_amplitude)
        lv_ry = int(60 - contract_p * contract_amplitude * 1.2)
        
        if case_type == "stemi_anterior" or case_type == "aneurysm":
            # Apical akinesis: apex does not contract
            cv2.ellipse(frame, (lv_cx, lv_cy), (lv_rx, lv_ry), -8, 0, 360, (5, 8, 12), -1)
            cv2.ellipse(frame, (lv_cx, lv_cy), (lv_rx + 8, lv_ry + 8), -8, 0, 360, (65, 75, 85), 4)
            # Hyperechoic apical thinning
            cv2.circle(frame, (lv_cx - 5, lv_cy - 40), 12, (95, 105, 115), 3)
        elif case_type == "hocm":
            # Thickened septum
            cv2.ellipse(frame, (lv_cx, lv_cy), (32, 54), -8, 0, 360, (5, 8, 12), -1)
            cv2.ellipse(frame, (lv_cx - 18, lv_cy), (18, 50), -8, 0, 360, (110, 120, 130), -1)
        elif case_type == "takotsubo":
            # Apical ballooning: base contracts, apex dilated
            cv2.ellipse(frame, (lv_cx, lv_cy), (52, 64), -8, 0, 360, (5, 8, 12), -1)
            cv2.ellipse(frame, (lv_cx, lv_cy), (56, 68), -8, 0, 360, (70, 80, 90), 4)
        else:
            cv2.ellipse(frame, (lv_cx, lv_cy), (lv_rx, lv_ry), -8, 0, 360, (5, 8, 12), -1)
            cv2.ellipse(frame, (lv_cx, lv_cy), (lv_rx + 7, lv_ry + 7), -8, 0, 360, (70, 80, 90), 3)
            
        # Draw RV, LA, RA
        cv2.ellipse(frame, (rv_cx, rv_cy), (34, 50), 8, 0, 360, (5, 8, 12), -1)
        cv2.ellipse(frame, (rv_cx, rv_cy), (38, 54), 8, 0, 360, (65, 75, 85), 3)
        
        cv2.ellipse(frame, (la_cx, la_cy), (36, 38), 0, 0, 360, (5, 8, 12), -1)
        cv2.ellipse(frame, (la_cx, la_cy), (39, 41), 0, 0, 360, (60, 70, 80), 2)
        
        cv2.ellipse(frame, (ra_cx, ra_cy), (34, 36), 0, 0, 360, (5, 8, 12), -1)
        cv2.ellipse(frame, (ra_cx, ra_cy), (37, 39), 0, 0, 360, (60, 70, 80), 2)
        
        # Add acoustic ultrasound speckle noise
        noise = np.random.normal(0, 12, (height, width, 3)).astype(np.int16)
        frame_int = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Clinical telemetry overlay
        cv2.putText(frame_int, f"OMNIHEALTH ECHO A4C - {pid}", (18, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (210, 225, 240), 1)
        cv2.putText(frame_int, f"PT: {name} | HR: {hr} bpm | LVEF: {lvef:.1f}%", (18, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (140, 190, 240), 1)
        cv2.putText(frame_int, f"FPS: 30 | GAIN: 68dB | DEPTH: 16cm", (18, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (160, 175, 190), 1)
        
        # Heartbeat pulse indicator
        pulse_color = (0, 220, 100) if contract_p > 0.5 else (70, 120, 80)
        cv2.circle(frame_int, (width - 30, 28), 7, pulse_color, -1)
        
        out.write(frame_int)
        
    out.release()

print("Generating 15 comprehensive clinical testcases with ECG signals, Echo videos, and clinical histories...")

manifest = []

for p in PATIENT_CASES:
    case_folder = TEST_CASES_DIR / p["case_id"]
    case_folder.mkdir(parents=True, exist_ok=True)
    
    ecg_csv = case_folder / "ecg_12lead.csv"
    echo_video = case_folder / "echo_apical4c.mp4"
    history_txt = case_folder / "prior_cardiac_history.txt"
    
    # 1. Generate ECG CSV
    generate_custom_ecg_csv(p, ecg_csv)
    
    # 2. Render Echo Video
    render_echo_video(p, echo_video)
    
    # 3. Write History Text
    history_content = f"""PATIENT: {p['name']} ({p['patient_id']})
AGE: {p['age']} | GENDER: {p['gender']}
DIAGNOSIS: {p['diagnosis_title']}

CLINICAL HISTORY & SUMMARY:
{p['history']}

ELECTROCARDIOGRAM (ECG) INTERPRETATION:
{p['ecg_notes']}

ECHOCARDIOGRAM (ECHO A4C) INTERPRETATION:
{p['echo_notes']}
"""
    history_txt.write_text(history_content, encoding="utf-8")
    
    # Copy to uploads for direct browser playback & report inspection
    dest_ecg = UPLOADS_DIR / f"{p['patient_id']}_ecg.csv"
    dest_echo = UPLOADS_DIR / f"{p['patient_id']}_echo.mp4"
    shutil.copy(ecg_csv, dest_ecg)
    shutil.copy(echo_video, dest_echo)
    
    manifest.append({
        "case_id": p["case_id"],
        "patient_id": p["patient_id"],
        "name": p["name"],
        "age": p["age"],
        "gender": p["gender"],
        "diagnosis": p["diagnosis_title"],
        "lvef": p["lvef"],
        "hr": p["hr"],
        "ecg_csv": str(ecg_csv),
        "echo_video": str(echo_video),
        "history_txt": str(history_txt)
    })
    print(f"[OK] Generated Case {p['case_id']}: {p['name']} ({p['patient_id']}) - LVEF {p['lvef']}%")

manifest_path = TEST_CASES_DIR / "case_manifest.json"
manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(f"\nAll 15 testcases successfully generated and saved to {TEST_CASES_DIR}")
