"""
OmniHealth 25 Clinical Cases Master Registry.
Provides verified multimodal clinical ground truth, electrophysiological tracings,
echocardiographic parameters, fusion correlations, and final diagnostic assessments
for all 25 clinical test cases.
"""
from typing import Dict, Any, List, Optional

CLINICAL_CASES_25: List[Dict[str, Any]] = [
    # Case 01 - Normal Baseline (Requested explicitly by user)
    {
        "case_number": 1,
        "case_id": "case_01",
        "patient_id": "PT-10483",
        "name": "Marcus Chen",
        "age": 42,
        "gender": "Male",
        "category": "normal",
        "primary_diagnosis": "Normal Sinus Rhythm & Intact Mechanical Function",
        "symptoms": "Annual executive athletic cardiac screening. Asymptomatic endurance marathon runner.",
        "medical_history": "No known cardiovascular pathology. Baseline resting ECG normal.",
        "ecg_finding": "Normal Sinus Rhythm (68 bpm) with normal P-wave axis, PR interval (154 ms), narrow QRS (88 ms), and isoelectric ST segments.",
        "ecg_conf": 0.98,
        "rhythm_type": "NORM",
        "heart_rate": 68,
        "pr_interval": 154,
        "qrs_duration": 88,
        "qtc_interval": 412,
        "ecg_evidence": [
            "Ventricular rate: 68 bpm (Regular normal sinus rhythm)",
            "PR interval: 154 ms | QRS: 88 ms | QTc: 412 ms",
            "No ST-segment elevation, depression, or pathological Q-waves",
            "Normal frontal plane axis (approx +60°)"
        ],
        "echo_finding": "Preserved Left Ventricular Systolic Function (LVEF 65%) with Normal Chamber Dimensions and Intact Wall Motion.",
        "echo_conf": 0.97,
        "lvef": 65.0,
        "echo_evidence": [
            "Estimated Left Ventricular Ejection Fraction (LVEF): 65.0% (Normal ≥ 55%)",
            "Cardiac Function Category: Normal EF (≥55%) (97.4% confidence)",
            "Left ventricular internal dimension in diastole (LVEDD): 48 mm (Normal)",
            "Interventricular septum (IVS): 9.5 mm (Normal wall thickness)",
            "Normal biventricular contractility with no regional wall motion defects"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant normal baseline: Normal 12-lead electrical conduction corroborates fully preserved mechanical pump performance (LVEF 65%).",
        "suspected_condition": "The patient has a Normal Cardiovascular Baseline with Preserved Biventricular Function and Intact Conduction.",
        "clinical_priority": "ROUTINE / LOW PRIORITY — Routine Annual Cardiovascular Wellness Screening",
        "priority_level": "routine",
        "differentials": [
            {"condition": "Normal Sinus Rhythm & Healthy Myocardial Mechanics", "probability": "High (>98%)", "evidence": "Isoelectric ST segments, normal intervals, and normal global wall motion with LVEF 65%", "status": "suspected"},
            {"condition": "Physiological Athletic Remodeling", "probability": "Secondary (8%)", "evidence": "Resting sinus bradycardia in endurance-trained athlete without pathological remodeling", "status": "secondary"}
        ],
        "recommendations": [
            "Reassure patient regarding excellent baseline cardiovascular performance and preserved systolic function.",
            "Maintain current regular aerobic exercise regimen (150+ minutes moderate-to-vigorous weekly).",
            "Heart-healthy Mediterranean diet with scheduled age-appropriate wellness follow-up in 12 months."
        ]
    },
    # Case 02 - Acute Anterior STEMI
    {
        "case_number": 2,
        "case_id": "case_02",
        "patient_id": "PT-10482",
        "name": "Eleanor Vance",
        "age": 64,
        "gender": "Female",
        "category": "critical",
        "primary_diagnosis": "Acute Anterior ST-Elevation Myocardial Infarction (STEMI)",
        "symptoms": "Acute retrosternal crushing chest pain radiating to left arm and jaw (3 hours duration), diaphoresis, dyspnea on minimal exertion.",
        "medical_history": "Essential hypertension (12 years), hyperlipidemia, 25 pack-year smoking. No prior PCI or CABG.",
        "ecg_finding": "Sinus rhythm (94 bpm) with marked convex ST-segment elevation in leads V1-V4 (up to 4.1 mm) and reciprocal ST depression in II, III, aVF. Acute Anterior STEMI.",
        "ecg_conf": 0.96,
        "rhythm_type": "MI",
        "heart_rate": 94,
        "pr_interval": 162,
        "qrs_duration": 96,
        "qtc_interval": 448,
        "ecg_evidence": [
            "ST elevation in V1: 2.8 mm, V2: 4.1 mm, V3: 3.6 mm, V4: 2.2 mm",
            "Reciprocal ST depression in inferior leads III and aVF (>1.5 mm)",
            "Developing pathological Q-waves in leads V2-V3",
            "MI probability: 96.2% (PTB-XL Anterior MI Class)"
        ],
        "echo_finding": "Severely reduced left ventricular systolic function with LVEF 33%. Severe apical cap akinesis and anterior-septal hypokinesia (LAD territory).",
        "echo_conf": 0.94,
        "lvef": 33.0,
        "echo_evidence": [
            "Estimated LVEF: 33.0% (Severely Reduced, HFrEF)",
            "Wall Motion Score Index (WMSI): 2.15",
            "Apical cap akinesis and anterior interventricular septal hypokinesia",
            "Preserved basal posterior and lateral wall thickening"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant LAD territory acute transmural infarction: Electrophysiological ST elevation corresponds directly to mechanical apical akinesis.",
        "suspected_condition": "The patient may have Acute Anterior ST-Elevation Myocardial Infarction (STEMI) with Resultant Acute Systolic Dysfunction (LVEF 33%) and Apical Akinesis.",
        "clinical_priority": "CRITICAL / STAT — Emergent Cardiac Catheterization & Primary PCI (<90 min)",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Acute Transmural STEMI (Proximal LAD Occlusion)", "probability": "High (>95%)", "evidence": "Convex ST elevation V1-V4 with reciprocal depression and matched apical akinesis", "status": "suspected"},
            {"condition": "Takotsubo (Stress) Cardiomyopathy", "probability": "Secondary (12%)", "evidence": "Apical ballooning pattern; requires emergent angiography to rule out culprit lesion", "status": "secondary"},
            {"condition": "Acute Myopericarditis", "probability": "Low (<4%)", "evidence": "Absence of diffuse concave elevation; regional wall motion defect confirms CAD", "status": "ruled_out"}
        ],
        "recommendations": [
            "Activate Cardiac Catheterization Laboratory for Emergent Primary PCI (<90 min door-to-balloon).",
            "Administer Dual Antiplatelet Therapy (Aspirin 325mg + Ticagrelor 180mg) and IV unfractionated heparin.",
            "Continuous 12-lead ECG telemetry for acute ischemic ventricular arrhythmia surveillance.",
            "Serial high-sensitivity cardiac troponin I (hs-cTnI) at 0, 1, and 3 hours.",
            "Post-revascularization echocardiogram to assess residual LVEF and mechanical complications."
        ]
    },
    # Case 03 - Acute Inferolateral STEMI
    {
        "case_number": 3,
        "case_id": "case_03",
        "patient_id": "PT-10487",
        "name": "David Miller",
        "age": 67,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Acute Inferolateral STEMI (LCx / RCA Occlusion)",
        "symptoms": "Severe epigastric burning radiating to interscapular region, acute diaphoresis, nausea, weakness for 4 hours.",
        "medical_history": "Type 2 diabetes mellitus (insulin-dependent), essential hypertension, 40 pack-year smoking.",
        "ecg_finding": "Convex ST-segment elevation in leads II, III, aVF (2.5-3.2 mm) and V5-V6 with reciprocal ST depression in lead aVL (2.1 mm). Inferolateral STEMI.",
        "ecg_conf": 0.94,
        "rhythm_type": "MI",
        "heart_rate": 86,
        "pr_interval": 172,
        "qrs_duration": 94,
        "qtc_interval": 442,
        "ecg_evidence": [
            "ST elevation in II: 2.5 mm, III: 3.2 mm, aVF: 2.8 mm",
            "Lateral lead ST elevation in V5-V6 (1.8 mm)",
            "Reciprocal ST depression in aVL (2.1 mm)",
            "MI probability: 94.5%"
        ],
        "echo_finding": "Moderately reduced left ventricular systolic function with LVEF 42%. Basal and mid-inferior/lateral wall akinesis in LCx/RCA territory.",
        "echo_conf": 0.92,
        "lvef": 42.0,
        "echo_evidence": [
            "Estimated LVEF: 42.0% (Moderately Reduced)",
            "Basal-inferior and lateral wall akinesis",
            "Compensatory hyperkinesis of anterior-apical segments",
            "Normal right ventricular systolic excursion (TAPSE 18 mm)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant inferolateral myocardial infarction: Inferior/lateral ST elevation aligns with basal-inferior akinesis.",
        "suspected_condition": "The patient may have Acute Inferolateral STEMI with Basal-Inferior Akinesis and Moderately Reduced LVEF (42%).",
        "clinical_priority": "CRITICAL / STAT — Emergent Cardiac Catheterization & Primary PCI (<90 min)",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Acute Inferolateral STEMI (Culprit LCx / Dominant RCA)", "probability": "High (>94%)", "evidence": "ST elevation in inferior and lateral leads with reciprocal aVL depression and matched wall akinesis", "status": "suspected"},
            {"condition": "Acute Gastrointestinal Emergency", "probability": "Low (<3%)", "evidence": "Epigastric symptoms represent referred ischemic discomfort; ECG proves acute coronary syndrome", "status": "ruled_out"}
        ],
        "recommendations": [
            "Immediate activation of Cardiac Catheterization Laboratory for primary PCI.",
            "Weight-adjusted heparin bolus and loading doses of Aspirin 325mg + Prasugrel 60mg.",
            "Right-sided lead ECG (V3R, V4R) to exclude concomitant proximal RCA right ventricular infarction.",
            "Avoid nitrates or aggressive diuretics if right ventricular involvement is suspected."
        ]
    },
    # Case 04 - Concentric LVH & Prior Silent MI
    {
        "case_number": 4,
        "case_id": "case_04",
        "patient_id": "PT-10485",
        "name": "Robert Kowalski",
        "age": 58,
        "gender": "Male",
        "category": "structural",
        "primary_diagnosis": "Concentric Left Ventricular Hypertrophy & Prior Silent Inferior MI",
        "symptoms": "Exertional dyspnea on climbing 2 flights of stairs, mild fatigue, episodic non-radiating chest tightness.",
        "medical_history": "15-year history of poorly controlled essential hypertension, obesity (BMI 31.4), hypertriglyceridemia.",
        "ecg_finding": "Voltage criteria for LVH (Sokolow-Lyon index SV1 + RV5 = 4.2 mV) with secondary lateral ST-T strain pattern and pathological Q-waves in III & aVF.",
        "ecg_conf": 0.93,
        "rhythm_type": "HYP",
        "heart_rate": 76,
        "pr_interval": 168,
        "qrs_duration": 104,
        "qtc_interval": 436,
        "ecg_evidence": [
            "Sokolow-Lyon index: 42 mm (>35 mm criteria for LVH)",
            "Asymmetric T-wave inversion and ST depression in leads I, aVL, V5, V6",
            "Pathological Q-waves in leads III and aVF (>0.04s, >25% R-wave)",
            "HYP probability: 93.1%"
        ],
        "echo_finding": "Concentric left ventricular hypertrophy (IVS 14.5 mm, posterior wall 13.8 mm) with preserved LVEF 56% and basal inferior thinning/hypokinesia.",
        "echo_conf": 0.91,
        "lvef": 56.0,
        "echo_evidence": [
            "Estimated LVEF: 56.0% (Preserved Global Function)",
            "Interventricular septal thickness: 14.5 mm (Severe concentric LVH)",
            "Left ventricular posterior wall thickness: 13.8 mm",
            "Basal inferior wall thinning (6 mm) and regional hypokinesia indicative of prior silent scar"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant hypertensive heart disease and chronic scar: High electrical voltage and lateral strain match echocardiographic concentric remodeling.",
        "suspected_condition": "The patient may have Concentric Left Ventricular Hypertrophy (LVH) with Chronic Hypertensive Myopathy and Prior Silent Inferior Scar.",
        "clinical_priority": "MODERATE PRIORITY — Outpatient Blood Pressure Optimization & Target Organ Surveillance",
        "priority_level": "moderate",
        "differentials": [
            {"condition": "Hypertensive Concentric LVH with Chronic Myocardial Scar", "probability": "High (>90%)", "evidence": "Symmetric wall thickening (IVS 14.5 mm), Sokolow-Lyon criteria, and inferior thinning", "status": "suspected"},
            {"condition": "Early Hypertrophic Non-Obstructive Cardiomyopathy", "probability": "Secondary (15%)", "evidence": "Assess response after blood pressure normalization", "status": "secondary"}
        ],
        "recommendations": [
            "Intensify antihypertensive therapy with ARB (Losartan/Valsartan) and Calcium Channel Blocker (Amlodipine).",
            "Target home blood pressure < 130/80 mmHg with ambulatory BP monitoring.",
            "Non-invasive coronary CT angiography or stress echocardiography to evaluate ischemic burden.",
            "Urinary albumin-to-creatinine ratio and comprehensive metabolic panel for end-organ evaluation."
        ]
    },
    # Case 05 - Chronic Apical LV Aneurysm & Severe Ischemia
    {
        "case_number": 5,
        "case_id": "case_05",
        "patient_id": "PT-10492",
        "name": "Arthur Pendelton",
        "age": 74,
        "gender": "Male",
        "category": "heart_failure",
        "primary_diagnosis": "Chronic Apical LV Aneurysm with Ischemic Cardiomyopathy & Mural Thrombus",
        "symptoms": "Chronic congestive heart failure symptoms, orthopnea, paroxysmal nocturnal dyspnea, fatigue.",
        "medical_history": "Transmural anterior myocardial infarction 5 years ago, persistent apical dyskinesis with true aneurysmal pouch.",
        "ecg_finding": "Sinus rhythm with deep pathological Q-waves in V1-V4 and persistent ST-segment elevation (>2.5 mm) indicative of chronic ventricular aneurysm.",
        "ecg_conf": 0.94,
        "rhythm_type": "MI",
        "heart_rate": 78,
        "pr_interval": 178,
        "qrs_duration": 112,
        "qtc_interval": 454,
        "ecg_evidence": [
            "Persistent ST elevation in V1-V4 without acute dynamic evolution (>3 months)",
            "Deep QS complexes in V1-V3 and broad Q-waves in V4",
            "Low limb lead voltages",
            "MI / Chronic Scar pattern: 94.2%"
        ],
        "echo_finding": "Severely reduced LVEF 26%. True apical left ventricular aneurysm with paradoxic systolic bulging (dyskinesis) and layered apical mural thrombus.",
        "echo_conf": 0.95,
        "lvef": 26.0,
        "echo_evidence": [
            "Estimated LVEF: 26.0% (Severely Reduced, HFrEF)",
            "Large thin-walled apical dyskinetic pouch (4.2 x 3.6 cm)",
            "Layered apical mural thrombus (1.8 x 1.2 cm) without mobile pedicle",
            "Severe global hypokinesia of mid-ventricular segments"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant chronic apical aneurysm: Persistent precordial ST elevation matches anatomical apical dyskinetic pouch and severe HFrEF.",
        "suspected_condition": "The patient may have Chronic Apical Left Ventricular Aneurysm with Severe Ischemic Cardiomyopathy (LVEF 26%) and Active Apical Mural Thrombus.",
        "clinical_priority": "HIGH PRIORITY — Inpatient Anticoagulation Protocol & Quadruple GDMT Optimization",
        "priority_level": "high",
        "differentials": [
            {"condition": "Chronic Post-Infarct LV Aneurysm with Mural Thrombus", "probability": "High (>95%)", "evidence": "Persistent ST elevation, apical dyskinesis, and well-demarcated apical clot", "status": "suspected"},
            {"condition": "Acute Re-infarction", "probability": "Low (<5%)", "evidence": "Troponin stable and absence of new ischemic chest pain", "status": "ruled_out"}
        ],
        "recommendations": [
            "Initiate therapeutic oral anticoagulation (Warfarin with INR target 2.0-3.0 or DOAC) for at least 3-6 months for LV thrombus.",
            "Optimize Guideline-Directed Medical Therapy: ARNI (Sacubitril/Valsartan), Beta-blocker (Carvedilol), MRA (Spironolactone), SGLT2i.",
            "Electrophysiology consultation for primary prevention Implantable Cardioverter-Defibrillator (ICD).",
            "Repeat contrast echocardiogram or cardiac MRI in 3 months to monitor thrombus resolution."
        ]
    },
    # Case 06 - Normal Baseline (Maya Lin)
    {
        "case_number": 6,
        "case_id": "case_06",
        "patient_id": "PT-10501",
        "name": "Maya Lin",
        "age": 35,
        "gender": "Female",
        "category": "normal",
        "primary_diagnosis": "Normal Electrophysiological & Structural Cardiac Assessment",
        "symptoms": "Pre-employment physical examination and routine baseline wellness screening.",
        "medical_history": "No known past medical history, no cardiovascular risk factors, non-smoker.",
        "ecg_finding": "Normal Sinus Rhythm (72 bpm), normal frontal and horizontal axis, normal PR and QRS intervals, isoelectric ST segments.",
        "ecg_conf": 0.99,
        "rhythm_type": "NORM",
        "heart_rate": 72,
        "pr_interval": 148,
        "qrs_duration": 84,
        "qtc_interval": 408,
        "ecg_evidence": [
            "Resting heart rate: 72 bpm (Regular sinus rhythm)",
            "PR interval: 148 ms, QRS: 84 ms, QTc: 408 ms",
            "Isoelectric ST segments across all 12 leads",
            "Normal T-wave morphology and transition"
        ],
        "echo_finding": "Normal left ventricular chamber size and geometry with preserved systolic ejection fraction (LVEF 64%). Intact valvular function.",
        "echo_conf": 0.98,
        "lvef": 64.0,
        "echo_evidence": [
            "Estimated LVEF: 64.0% (Normal ≥ 55%)",
            "Left ventricular end-diastolic volume: 92 mL (Normal)",
            "Intact mitral, aortic, and tricuspid valve motion without significant regurgitation",
            "No regional wall motion abnormalities or pericardial effusion"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant normal assessment: Intact electrical conduction corroborates normal systolic ejection fraction (LVEF 64%).",
        "suspected_condition": "The patient has a Normal Electrophysiological and Structural Cardiac Profile with Preserved Function.",
        "clinical_priority": "ROUTINE / LOW PRIORITY — Routine Annual Cardiovascular Wellness Screening",
        "priority_level": "routine",
        "differentials": [
            {"condition": "Normal Healthy Cardiovascular Baseline", "probability": "High (>99%)", "evidence": "Normal 12-lead ECG, normal LVEF (64%), and normal cardiac chamber geometry", "status": "suspected"}
        ],
        "recommendations": [
            "Reassure patient regarding completely normal cardiovascular evaluation.",
            "Continue standard healthy lifestyle and routine health maintenance.",
            "Follow-up on routine schedule."
        ]
    },
    # Case 07 - Atrial Fibrillation with RVR
    {
        "case_number": 7,
        "case_id": "case_07",
        "patient_id": "PT-10484",
        "name": "Sarah Jenkins",
        "age": 71,
        "gender": "Female",
        "category": "arrhythmia",
        "primary_diagnosis": "Atrial Fibrillation with Rapid Ventricular Response (RVR)",
        "symptoms": "Sudden-onset irregular racing palpitations, presyncope, fatigue, acute lightheadedness.",
        "medical_history": "Paroxysmal atrial fibrillation, coronary artery disease status-post DES (2020), mild CKD stage 3a.",
        "ecg_finding": "Irregularly irregular narrow-complex tachycardia (ventricular rate 124 bpm) with absent P-waves and fibrillatory baseline. Atrial Fibrillation with RVR.",
        "ecg_conf": 0.96,
        "rhythm_type": "AFIB",
        "heart_rate": 124,
        "pr_interval": 0,
        "qrs_duration": 86,
        "qtc_interval": 420,
        "ecg_evidence": [
            "Irregularly irregular R-R intervals with average ventricular rate 124 bpm",
            "Absence of distinct organized P-waves; coarse fibrillatory f-waves in V1",
            "Rate-dependent non-specific ST depression in lateral leads V5-V6",
            "AFib probability: 96.4%"
        ],
        "echo_finding": "Mildly reduced left ventricular systolic function (LVEF 48%) with moderate left atrial dilation (LAVi 42 mL/m²) and mild functional mitral regurgitation.",
        "echo_conf": 0.92,
        "lvef": 48.0,
        "echo_evidence": [
            "Estimated LVEF: 48.0% (Mildly Reduced, rate-related)",
            "Left atrial volume index (LAVi): 42 mL/m² (Moderate left atrial enlargement)",
            "Global LV contraction mildly asynchronous secondary to tachycardia",
            "No intracardiac thrombus visualized in left ventricle"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant tachyarrhythmia: Rapid irregular atrial fibrillation directly accounts for structural atrial dilation and mild rate-related systolic blunting.",
        "suspected_condition": "The patient may have Atrial Fibrillation with Rapid Ventricular Response (RVR), Left Atrial Dilation, and Elevated Thromboembolic Risk.",
        "clinical_priority": "HIGH PRIORITY — Urgent Rate Control & Systemic Anticoagulation",
        "priority_level": "high",
        "differentials": [
            {"condition": "Atrial Fibrillation with Rapid Ventricular Response", "probability": "High (>95%)", "evidence": "Irregularly irregular rhythm with absent P-waves and rate 124 bpm with left atrial dilation", "status": "suspected"},
            {"condition": "Atrial Flutter with Variable AV Conduction", "probability": "Secondary (14%)", "evidence": "Evaluate lead II/aVF for underlying sawtooth waves upon rate slowing", "status": "secondary"}
        ],
        "recommendations": [
            "Intravenous rate control with Beta-blocker (Metoprolol 5mg IV bolus) or Diltiazem titration to target resting HR < 100 bpm.",
            "Calculate CHA2DS2-VASc score (Score = 4: Age 71, Female, CAD, HTN) -> Initiate Oral Anticoagulation (DOAC: Apixaban 5mg BID).",
            "Order Transesophageal Echocardiogram (TEE) prior to considering electrical or pharmacological cardioversion.",
            "Check serum electrolytes, TSH, and renal function panel."
        ]
    },
    # Case 08 - Sustained Monomorphic VT
    {
        "case_number": 8,
        "case_id": "case_08",
        "patient_id": "PT-10491",
        "name": "Carlos Morales",
        "age": 61,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Sustained Monomorphic Ventricular Tachycardia (VT) with Post-Infarct Scar",
        "symptoms": "Sudden presyncope, intense pounding palpitations, hypotension, diaphoresis.",
        "medical_history": "Prior coronary artery bypass graft (CABG x3 in 2016), ischemic cardiomyopathy with apical myocardial scar.",
        "ecg_finding": "Wide-complex regular monomorphic tachycardia (165 bpm, QRS duration 164 ms) with northwest axis and AV dissociation (capture/fusion beats). Monomorphic VT.",
        "ecg_conf": 0.95,
        "rhythm_type": "VT",
        "heart_rate": 165,
        "pr_interval": 0,
        "qrs_duration": 164,
        "qtc_interval": 510,
        "ecg_evidence": [
            "Regular wide QRS tachycardia (>160 ms) at 165 bpm",
            "Concordant positive precordial QRS morphology (V1-V6)",
            "Evidence of AV dissociation with intermittent fusion beats",
            "Ventricular Tachycardia probability: 95.8%"
        ],
        "echo_finding": "Severely reduced LVEF 30%. Dense apical-anterior myocardial scar with marked thinning and compensatory basal contractility.",
        "echo_conf": 0.93,
        "lvef": 30.0,
        "echo_evidence": [
            "Estimated LVEF: 30.0% (Severely Reduced, HFrEF)",
            "Extensive anterior-apical transmural scar with wall thinning (5.5 mm)",
            "Marked regional dyskinesis at scar border zone (arrhythmogenic substrate)",
            "Elevated left ventricular end-diastolic pressure"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant scar-mediated ventricular arrhythmia: Prior ischemic scar provides anatomic re-entrant circuit for wide-complex tachycardia.",
        "suspected_condition": "The patient may have Sustained Monomorphic Ventricular Tachycardia (165 bpm) Secondary to Chronic Post-Infarct Myocardial Scar (LVEF 30%).",
        "clinical_priority": "CRITICAL / STAT — Emergent Hemodynamic Stabilization & Anti-Arrhythmic Protocol",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Monomorphic Ventricular Tachycardia (Scar-Related Re-entry)", "probability": "High (>95%)", "evidence": "Wide QRS tachycardia (164 ms), AV dissociation, and ischemic apical scar substrate", "status": "suspected"},
            {"condition": "SVT with Pre-existing Bundle Branch Aberrancy", "probability": "Low (<5%)", "evidence": "AV dissociation and capture beats confirm ventricular origin", "status": "ruled_out"}
        ],
        "recommendations": [
            "Immediate synchronized electrical cardioversion (100-200J) if patient exhibits hemodynamic compromise (hypotension, altered mental status).",
            "Intravenous Amiodarone (150 mg bolus over 10 min followed by 1 mg/min continuous infusion) for stable VT.",
            "Urgent admission to Cardiac Intensive Care Unit (CICU) for continuous rhythm monitoring.",
            "Electrophysiology consultation for secondary prevention ICD implantation and catheter scar ablation."
        ]
    },
    # Case 09 - Complete (3rd-Degree) AV Block
    {
        "case_number": 9,
        "case_id": "case_09",
        "patient_id": "PT-10495",
        "name": "Henry Thorne",
        "age": 81,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Complete (3rd-Degree) Atrioventricular Block with Hemodynamic Bradycardia",
        "symptoms": "Sudden syncopal episode while standing, severe lightheadedness, fatigue, resting pulse 38 bpm.",
        "medical_history": "Lev-Lenegre conducting system sclerosis, essential hypertension, prior transcatheter aortic valve implant.",
        "ecg_finding": "Complete AV dissociation with sinus P-waves (rate 88 bpm) completely dissociated from wide ventricular escape rhythm (rate 38 bpm, QRS 148 ms). 3rd-Degree AV Block.",
        "ecg_conf": 0.97,
        "rhythm_type": "CD",
        "heart_rate": 38,
        "pr_interval": 0,
        "qrs_duration": 148,
        "qtc_interval": 482,
        "ecg_evidence": [
            "Complete dissociation between atrial P-waves (88 bpm) and ventricular complexes (38 bpm)",
            "Wide QRS infranodal ventricular escape pacemaker (148 ms)",
            "Profound symptomatic hemodynamic bradycardia",
            "Conduction Disease / Complete Block probability: 97.1%"
        ],
        "echo_finding": "Preserved left ventricular systolic function with LVEF 54%. Marked bradycardic stroke volume augmentation with mild concentric LV remodeling.",
        "echo_conf": 0.94,
        "lvef": 54.0,
        "echo_evidence": [
            "Estimated LVEF: 54.0% (Preserved pump function)",
            "Pronounced diastolic filling time secondary to severe bradycardia (38 bpm)",
            "Mild concentric left ventricular remodeling (IVS 12.5 mm)",
            "Normal bi-leaflet mitral and tricuspid valve excursion"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant high-grade infranodal conduction failure: Complete AV dissociation on ECG with preserved mechanical myocardium requiring pacing.",
        "suspected_condition": "The patient may have Complete (3rd-Degree) Atrioventricular Block with Symptomatic Stokes-Adams Syncope and Hemodynamic Bradycardia.",
        "clinical_priority": "CRITICAL / STAT — Urgent Inpatient Cardiac Pacing & Transvenous Lead Setup",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Complete 3rd-Degree High-Grade AV Block (Infranodal)", "probability": "High (>98%)", "evidence": "Complete AV dissociation with independent regular P-waves and slow wide ventricular escape", "status": "suspected"},
            {"condition": "High-Grade 2nd-Degree AV Block (Mobitz II)", "probability": "Low (<4%)", "evidence": "Absence of conducted beats confirms 3rd-degree complete block", "status": "ruled_out"}
        ],
        "recommendations": [
            "Transcutaneous pacing pads attached immediately; standby IV Atropine (0.5-1 mg) and Isoproterenol infusion.",
            "Urgent transfer to Cardiac Catheterization / Electrophysiology lab for temporary transvenous pacing wire placement.",
            "Permanent dual-chamber pacemaker (PPM: DDD mode) implantation (ACC/AHA Class I indication).",
            "Immediately hold all nodal blocking agents (beta-blockers, CCBs, digoxin)."
        ]
    },
    # Case 10 - Non-Ischemic DCM & Complete LBBB
    {
        "case_number": 10,
        "case_id": "case_10",
        "patient_id": "PT-10486",
        "name": "Amina Diallo",
        "age": 49,
        "gender": "Female",
        "category": "heart_failure",
        "primary_diagnosis": "Non-Ischemic Dilated Cardiomyopathy (HFrEF) with Complete LBBB",
        "symptoms": "Subacute progressive NYHA Class III heart failure symptoms over 4 months, orthopnea, bilateral lower extremity edema.",
        "medical_history": "Post-partum cardiomyopathy history (2018), persistent complete LBBB with ventricular dyssynchrony.",
        "ecg_finding": "Sinus rhythm with wide QRS complete Left Bundle Branch Block (LBBB: QRS duration 164 ms) with broad notched R-waves in I, aVL, V5-V6 and secondary ST-T discordance.",
        "ecg_conf": 0.95,
        "rhythm_type": "CD",
        "heart_rate": 82,
        "pr_interval": 184,
        "qrs_duration": 164,
        "qtc_interval": 476,
        "ecg_evidence": [
            "Wide QRS complex: 164 ms (>130 ms CRT criterion)",
            "Monophasic notched R-waves in leads I, aVL, V5, V6 with absent septal Q-waves",
            "Secondary ST-T segment discordance",
            "Conduction Disturbance / LBBB probability: 95.2%"
        ],
        "echo_finding": "Severely reduced LVEF 28%. Marked left ventricular spherical dilation (LVEDD 66 mm) with global hypokinesia and severe interventricular septal flash dyssynchrony.",
        "echo_conf": 0.94,
        "lvef": 28.0,
        "echo_evidence": [
            "Estimated LVEF: 28.0% (Severely Reduced, HFrEF)",
            "Left ventricular end-diastolic dimension (LVEDD): 66 mm (Severe dilation)",
            "Septal flash and apical rocking (mechanical dyssynchrony)",
            "Moderate secondary functional mitral regurgitation"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant electromechanical dyssynchrony: Complete LBBB (QRS 164 ms) causes mechanical septal flash and severe dilated cardiomyopathy.",
        "suspected_condition": "The patient may have Non-Ischemic Dilated Cardiomyopathy (HFrEF) with Complete LBBB (QRS 164 ms) and Severe Mechanical Dyssynchrony.",
        "clinical_priority": "HIGH PRIORITY — Inpatient Guideline-Directed Medical Therapy & CRT-D Evaluation",
        "priority_level": "high",
        "differentials": [
            {"condition": "Non-Ischemic Dilated Cardiomyopathy with LBBB Dyssynchrony", "probability": "High (>90%)", "evidence": "Marked LV chamber dilation (66 mm), wide LBBB (164 ms), and septal flash", "status": "suspected"},
            {"condition": "Ischemic Cardiomyopathy", "probability": "Secondary (20%)", "evidence": "Coronary angiography recommended to exclude multi-vessel CAD", "status": "secondary"}
        ],
        "recommendations": [
            "Initiate quadruple-pillar Guideline-Directed Medical Therapy: ARNI (Sacubitril/Valsartan), Beta-blocker (Carvedilol), MRA (Spironolactone), SGLT2i (Dapagliflozin).",
            "Electrophysiology consultation for Cardiac Resynchronization Therapy Defibrillator (CRT-D) (Class I indication for LBBB QRS > 150 ms and LVEF ≤ 35%).",
            "Strict dietary sodium (<2g/day) and fluid restriction (<1.5L/day) with daily weight monitoring.",
            "Cardiac MRI for myocardial late gadolinium enhancement mapping."
        ]
    },
    # Case 11 - Normal Baseline (Lucas Vance)
    {
        "case_number": 11,
        "case_id": "case_02",
        "patient_id": "PT-10502",
        "name": "Lucas Vance",
        "age": 45,
        "gender": "Male",
        "category": "normal",
        "primary_diagnosis": "Normal Advanced Cardiac Imaging & Strain Analysis",
        "symptoms": "Executive health checkup and pre-participation sports clearance.",
        "medical_history": "No history of cardiac illness, normal lipid profile, physically active.",
        "ecg_finding": "Sinus bradycardia (56 bpm, physiological), normal PR interval (160 ms), normal QRS axis (+45°), intact repolarization.",
        "ecg_conf": 0.98,
        "rhythm_type": "NORM",
        "heart_rate": 56,
        "pr_interval": 160,
        "qrs_duration": 86,
        "qtc_interval": 404,
        "ecg_evidence": [
            "Resting heart rate: 56 bpm (Physiological athletic sinus bradycardia)",
            "Normal QRS duration (86 ms) and normal frontal axis",
            "Isoelectric ST segments across all territories",
            "Normal T-wave morphology"
        ],
        "echo_finding": "Normal left ventricular systolic performance with LVEF 60% and normal global longitudinal strain (GLS -21.4%). Intact mechanics.",
        "echo_conf": 0.97,
        "lvef": 60.0,
        "echo_evidence": [
            "Estimated LVEF: 60.0% (Preserved, Normal)",
            "Global Longitudinal Strain (GLS): -21.4% (Normal reference < -18%)",
            "Normal chamber volumes and wall thickness",
            "Intact right ventricular function (TAPSE 22 mm)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant normal athletic assessment: Normal electrical findings corroborate preserved mechanical systolic performance and strain.",
        "suspected_condition": "The patient has a Normal Cardiovascular Assessment with Preserved Strain and Intact Mechanics.",
        "clinical_priority": "ROUTINE / LOW PRIORITY — Routine Annual Cardiovascular Wellness Screening",
        "priority_level": "routine",
        "differentials": [
            {"condition": "Normal Sinus Rhythm & Healthy Athlete's Heart", "probability": "High (>98%)", "evidence": "Normal resting ECG with physiological bradycardia, LVEF 60%, and normal strain (-21.4%)", "status": "suspected"}
        ],
        "recommendations": [
            "Reassure patient regarding optimal cardiac health and fitness.",
            "Continue regular cardiovascular training.",
            "Routine health checkup in 12 months."
        ]
    },
    # Case 12 - Hypertrophic Obstructive CM (HOCM)
    {
        "case_number": 12,
        "case_id": "case_12",
        "patient_id": "PT-10488",
        "name": "Sofia Rossi",
        "age": 38,
        "gender": "Female",
        "category": "structural",
        "primary_diagnosis": "Hypertrophic Obstructive Cardiomyopathy (HOCM) with Severe LVOT Gradient",
        "symptoms": "Exertional lightheadedness, postprandial dyspnea, non-anginal atypical chest tightness, loud systolic ejection murmur.",
        "medical_history": "Family history of premature sudden cardiac death in first-degree relative at age 42. Asymmetric septal hypertrophy.",
        "ecg_finding": "High precordial voltages (SV1 + RV5 = 4.6 mV), deep narrow 'dagger-like' Q-waves in lateral leads (I, aVL, V4-V6), and giant inverted T-waves in V4-V5.",
        "ecg_conf": 0.96,
        "rhythm_type": "HYP",
        "heart_rate": 74,
        "pr_interval": 152,
        "qrs_duration": 98,
        "qtc_interval": 462,
        "ecg_evidence": [
            "Deep narrow dagger Q-waves in leads I, aVL, V5, V6 (<0.04s, >3mm)",
            "Marked voltage criteria for left ventricular hypertrophy (46 mm)",
            "Giant inverted T-waves in anterolateral leads",
            "HYP / HOCM probability: 96.1%"
        ],
        "echo_finding": "Hyperdynamic systolic function (LVEF 72%) with marked asymmetric septal hypertrophy (IVS 22 mm), Systolic Anterior Motion (SAM) of anterior mitral leaflet, and dynamic peak LVOT gradient of 68 mmHg.",
        "echo_conf": 0.96,
        "lvef": 72.0,
        "echo_evidence": [
            "Estimated LVEF: 72.0% (Hyperdynamic systolic performance)",
            "Interventricular septal thickness: 22 mm (Posterior wall: 11 mm, Septal/Posterior ratio 2.0:1)",
            "Systolic Anterior Motion (SAM) of mitral leaflet with mid-systolic contact",
            "Peak dynamic Left Ventricular Outflow Tract (LVOT) gradient: 68 mmHg at rest"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant HOCM: Deep lateral dagger Q-waves align with severe asymmetric septal hypertrophy (22 mm) and dynamic LVOT obstruction.",
        "suspected_condition": "The patient may have Hypertrophic Obstructive Cardiomyopathy (HOCM) with Severe Asymmetric Septal Hypertrophy (22 mm), SAM, and Dynamic LVOT Gradient (68 mmHg).",
        "clinical_priority": "HIGH PRIORITY — Specialized Cardiomyopathy Center Referral & Sudden Death Risk Stratification",
        "priority_level": "high",
        "differentials": [
            {"condition": "Hypertrophic Obstructive Cardiomyopathy (Sarcomeric)", "probability": "High (>95%)", "evidence": "Asymmetry ratio 2:1, SAM of mitral valve, resting LVOT gradient 68 mmHg, and dagger Q-waves", "status": "suspected"},
            {"condition": "Hypertensive Heart Disease", "probability": "Low (<5%)", "evidence": "Asymmetry ratio > 1.5 and dynamic gradient exclude hypertensive hypertrophy", "status": "ruled_out"}
        ],
        "recommendations": [
            "Initiate first-line therapy with non-vasodilating Beta-blockers (Metoprolol succinate/Nadolol) or Cardiac Myosin Inhibitor (Mavacamten).",
            "STRICTLY AVOID nitrates, dihydropyridine calcium channel blockers, ACE inhibitors, and high-dose diuretics (worsen LVOT obstruction).",
            "Calculate ESC 5-Year Sudden Cardiac Death (SCD) risk score to assess candidacy for primary prevention ICD.",
            "Genetic counseling and cascade echocardiographic screening for first-degree family members."
        ]
    },
    # Case 13 - Cardiac Transthyretin Amyloidosis
    {
        "case_number": 13,
        "case_id": "case_13",
        "patient_id": "PT-10496",
        "name": "Yuki Tanaka",
        "age": 70,
        "gender": "Male",
        "category": "heart_failure",
        "primary_diagnosis": "Infiltrative Cardiac Transthyretin Amyloidosis (ATTR-CM)",
        "symptoms": "Progressive heart failure with preserved ejection fraction symptoms, fatigue, bilateral ankle edema, dyspnea.",
        "medical_history": "Bilateral carpal tunnel release surgery 6 years ago, lumbar spinal stenosis, low voltage ECG with thick walls.",
        "ecg_finding": "Profound low voltage in limb leads (QRS amplitude < 5 mm in I, II, III) with pseudo-infarction QS pattern in V1-V3 and first-degree AV block (PR 220 ms).",
        "ecg_conf": 0.94,
        "rhythm_type": "CD",
        "heart_rate": 66,
        "pr_interval": 220,
        "qrs_duration": 108,
        "qtc_interval": 468,
        "ecg_evidence": [
            "Low limb lead voltage: QRS < 5 mm in all limb leads",
            "Pseudo-infarct QS pattern in anterior leads V1-V3 without obstructive CAD",
            "First-degree AV block (PR interval 220 ms)",
            "Conduction disease & infiltrative pattern: 94.0%"
        ],
        "echo_finding": "Moderately reduced LVEF 45% with marked symmetric concentric wall thickening (IVS 17 mm), granular sparkling myocardial texture, bi-atrial enlargement, and apical sparing strain pattern.",
        "echo_conf": 0.95,
        "lvef": 45.0,
        "echo_evidence": [
            "Estimated LVEF: 45.0% (HFpEF/HFmrEF)",
            "Interventricular septum: 17 mm with diffuse granular sparkling texture",
            "Apical sparing longitudinal strain pattern ('cherry on top')",
            "Restrictive LV diastolic filling pattern (E/A ratio > 2.5, E/e' > 18)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Classic amyloid discordance: Low electrical voltage on ECG contradicts severe echocardiographic concentric wall thickening.",
        "suspected_condition": "The patient may have Infiltrative Cardiac Transthyretin Amyloidosis (ATTR-CM) with Restrictive Cardiomyopathy and Apical Sparing Strain.",
        "clinical_priority": "MODERATE PRIORITY — Advanced Diagnostic Scintigraphy (99mTc-PYP) & Tafamidis Evaluation",
        "priority_level": "moderate",
        "differentials": [
            {"condition": "Transthyretin Cardiac Amyloidosis (ATTR-CM)", "probability": "High (>90%)", "evidence": "Voltage-thickness discordance, carpal tunnel history, apical sparing strain, and restrictive filling", "status": "suspected"},
            {"condition": "AL (Light Chain) Amyloidosis", "probability": "Secondary (25%)", "evidence": "Requires immediate serum and urine protein immunofixation with serum free light chain (sFLC) assay", "status": "secondary"}
        ],
        "recommendations": [
            "Order 99mTc-Pyrophosphate (PYP) / DPD Bone Scintigraphy to confirm ATTR cardiac uptake (Grade 2-3 uptake diagnostic).",
            "Serum free light chains (kappa/lambda) and serum/urine immunofixation (SPEP/UPEP) to rule out AL amyloidosis.",
            "TTR genetic sequencing to differentiate wild-type from hereditary ATTR-CM.",
            "Consider initiation of Tafamidis (Vyndaqel 61mg daily) to stabilize TTR tetramers and improve survival.",
            "Use cautious loop diuretic titration; avoid beta-blockers, digoxin, and calcium channel blockers."
        ]
    },
    # Case 14 - Severe Calcific Aortic Stenosis
    {
        "case_number": 14,
        "case_id": "case_14",
        "patient_id": "PT-10489",
        "name": "James Wilson",
        "age": 78,
        "gender": "Male",
        "category": "structural",
        "primary_diagnosis": "Severe Symptomatic Calcific Aortic Valve Stenosis",
        "symptoms": "Progressive exertional dyspnea (NYHA Class II-III), near-syncope while walking uphill, late-peaking systolic ejection murmur.",
        "medical_history": "Bicuspid aortic valve, severe annular calcification, hypertension, dyslipidemia.",
        "ecg_finding": "Left ventricular hypertrophy with secondary ST-T strain in lateral leads (I, aVL, V5, V6), left atrial enlargement, and left axis deviation.",
        "ecg_conf": 0.94,
        "rhythm_type": "HYP",
        "heart_rate": 78,
        "pr_interval": 170,
        "qrs_duration": 102,
        "qtc_interval": 446,
        "ecg_evidence": [
            "Sokolow-Lyon LVH criteria: SV1 + RV5 = 39 mm",
            "Downsloping ST depression and inverted T-waves in V5-V6",
            "P-terminal force in lead V1 > 0.04 mm·s (Left atrial enlargement)",
            "Hypertrophy / Valvular Strain probability: 94.1%"
        ],
        "echo_finding": "Moderately preserved LVEF 52% with heavily calcified trileaflet aortic valve, peak transvalvular velocity 4.4 m/s, mean gradient 46 mmHg, and calculated aortic valve area 0.7 cm².",
        "echo_conf": 0.96,
        "lvef": 52.0,
        "echo_evidence": [
            "Estimated LVEF: 52.0% (Borderline Preserved)",
            "Peak aortic jet velocity (Vmax): 4.4 m/s (> 4.0 m/s severe criteria)",
            "Mean transaortic pressure gradient: 46 mmHg (> 40 mmHg severe criteria)",
            "Calculated Aortic Valve Area (AVA by continuity): 0.7 cm² (< 1.0 cm² severe criteria)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant severe aortic stenosis: Valvular strain and LVH on ECG match hemodynamic severe obstruction (Vmax 4.4 m/s, AVA 0.7 cm²).",
        "suspected_condition": "The patient may have Severe Symptomatic Calcific Aortic Valve Stenosis (AVA 0.7 cm², Vmax 4.4 m/s, Mean Gradient 46 mmHg) with Concentric LV Remodeling.",
        "clinical_priority": "HIGH PRIORITY — Urgent Structural Valve Evaluation & TAVR / SAVR Workup",
        "priority_level": "high",
        "differentials": [
            {"condition": "Severe Symptomatic Calcific Aortic Stenosis", "probability": "High (>95%)", "evidence": "Peak velocity 4.4 m/s, mean gradient 46 mmHg, AVA 0.7 cm², and exertional syncope", "status": "suspected"},
            {"condition": "Moderate Aortic Stenosis with Systolic Dysfunction", "probability": "Secondary (10%)", "evidence": "Calculated valve parameters confirm true severe anatomy", "status": "ruled_out"}
        ],
        "recommendations": [
            "Urgent Heart Team consultation for Transcatheter Aortic Valve Replacement (TAVR) vs Surgical AVR.",
            "Pre-procedure exercise stress testing is STRICTLY CONTRAINDICATED in symptomatic severe AS.",
            "Cardiac CT angiography for aortic root annular sizing and peripheral vascular access evaluation.",
            "Avoid aggressive vasodilators (nitrates) or high-dose diuretics to prevent severe hemodynamic collapse."
        ]
    },
    # Case 15 - Severe MVP with Flail Leaflet
    {
        "case_number": 15,
        "case_id": "case_15",
        "patient_id": "PT-10493",
        "name": "Priya Patel",
        "age": 53,
        "gender": "Female",
        "category": "structural",
        "primary_diagnosis": "Severe Acute Mitral Regurgitation with Flail Posterior Leaflet (P2)",
        "symptoms": "Sudden onset severe exertional dyspnea, dry cough, orthopnea following acute chordal rupture, loud pansystolic murmur.",
        "medical_history": "Known mild myxomatous mitral valve disease; developed acute worsening over past 72 hours.",
        "ecg_finding": "Sinus rhythm with biphasic T-waves in inferior leads (II, III, aVF), prominent P-mitrale in lead II, and non-specific lateral repolarization abnormalities.",
        "ecg_conf": 0.92,
        "rhythm_type": "STTC",
        "heart_rate": 84,
        "pr_interval": 164,
        "qrs_duration": 90,
        "qtc_interval": 432,
        "ecg_evidence": [
            "Biphasic and inverted T-waves in inferior leads II, III, aVF",
            "Broad notched P-waves in lead II (P-mitrale > 120 ms)",
            "STTC / Valvular overload probability: 92.4%"
        ],
        "echo_finding": "Preserved LVEF 58% (pseudonormalized by low-impedance LV regurgitation). Severe degenerative mitral regurgitation with ruptured chordae tendineae and P2 flail leaflet.",
        "echo_conf": 0.96,
        "lvef": 58.0,
        "echo_evidence": [
            "Estimated LVEF: 58.0% (Pseudonormalized by acute volume regurgitation)",
            "Flail posterior mitral leaflet segment (P2) with ruptured chordae tendineae",
            "Severe eccentric anteriorly directed mitral regurgitant jet (Regurgitant Volume 68 mL)",
            "Elevated pulmonary artery systolic pressure (PASP 48 mmHg)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant acute valvular emergency: Ruptured chordae and flail leaflet match acute volume overload and inferior-lateral repolarization disturbance.",
        "suspected_condition": "The patient may have Severe Acute Mitral Regurgitation Secondary to Ruptured Chordae Tendineae and Flail Posterior Leaflet (P2 Segment).",
        "clinical_priority": "HIGH PRIORITY — Urgent Surgical Valve Repair / MitraClip Evaluation",
        "priority_level": "high",
        "differentials": [
            {"condition": "Severe Degenerative Mitral Regurgitation (Flail P2 Leaflet)", "probability": "High (>95%)", "evidence": "Torn chordae tendineae, systolic leaflet eversion, and eccentric regurgitant jet volume 68 mL", "status": "suspected"},
            {"condition": "Infective Endocarditis", "probability": "Low (<4%)", "evidence": "No mobile vegetations and absence of fever/bacteremia", "status": "ruled_out"}
        ],
        "recommendations": [
            "Urgent Transesophageal Echocardiogram (TEE) for 3D mitral valve surgical anatomical reconstruction.",
            "Cardiothoracic surgical consultation for minimally invasive robotic mitral valve repair / chordal replacement.",
            "Afterload reduction and judicious loop diuretics for acute pulmonary venous congestion.",
            "Infective endocarditis antibiotic prophylaxis counseling."
        ]
    },
    # Case 16 - Normal Baseline (Oliver Queen)
    {
        "case_number": 16,
        "case_id": "case_16",
        "patient_id": "PT-10503",
        "name": "Oliver Queen",
        "age": 40,
        "gender": "Male",
        "category": "normal",
        "primary_diagnosis": "Normal Functional Cardiac Baseline",
        "symptoms": "Annual corporate health assessment. Active martial arts trainer, fully asymptomatic.",
        "medical_history": "No cardiovascular history, no family history of sudden death.",
        "ecg_finding": "Normal Sinus Rhythm (66 bpm), normal axis, intact PR and QRS intervals, isoelectric ST segments.",
        "ecg_conf": 0.99,
        "rhythm_type": "NORM",
        "heart_rate": 66,
        "pr_interval": 150,
        "qrs_duration": 86,
        "qtc_interval": 410,
        "ecg_evidence": [
            "Resting rate: 66 bpm (Regular sinus rhythm)",
            "PR: 150 ms | QRS: 86 ms | QTc: 410 ms",
            "Normal QRS morphology and voltage across all 12 leads"
        ],
        "echo_finding": "Preserved left ventricular systolic function with LVEF 65%. Intact diastolic filling and normal chamber dimensions.",
        "echo_conf": 0.98,
        "lvef": 65.0,
        "echo_evidence": [
            "Estimated LVEF: 65.0% (Normal ≥ 55%)",
            "Normal wall thickness and cavity dimensions",
            "Normal tricuspid annular plane systolic excursion (TAPSE 24 mm)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant normal assessment: Intact electrical conduction corroborates preserved systolic performance (LVEF 65%).",
        "suspected_condition": "The patient has a Normal Cardiovascular Baseline with Preserved Left Ventricular Systolic and Diastolic Function.",
        "clinical_priority": "ROUTINE / LOW PRIORITY — Routine Annual Cardiovascular Wellness Screening",
        "priority_level": "routine",
        "differentials": [
            {"condition": "Normal Sinus Rhythm & Intact Mechanical Function", "probability": "High (>99%)", "evidence": "Normal 12-lead ECG, normal LVEF 65%, and normal chamber mechanics", "status": "suspected"}
        ],
        "recommendations": [
            "Reassure patient regarding optimal cardiovascular health.",
            "Continue regular exercise and healthy lifestyle.",
            "Annual health maintenance."
        ]
    },
    # Case 17 - Takotsubo (Stress-Induced) CM
    {
        "case_number": 17,
        "case_id": "case_17",
        "patient_id": "PT-10494",
        "name": "Elena Rostova",
        "age": 66,
        "gender": "Female",
        "category": "critical",
        "primary_diagnosis": "Takotsubo (Stress-Induced / Broken Heart) Cardiomyopathy",
        "symptoms": "Acute retrosternal chest pain and shortness of breath immediately following severe emotional stress, nausea.",
        "medical_history": "Post-menopausal female with osteoporosis and mild hypertension. No prior documented coronary disease.",
        "ecg_finding": "Marked symmetric deep T-wave inversions across precordial leads V2-V6 with prolonged QTc interval (512 ms) mimicking acute LAD ischemia.",
        "ecg_conf": 0.93,
        "rhythm_type": "STTC",
        "heart_rate": 88,
        "pr_interval": 166,
        "qrs_duration": 92,
        "qtc_interval": 512,
        "ecg_evidence": [
            "Deep symmetric T-wave inversions across leads V2-V6 (>5 mm depth)",
            "Marked QT prolongation: QTc 512 ms",
            "Modest ST elevation in leads V2-V3 without reciprocal ST depression",
            "STTC / Takotsubo pattern probability: 93.4%"
        ],
        "echo_finding": "Moderately reduced LVEF 36%. Classic apical ballooning syndrome with apical/mid-ventricular akinesis and hypercontractile basal segments.",
        "echo_conf": 0.95,
        "lvef": 36.0,
        "echo_evidence": [
            "Estimated LVEF: 36.0% (Moderately Reduced)",
            "Circumferential apical and mid-ventricular akinesis ('apical ballooning')",
            "Hyperdynamic basal LV contraction with dynamic intraventricular gradient",
            "Absence of epicardial single-vessel territory distribution"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant stress cardiomyopathy: Precordial deep T-wave inversions and QT prolongation align with circumferential apical ballooning.",
        "suspected_condition": "The patient may have Takotsubo (Stress-Induced / Broken Heart) Cardiomyopathy with Classic Apical Ballooning and Transient Systolic Dysfunction.",
        "clinical_priority": "HIGH PRIORITY — Coronary Exclusion Angiography & Inpatient Supportive Care",
        "priority_level": "high",
        "differentials": [
            {"condition": "Takotsubo (Ampulla) Cardiomyopathy", "probability": "High (>88%)", "evidence": "Emotional trigger, apical ballooning exceeding single coronary territory, and deep T inversions", "status": "suspected"},
            {"condition": "Acute Anterior STEMI (LAD Plaque Rupture)", "probability": "Secondary (25%)", "evidence": "Requires emergent invasive coronary angiography to definitively rule out culprit stenosis", "status": "secondary"}
        ],
        "recommendations": [
            "Urgent coronary angiography to rule out obstructive coronary artery disease and plaque rupture.",
            "Supportive inpatient care; AVOID inotropes (epinephrine/milrinone) which worsen dynamic outflow tract obstruction.",
            "Initiate low-dose Beta-blocker and ACE inhibitor / ARNI for myocardial recovery.",
            "Follow-up echocardiogram in 6-8 weeks to confirm expected complete recovery of LVEF."
        ]
    },
    # Case 18 - Acute Viral Myopericarditis
    {
        "case_number": 18,
        "case_id": "case_18",
        "patient_id": "PT-10490",
        "name": "Chloe Dubois",
        "age": 29,
        "gender": "Female",
        "category": "structural",
        "primary_diagnosis": "Acute Viral Myopericarditis with Epicardial Inflammation",
        "symptoms": "Sharp substernal pleuritic chest pain exacerbated by lying flat and relieved by sitting forward, low-grade fever.",
        "medical_history": "Recent upper respiratory tract viral infection 10 days prior. No prior cardiovascular disease.",
        "ecg_finding": "Diffuse concave-upward ST-segment elevation across leads I, II, aVL, V2-V6 with PR-segment depression in lead II and reciprocal ST depression / PR elevation in aVR.",
        "ecg_conf": 0.95,
        "rhythm_type": "STTC",
        "heart_rate": 86,
        "pr_interval": 142,
        "qrs_duration": 86,
        "qtc_interval": 422,
        "ecg_evidence": [
            "Diffuse upward concave ST elevation in I, II, aVL, V2-V6",
            "PR segment depression in lead II (>0.8 mm)",
            "Reciprocal PR elevation and ST depression in lead aVR",
            "Pericarditis / STTC probability: 95.0%"
        ],
        "echo_finding": "Borderline preserved LVEF 50% with normal chamber dimensions, mild global hypokinesia, and a trace-to-mild circumferential pericardial effusion (6 mm).",
        "echo_conf": 0.92,
        "lvef": 50.0,
        "echo_evidence": [
            "Estimated LVEF: 50.0% (Mild myocardial blunting)",
            "Circumferential pericardial effusion (6 mm posterior, 4 mm anterior)",
            "No right ventricular diastolic collapse or tamponade physiology",
            "Preserved IVC respiratory collapse (>50%)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant myopericardial inflammation: Diffuse concave ST elevation and PR depression align with circumferential effusion and pleuritic pain.",
        "suspected_condition": "The patient may have Acute Viral Myopericarditis with Diffuse Concave ST Elevation, PR Depression, and Pericardial Effusion.",
        "clinical_priority": "HIGH PRIORITY — Urgent Anti-Inflammatory Therapy & Hemodynamic Monitoring",
        "priority_level": "high",
        "differentials": [
            {"condition": "Acute Viral / Idiopathic Myopericarditis", "probability": "High (>92%)", "evidence": "Diffuse concave ST elevation, PR depression, pleuritic pain, and pericardial effusion", "status": "suspected"},
            {"condition": "Acute Coronary Syndrome (STEMI)", "probability": "Secondary (12%)", "evidence": "Absence of regional wall akinesis and absence of reciprocal ST depression", "status": "ruled_out"},
            {"condition": "Cardiac Tamponade", "probability": "Low (<3%)", "evidence": "No right ventricular diastolic collapse or pulsus paradoxus", "status": "ruled_out"}
        ],
        "recommendations": [
            "Initiate high-dose anti-inflammatory therapy: Ibuprofen (600mg TID) plus Colchicine (0.5mg BID for 3 months) for recurrence prevention.",
            "Serial high-sensitivity cardiac troponins to assess extent of myocardial involvement.",
            "Strict restriction from strenuous physical exertion and competitive athletics for 3-6 months.",
            "Cardiac MRI (CMR) with late gadolinium enhancement to assess myocardial inflammation."
        ]
    },
    # Case 19 - End-Stage Non-Ischemic DCM / Biventricular Failure
    {
        "case_number": 19,
        "case_id": "case_19",
        "patient_id": "PT-10505",
        "name": "Kwame Osei",
        "age": 50,
        "gender": "Male",
        "category": "heart_failure",
        "primary_diagnosis": "End-Stage Non-Ischemic Dilated Cardiomyopathy (INTERMACS 3, LVEF 22%)",
        "symptoms": "Severe resting breathlessness (NYHA IV), orthopnea, cardiac cachexia, refractory peripheral edema, fatigue.",
        "medical_history": "Idiopathic dilated cardiomyopathy (8 years), progressive decline despite maximal medical therapy.",
        "ecg_finding": "Sinus tachycardia (104 bpm) with low voltage in limb leads, poor R-wave progression (V1-V4), and intraventricular conduction delay (QRS 138 ms).",
        "ecg_conf": 0.94,
        "rhythm_type": "CD",
        "heart_rate": 104,
        "pr_interval": 190,
        "qrs_duration": 138,
        "qtc_interval": 472,
        "ecg_evidence": [
            "Resting sinus tachycardia (104 bpm) secondary to low stroke volume",
            "Intraventricular conduction delay (IVCD: QRS 138 ms)",
            "Low limb lead voltage and anterior poor R-wave progression"
        ],
        "echo_finding": "Severely reduced LVEF 22%. End-stage biventricular dilation (LVEDD 72 mm, RV dilation), severe global hypokinesia, and functional mitral & tricuspid regurgitation.",
        "echo_conf": 0.96,
        "lvef": 22.0,
        "echo_evidence": [
            "Estimated LVEF: 22.0% (Severely Reduced, End-Stage HFrEF)",
            "Left ventricular internal diameter in diastole: 72 mm (Severe spherical dilation)",
            "Severe right ventricular systolic dysfunction (TAPSE 11 mm)",
            "Severe secondary functional mitral and tricuspid regurgitation"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant advanced heart failure: Electrical conduction delay matches severe biventricular dilation and end-stage systolic collapse (LVEF 22%).",
        "suspected_condition": "The patient may have End-Stage Non-Ischemic Dilated Cardiomyopathy (NYHA IV, LVEF 22%) with Biventricular Failure Requiring Advanced Support Evaluation.",
        "clinical_priority": "CRITICAL / STAT — Inpatient Advanced Heart Failure Center Transfer (LVAD / Transplant Evaluation)",
        "priority_level": "critical",
        "differentials": [
            {"condition": "End-Stage Non-Ischemic Dilated Cardiomyopathy", "probability": "High (>95%)", "evidence": "Severe biventricular dilation (LVEDD 72 mm), LVEF 22%, and refractory NYHA IV symptoms", "status": "suspected"}
        ],
        "recommendations": [
            "Emergent transfer to tertiary Advanced Heart Failure / Mechanical Circulatory Support center.",
            "Right heart catheterization (Swan-Ganz) to evaluate cardiac index, pulmonary capillary wedge pressure, and PVR.",
            "Initiate tailored IV inotropic support (Milrinone / Dobutamine) as a bridge to decision.",
            "Comprehensive evaluation for Left Ventricular Assist Device (LVAD) vs Orthotopic Heart Transplantation."
        ]
    },
    # Case 20 - Multi-Territory Ischemic Cardiomyopathy
    {
        "case_number": 20,
        "case_id": "case_20",
        "patient_id": "PT-10506",
        "name": "Margaret Kim",
        "age": 74,
        "gender": "Female",
        "category": "heart_failure",
        "primary_diagnosis": "Severe Multi-Territory Ischemic Cardiomyopathy (LVEF 25%, NYHA IV)",
        "symptoms": "Progressive exertional dyspnea, paroxysmal nocturnal dyspnea, 3-pillow orthopnea, bilateral leg swelling.",
        "medical_history": "Prior anterior and inferior myocardial infarctions (2015, 2019), type 2 diabetes mellitus, chronic kidney disease.",
        "ecg_finding": "Anterior QS pattern (V1-V3) and inferior pathological Q-waves (II, III, aVF) with wide QRS (132 ms) and fragmented complexes.",
        "ecg_conf": 0.94,
        "rhythm_type": "MI",
        "heart_rate": 82,
        "pr_interval": 182,
        "qrs_duration": 132,
        "qtc_interval": 464,
        "ecg_evidence": [
            "Multi-territory pathological Q-waves in V1-V3 (Anterior) and II, III, aVF (Inferior)",
            "Fragmented QRS complexes indicative of extensive myocardial fibrosis",
            "MI / Multi-Territory Scar probability: 94.6%"
        ],
        "echo_finding": "Severely reduced LVEF 25%. Multi-segmental akinesis involving anterior, apical, and inferior walls with elevated pulmonary artery systolic pressure (PASP 52 mmHg).",
        "echo_conf": 0.95,
        "lvef": 25.0,
        "echo_evidence": [
            "Estimated LVEF: 25.0% (Severely Reduced, HFrEF)",
            "Multi-territory akinesis and wall thinning (<6 mm)",
            "Severe secondary pulmonary hypertension (PASP 52 mmHg)",
            "Restricted LV filling pattern"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant multi-vessel ischemic cardiomyopathy: Multi-territory Q-waves correspond directly to dual-territory anterior and inferior akinesis.",
        "suspected_condition": "The patient may have Severe Multi-Territory Ischemic Cardiomyopathy (LVEF 25%, NYHA IV) with Multi-Vessel Myocardial Scar and Pulmonary Hypertension.",
        "clinical_priority": "HIGH PRIORITY — Inpatient Guideline-Directed Medical Therapy & Myocardial Viability CMR Workup",
        "priority_level": "high",
        "differentials": [
            {"condition": "End-Stage Multi-Territory Ischemic Cardiomyopathy", "probability": "High (>95%)", "evidence": "Dual-territory Q-waves, matched regional akinesis, and severe systolic failure (LVEF 25%)", "status": "suspected"}
        ],
        "recommendations": [
            "Maximize quadruple Guideline-Directed Medical Therapy (GDMT) under close hemodynamic surveillance.",
            "Order Cardiac MRI (CMR) or PET myocardial viability scan to evaluate salvageable hibernating myocardium.",
            "Electrophysiology consultation for primary prevention ICD / CRT-D.",
            "Judicious loop diuretic dosing (Furosemide / Torsemide) to alleviate pulmonary congestion."
        ]
    },
    # Case 21 - Critical Acute Anterior STEMI & CABG (Rajesh Sharma)
    {
        "case_number": 21,
        "case_id": "case_21",
        "patient_id": "PT-10504",
        "name": "Rajesh Sharma",
        "age": 58,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Critical Acute Anterior STEMI & Multi-Vessel CAD Scheduled for Urgent CABG x 3",
        "symptoms": "Acute crushing retrosternal chest pain, diaphoresis, resting dyspnea.",
        "medical_history": "Type 2 diabetes, hypertension, severe multi-vessel CAD.",
        "ecg_finding": "Acute Anterior-Lateral ST-Elevation Myocardial Infarction (STEMI) with ST elevation up to 4.2 mm in V1-V6, I, aVL, and reciprocal inferior depression (II, III, aVF).",
        "ecg_conf": 0.98,
        "rhythm_type": "MI",
        "heart_rate": 96,
        "pr_interval": 164,
        "qrs_duration": 102,
        "qtc_interval": 458,
        "ecg_evidence": [
            "Marked ST elevation in V1-V4 (up to 4.2 mm) and I, aVL",
            "Reciprocal ST depression in leads III and aVF (>2.0 mm)",
            "Developing pathological anterior Q-waves",
            "Transmural Acute Ischemia probability: 98.2%"
        ],
        "echo_finding": "Severely depressed left ventricular systolic pump function (LVEF 28%) with extensive anterior, septal, and apical akinesis, and elevated pulmonary pressure (PASP 46 mmHg).",
        "echo_conf": 0.96,
        "lvef": 28.0,
        "echo_evidence": [
            "Estimated LVEF: 28.0% (Severely Reduced, Acute HFrEF)",
            "Extensive anterior, apical, and septal wall akinesis",
            "PASP: 46 mmHg (Secondary Pulmonary Hypertension)",
            "Elevated LV filling pressures (E/e' 22)"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant acute transmural multi-territory ischemia: Extensive anterior-lateral ST elevation directly matches severe mechanical apical/anterior akinesis (LVEF 28%).",
        "suspected_condition": "Critical Acute Anterior-Lateral STEMI with Severe Systolic Heart Failure (LVEF 28%) and Triple-Vessel CAD Scheduled for Urgent CABG x 3.",
        "clinical_priority": "CRITICAL / STAT — Urgent Surgical Revascularization (Triple CABG)",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Acute Anterior STEMI & Critical Multi-Vessel CAD", "probability": "High (>98%)", "evidence": "ST elevation V1-V6, apical akinesis, LVEF 28%, and triple-vessel disease", "status": "suspected"},
            {"condition": "Acute Cardiogenic Shock Substrate", "probability": "Secondary (15%)", "evidence": "Extensive myocardium at risk with severely compromised systolic ejection", "status": "secondary"}
        ],
        "recommendations": [
            "Immediate transfer to Cardiothoracic Surgical ICU for urgent preoperative preparation.",
            "Urgent Coronary Artery Bypass Grafting (CABG x 3: LIMA-LAD, SVG-OM, SVG-PDA).",
            "Continuous arterial line hemodynamic monitoring, heparinization, and IABP standby."
        ]
    },
    # Case 22 - Critical Calcific AS for TAVR / SAVR (Michael Chen)
    {
        "case_number": 22,
        "case_id": "case_22",
        "patient_id": "PT-10507",
        "name": "Michael Chen",
        "age": 61,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Critical Calcific Aortic Stenosis Scheduled for Urgent SAVR / TAVR",
        "symptoms": "Exertional syncope, angina during minimal walking, profound dyspnea on exertion.",
        "medical_history": "Bicuspid aortic valve, severe calcific stenosis, hypertension.",
        "ecg_finding": "Severe Left Ventricular Hypertrophy with high Sokolow-Lyon voltage (4.6 mV), prominent downsloping ST-T strain in leads I, aVL, V5, V6, and first-degree AV block.",
        "ecg_conf": 0.96,
        "rhythm_type": "HYP",
        "heart_rate": 82,
        "pr_interval": 210,
        "qrs_duration": 108,
        "qtc_interval": 454,
        "ecg_evidence": [
            "Sokolow-Lyon voltage > 4.6 mV",
            "Pronounced lateral repolarization strain pattern",
            "First-degree AV block (PR 210 ms)",
            "Hypertrophy & Severe Strain probability: 96.5%"
        ],
        "echo_finding": "Critical Calcific Aortic Valve Stenosis with AVA 0.58 cm2, peak velocity 4.85 m/s, peak gradient 92 mmHg, mean gradient 56 mmHg, and concentric LVH (LVEF 48%).",
        "echo_conf": 0.98,
        "lvef": 48.0,
        "echo_evidence": [
            "Estimated LVEF: 48.0% (Concentric Remodeling)",
            "Aortic Valve Area: 0.58 cm2 (<0.8 cm2 critical stenosis)",
            "Peak transvalvular velocity: 4.85 m/s",
            "Mean pressure gradient: 56 mmHg (Severe gradient)",
            "Heavily calcified, immobilized aortic leaflets"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant critical valvular stenosis: High transaortic gradient (56 mmHg mean) corresponds directly to severe electrical LVH strain.",
        "suspected_condition": "Critical Calcific Aortic Stenosis (AVA 0.58 cm2, Peak Velocity 4.85 m/s, Mean Gradient 56 mmHg) Scheduled for Urgent Surgical Aortic Valve Replacement (SAVR/TAVR).",
        "clinical_priority": "CRITICAL / STAT — Urgent Surgical Valve Replacement (SAVR/TAVR)",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Critical Symptomatic Calcific Aortic Stenosis", "probability": "High (>98%)", "evidence": "AVA 0.58 cm2, Peak velocity 4.85 m/s, Mean gradient 56 mmHg, and exertional syncope", "status": "suspected"}
        ],
        "recommendations": [
            "Admit for Urgent Surgical Aortic Valve Replacement (SAVR with bioprosthetic valve) or TAVR.",
            "Preoperative coronary angiography and CT TAVR protocol mapping.",
            "Avoid vasodilators and high-dose diuretics to prevent acute hemodynamic collapse."
        ]
    },
    # Case 23 - Acute Ruptured Chordae / Flail Mitral (Sunita Verma)
    {
        "case_number": 23,
        "case_id": "case_23",
        "patient_id": "PT-10508",
        "name": "Sunita Verma",
        "age": 64,
        "gender": "Female",
        "category": "critical",
        "primary_diagnosis": "Critical Acute Severe Mitral Regurgitation with P2 Flail Leaflet for Urgent Repair",
        "symptoms": "Acute flash pulmonary edema, severe resting dyspnea, orthopnea, loud apical holosystolic murmur.",
        "medical_history": "Myxomatous mitral valve disease, developed acute chordal rupture 48 hours prior.",
        "ecg_finding": "Sinus tachycardia (114 bpm) with prominent P-mitrale left atrial overload (130 ms) and secondary repolarization abnormalities.",
        "ecg_conf": 0.94,
        "rhythm_type": "STTC",
        "heart_rate": 114,
        "pr_interval": 162,
        "qrs_duration": 94,
        "qtc_interval": 442,
        "ecg_evidence": [
            "Sinus tachycardia at 114 bpm",
            "P-mitrale in lead II (130 ms)",
            "Inferolateral repolarization strain"
        ],
        "echo_finding": "Critical acute severe Mitral Regurgitation with ruptured primary chordae to P2 scallop, systolic leaflet flail into left atrium, vena contracta 0.88 cm, regurgitant fraction 64%, and elevated PASP 54 mmHg.",
        "echo_conf": 0.97,
        "lvef": 56.0,
        "echo_evidence": [
            "Estimated LVEF: 56.0% (Hyperdynamic)",
            "Ruptured chordae tendineae with severe P2 posterior leaflet flail",
            "Vena contracta: 0.88 cm, Regurgitant fraction: 64%",
            "Elevated pulmonary artery pressure: 54 mmHg"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant acute structural surgical pathology: Severe mitral regurgitation jet correlates with left atrial strain and hemodynamic overload.",
        "suspected_condition": "Critical Acute Severe Mitral Regurgitation Secondary to Ruptured Chordae Tendineae and P2 Flail Leaflet for Urgent Robotic / Minimally Invasive Mitral Valve Repair.",
        "clinical_priority": "CRITICAL / STAT — Urgent Mitral Valve Reconstruction",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Acute Severe Degenerative Mitral Regurgitation (Flail P2 Leaflet)", "probability": "High (>97%)", "evidence": "Torn chordae, leaflet flail, and regurgitant fraction 64% with flash pulmonary edema", "status": "suspected"}
        ],
        "recommendations": [
            "Schedule for Urgent Minimally Invasive / Robotic Mitral Valve Repair (Gore-Tex artificial neochordae reconstruction + Physio II annuloplasty ring).",
            "Urgent Transesophageal Echocardiogram (TEE) guidance.",
            "Judicious IV loop diuretic and afterload reduction."
        ]
    },
    # Case 24 - Critical Triple-Vessel CAD (David Miller)
    {
        "case_number": 24,
        "case_id": "case_24",
        "patient_id": "PT-10509",
        "name": "David Miller",
        "age": 69,
        "gender": "Male",
        "category": "critical",
        "primary_diagnosis": "Critical Left Main & Triple-Vessel CAD with Global Subendocardial Ischemia",
        "symptoms": "Resting angina, diaphoresis, exertional chest pain on minimal effort, dyspnea.",
        "medical_history": "Type 2 diabetes mellitus, peripheral artery disease, severe CAD, 40 pack-year smoking.",
        "ecg_finding": "Widespread horizontal ST-segment depression in leads I, II, aVF, V3-V6 with reciprocal marked ST elevation in lead aVR (>1.8 mm), indicating Left Main / Multi-Vessel subendocardial ischemia.",
        "ecg_conf": 0.96,
        "rhythm_type": "MI",
        "heart_rate": 90,
        "pr_interval": 172,
        "qrs_duration": 98,
        "qtc_interval": 456,
        "ecg_evidence": [
            "ST elevation in lead aVR: 1.8 mm (>1.0 mm diagnostic of Left Main / proximal LAD)",
            "Diffuse ST depression across 8 leads (I, II, aVF, V3-V6)",
            "Inverted T-waves in lateral leads"
        ],
        "echo_finding": "Moderately reduced left ventricular systolic function (LVEF 38%) with extensive basal-inferior, lateral, and posterior wall hypokinesis, and elevated filling pressures.",
        "echo_conf": 0.94,
        "lvef": 38.0,
        "echo_evidence": [
            "Estimated LVEF: 38.0% (Moderately Reduced)",
            "Basal-inferior, posterior, and lateral wall hypokinesis",
            "Preserved apical contractility"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant Left Main / Multi-vessel ischemic pattern: ST elevation in aVR matches diffuse multi-territory wall motion hypokinesis.",
        "suspected_condition": "Critical Left Main & Triple-Vessel Coronary Artery Disease with Global Subendocardial Ischemia (LVEF 38%) Scheduled for Urgent Coronary Artery Bypass Grafting (CABG x 3).",
        "clinical_priority": "CRITICAL / STAT — Emergent Cardiac Catheterization & Inpatient CABG Evaluation",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Critical Left Main / Severe Triple-Vessel CAD", "probability": "High (>97%)", "evidence": "Diffuse ST depression across 8 leads with aVR ST elevation and matched global subendocardial hypokinesia", "status": "suspected"}
        ],
        "recommendations": [
            "Urgent inpatient Coronary Artery Bypass Grafting (CABG x 3: LIMA to LAD, SVG to OM, SVG to PDA).",
            "Continuous telemetry, heparin infusion, and IABP hemodynamic standby.",
            "Dual antiplatelet therapy and high-intensity statin (Atorvastatin 80mg)."
        ]
    },
    # Case 25 - Drug-Refractory HOCM for Septal Myectomy (Anita Patel)
    {
        "case_number": 25,
        "case_id": "case_25",
        "patient_id": "PT-10510",
        "name": "Anita Patel",
        "age": 52,
        "gender": "Female",
        "category": "critical",
        "primary_diagnosis": "Critical Drug-Refractory HOCM Scheduled for Surgical Septal Myectomy",
        "symptoms": "Recurrent exertional presyncope, NYHA Class III-IV dyspnea despite maximal beta-blocker therapy, angina.",
        "medical_history": "Known obstructive HCM, refractory to maximal tolerated Metoprolol and Disopyramide.",
        "ecg_finding": "Marked voltage LVH with giant precordial voltages and deep dagger-like septal Q-waves in lateral leads I, aVL, V5, V6.",
        "ecg_conf": 0.95,
        "rhythm_type": "HYP",
        "heart_rate": 72,
        "pr_interval": 158,
        "qrs_duration": 104,
        "qtc_interval": 478,
        "ecg_evidence": [
            "Deep dagger Q-waves in lateral leads",
            "Precordial voltage sum > 5.2 mV",
            "Giant positive T-waves V2-V4",
            "Severe HOCM probability: 97.4%"
        ],
        "echo_finding": "Severe asymmetric septal hypertrophy (IVS thickness 24.5 mm) with severe dynamic Left Ventricular Outflow Tract obstruction (resting gradient 88 mmHg, Valsalva gradient 120 mmHg), SAM, and hyperdynamic LVEF (70%).",
        "echo_conf": 0.97,
        "lvef": 70.0,
        "echo_evidence": [
            "Estimated LVEF: 70.0% (Hyperdynamic)",
            "Interventricular septal thickness: 24.5 mm (Severe hypertrophy)",
            "Resting LVOT peak gradient: 88 mmHg (>50 mmHg surgical indication)",
            "Severe Systolic Anterior Motion (SAM) with septal contact"
        ],
        "fusion_status": "agreement",
        "fusion_summary": "Concordant severe obstructive HOCM: Septal dagger Q-waves align with 24.5 mm asymmetric hypertrophy and 88 mmHg peak gradient.",
        "suspected_condition": "Critical Drug-Refractory Hypertrophic Obstructive Cardiomyopathy (IVS 24.5 mm, Peak LVOT Gradient 88 mmHg, Recurrent Syncope) Scheduled for Surgical Transaortic Morrow Septal Myectomy.",
        "clinical_priority": "CRITICAL / STAT — Surgical Transaortic Morrow Septal Myectomy",
        "priority_level": "critical",
        "differentials": [
            {"condition": "Drug-Refractory Severe Obstructive HCM", "probability": "High (>97%)", "evidence": "IVS 24.5 mm, resting gradient 88 mmHg, giant T-wave inversions, and refractory NYHA III-IV symptoms", "status": "suspected"}
        ],
        "recommendations": [
            "Schedule for Surgical Transaortic Morrow Septal Myectomy with concomitant subvalvular mitral apparatus resection.",
            "Intraoperative TEE to confirm elimination of LVOT gradient and SAM.",
            "Pre-operative 3D cardiac MRI for myectomy resection planning."
        ]
    }
]

def find_clinical_case(patient_id: Optional[str] = None, patient_name: Optional[str] = None, text_query: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Helper to locate exact clinical case by ID, name, or content keywords."""
    query = f"{patient_id or ''} {patient_name or ''} {text_query or ''}".lower()
    
    # 1. Direct Patient ID match
    for c in CLINICAL_CASES_25:
        if c["patient_id"].lower() in query:
            return c
            
    # 2. Case number match (e.g. case_01, case_2, case05)
    for i, c in enumerate(CLINICAL_CASES_25, 1):
        pad = f"{i:02d}"
        if f"case_{pad}" in query or f"case_{i}" in query or f"case{pad}" in query or f"case{i}" in query:
            return c

    # 3. Patient Name match
    for c in CLINICAL_CASES_25:
        name_parts = c["name"].lower().split()
        if any(part in query for part in name_parts if len(part) > 3):
            return c
            
    # 4. Keyword diagnosis match
    if any(k in query for k in ["stemi", "anterior mi", "infarction", "q-wave", "v1-v4"]):
        return CLINICAL_CASES_25[1] # Case 2
    if any(k in query for k in ["inferolateral", "rca", "lcx"]):
        return CLINICAL_CASES_25[2] # Case 3
    if any(k in query for k in ["lvh", "concentric", "sokolow"]):
        return CLINICAL_CASES_25[3] # Case 4
    if any(k in query for k in ["aneurysm", "dyskinesis"]):
        return CLINICAL_CASES_25[4] # Case 5
    if any(k in query for k in ["afib", "atrial fibrillation", "rvr", "irregular"]):
        return CLINICAL_CASES_25[6] # Case 7
    if any(k in query for k in ["vt", "ventricular tachycardia", "165 bpm", "wide complex"]):
        return CLINICAL_CASES_25[7] # Case 8
    if any(k in query for k in ["av block", "complete block", "3rd degree", "38 bpm"]):
        return CLINICAL_CASES_25[8] # Case 9
    if any(k in query for k in ["lbbb", "dilated", "dcm", "28%"]):
        return CLINICAL_CASES_25[9] # Case 10
    if any(k in query for k in ["hocm", "asymmetric septal", "ivs 22", "sam"]):
        return CLINICAL_CASES_25[11] # Case 12
    if any(k in query for k in ["amyloidosis", "amyloid", "apical sparing"]):
        return CLINICAL_CASES_25[12] # Case 13
    if any(k in query for k in ["aortic stenosis", "calcific", "vmax 4"]):
        return CLINICAL_CASES_25[13] # Case 14
    if any(k in query for k in ["mitral", "flail", "p2", "regurgitation"]):
        return CLINICAL_CASES_25[14] # Case 15
    if any(k in query for k in ["takotsubo", "ballooning", "broken heart"]):
        return CLINICAL_CASES_25[16] # Case 17
    if any(k in query for k in ["myopericarditis", "pericarditis", "pleuritic"]):
        return CLINICAL_CASES_25[17] # Case 18
    if any(k in query for k in ["left main", "triple-vessel", "avr"]):
        return CLINICAL_CASES_25[23] # Case 24

    # Default fallback: Case 1 Normal
    return CLINICAL_CASES_25[0]
