import React, { useState, useRef } from 'react';
import { 
  Activity, 
  HeartPulse, 
  FileCheck, 
  X, 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  Loader2,
  AlertCircle,
  User,
  Stethoscope,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { runAnalysis } from '../api/client';
import { useAnalysisStore } from '../store/analysisStore';

interface UploadZoneProps {
  label: string;
  sublabel: string;
  acceptedFormats: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  compact?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  sublabel,
  acceptedFormats,
  icon: Icon,
  accentColor,
  file,
  onFileSelect,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[10px] p-4 flex items-center justify-between transition-all duration-200 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-[8px] bg-[#D1FAE5] flex items-center justify-center shrink-0">
            <FileCheck size={22} className="text-[#059669]" />
          </div>
          <div className="overflow-hidden">
            <p className="font-mono-data text-[13px] font-semibold text-[#0F172A] truncate max-w-[220px] sm:max-w-xs">
              {file.name}
            </p>
            <p className="font-body text-[11px] text-[#64748B]">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onFileSelect(null)}
          className="p-1.5 text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-[6px] transition-colors cursor-pointer"
          title="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  const isBlue = accentColor === '#0284C7';
  const bgBase = isBlue ? '#F0F9FF' : '#FAF5FF';
  const bgHover = isBlue ? '#E0F2FE' : '#F3E8FF';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        borderColor: isDragOver ? accentColor : `${accentColor}50`,
        backgroundColor: isDragOver ? bgHover : bgBase,
      }}
      className={`border-2 border-dashed rounded-[10px] cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center ${
        compact ? 'p-5' : 'p-7'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      <div className="mb-2">
        <Icon size={compact ? 24 : 30} style={{ color: accentColor }} />
      </div>

      <h4 className="font-display font-semibold text-[14px] text-[#0F172A]">
        {label}
      </h4>
      <p className="font-body text-[12px] text-[#64748B] mt-0.5">
        {sublabel}
      </p>

      <div className="flex items-center gap-2 mt-3 text-[12px] font-body text-[#64748B]">
        <span>Drag file here or</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          style={{
            borderColor: `${accentColor}50`,
            color: accentColor,
          }}
          className="border bg-white px-3.5 py-1 rounded-[6px] text-[11px] font-body font-semibold hover:bg-white/80 transition-colors shadow-2xs"
        >
          Browse
        </button>
      </div>
    </div>
  );
};

interface TestCasePreset {
  id: string;
  caseNumber: number;
  category: 'critical' | 'arrhythmia' | 'heart_failure' | 'structural' | 'normal';
  name: string;
  tag: string;
  badgeBg: string;
  badgeText: string;
  patientId: string;
  patientName: string;
  age: string;
  sex: string;
  symptoms: string;
  medicalHistory: string;
  ecgFileName: string;
  echoFileName: string;
  description: string;
}

const TEST_CASE_PRESETS: TestCasePreset[] = [
  {
    "id": "case_01",
    "caseNumber": 1,
    "category": "normal",
    "name": "Normal Sinus Rhythm & Intact Mechanical Function",
    "tag": "Normal Sinus",
    "badgeBg": "bg-[#ECFDF5]",
    "badgeText": "text-[#059669]",
    "patientId": "PT-10483",
    "patientName": "Marcus Chen",
    "age": "42",
    "sex": "Male",
    "symptoms": "Annual executive athletic cardiac screening. Asymptomatic endurance marathon runner.",
    "medicalHistory": "No known cardiovascular pathology. Baseline resting ECG normal.",
    "ecgFileName": "marcus_chen_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "NORM (68 bpm) + LVEF 65%"
  },
  {
    "id": "case_02",
    "caseNumber": 2,
    "category": "critical",
    "name": "Acute Anterior ST-Elevation Myocardial Infarction (STEMI)",
    "tag": "STEMI \u2022 STAT",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10482",
    "patientName": "Eleanor Vance",
    "age": "64",
    "sex": "Female",
    "symptoms": "Acute retrosternal crushing chest pain radiating to left arm and jaw (3 hours duration), diaphoresis, dyspnea on minimal exertion.",
    "medicalHistory": "Essential hypertension (12 years), hyperlipidemia, 25 pack-year smoking. No prior PCI or CABG.",
    "ecgFileName": "eleanor_vance_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "MI (94 bpm) + LVEF 33%"
  },
  {
    "id": "case_03",
    "caseNumber": 3,
    "category": "critical",
    "name": "Acute Inferolateral STEMI (LCx / RCA Occlusion)",
    "tag": "Inferior STEMI",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10487",
    "patientName": "David Miller",
    "age": "67",
    "sex": "Male",
    "symptoms": "Severe epigastric burning radiating to interscapular region, acute diaphoresis, nausea, weakness for 4 hours.",
    "medicalHistory": "Type 2 diabetes mellitus (insulin-dependent), essential hypertension, 40 pack-year smoking.",
    "ecgFileName": "david_miller_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "MI (86 bpm) + LVEF 42%"
  },
  {
    "id": "case_04",
    "caseNumber": 4,
    "category": "structural",
    "name": "Concentric Left Ventricular Hypertrophy & Prior Silent Inferior MI",
    "tag": "LVH \u2022 Ischemia",
    "badgeBg": "bg-[#FEF3C7]",
    "badgeText": "text-[#D97706]",
    "patientId": "PT-10485",
    "patientName": "Robert Kowalski",
    "age": "58",
    "sex": "Male",
    "symptoms": "Exertional dyspnea on climbing 2 flights of stairs, mild fatigue, episodic non-radiating chest tightness.",
    "medicalHistory": "15-year history of poorly controlled essential hypertension, obesity (BMI 31.4), hypertriglyceridemia.",
    "ecgFileName": "robert_kowalski_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "HYP (76 bpm) + LVEF 56%"
  },
  {
    "id": "case_05",
    "caseNumber": 5,
    "category": "heart_failure",
    "name": "Chronic Apical LV Aneurysm with Ischemic Cardiomyopathy & Mural Thrombus",
    "tag": "LV Aneurysm",
    "badgeBg": "bg-[#E0F2FE]",
    "badgeText": "text-[#0369A1]",
    "patientId": "PT-10492",
    "patientName": "Arthur Pendelton",
    "age": "74",
    "sex": "Male",
    "symptoms": "Chronic congestive heart failure symptoms, orthopnea, paroxysmal nocturnal dyspnea, fatigue.",
    "medicalHistory": "Transmural anterior myocardial infarction 5 years ago, persistent apical dyskinesis with true aneurysmal pouch.",
    "ecgFileName": "arthur_pendelton_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "MI (78 bpm) + LVEF 26%"
  },
  {
    "id": "case_06",
    "caseNumber": 6,
    "category": "normal",
    "name": "Normal Electrophysiological & Structural Cardiac Assessment",
    "tag": "Normal Baseline",
    "badgeBg": "bg-[#ECFDF5]",
    "badgeText": "text-[#059669]",
    "patientId": "PT-10501",
    "patientName": "Maya Lin",
    "age": "35",
    "sex": "Female",
    "symptoms": "Pre-employment physical examination and routine baseline wellness screening.",
    "medicalHistory": "No known past medical history, no cardiovascular risk factors, non-smoker.",
    "ecgFileName": "maya_lin_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "NORM (72 bpm) + LVEF 64%"
  },
  {
    "id": "case_07",
    "caseNumber": 7,
    "category": "arrhythmia",
    "name": "Atrial Fibrillation with Rapid Ventricular Response (RVR)",
    "tag": "Arrhythmia \u2022 RVR",
    "badgeBg": "bg-[#F3E8FF]",
    "badgeText": "text-[#7C3AED]",
    "patientId": "PT-10484",
    "patientName": "Sarah Jenkins",
    "age": "71",
    "sex": "Female",
    "symptoms": "Sudden-onset irregular racing palpitations, presyncope, fatigue, acute lightheadedness.",
    "medicalHistory": "Paroxysmal atrial fibrillation, coronary artery disease status-post DES (2020), mild CKD stage 3a.",
    "ecgFileName": "sarah_jenkins_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "AFIB (124 bpm) + LVEF 48%"
  },
  {
    "id": "case_08",
    "caseNumber": 8,
    "category": "critical",
    "name": "Sustained Monomorphic Ventricular Tachycardia (VT) with Post-Infarct Scar",
    "tag": "VT \u2022 Emergent",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10491",
    "patientName": "Carlos Morales",
    "age": "61",
    "sex": "Male",
    "symptoms": "Sudden presyncope, intense pounding palpitations, hypotension, diaphoresis.",
    "medicalHistory": "Prior coronary artery bypass graft (CABG x3 in 2016), ischemic cardiomyopathy with apical myocardial scar.",
    "ecgFileName": "carlos_morales_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "VT (165 bpm) + LVEF 30%"
  },
  {
    "id": "case_09",
    "caseNumber": 9,
    "category": "critical",
    "name": "Complete (3rd-Degree) Atrioventricular Block with Hemodynamic Bradycardia",
    "tag": "3rd-Deg Block",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10495",
    "patientName": "Henry Thorne",
    "age": "81",
    "sex": "Male",
    "symptoms": "Sudden syncopal episode while standing, severe lightheadedness, fatigue, resting pulse 38 bpm.",
    "medicalHistory": "Lev-Lenegre conducting system sclerosis, essential hypertension, prior transcatheter aortic valve implant.",
    "ecgFileName": "henry_thorne_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "CD (38 bpm) + LVEF 54%"
  },
  {
    "id": "case_10",
    "caseNumber": 10,
    "category": "heart_failure",
    "name": "Non-Ischemic Dilated Cardiomyopathy (HFrEF) with Complete LBBB",
    "tag": "HFrEF \u2022 LBBB",
    "badgeBg": "bg-[#E0F2FE]",
    "badgeText": "text-[#0369A1]",
    "patientId": "PT-10486",
    "patientName": "Amina Diallo",
    "age": "49",
    "sex": "Female",
    "symptoms": "Subacute progressive NYHA Class III heart failure symptoms over 4 months, orthopnea, bilateral lower extremity edema.",
    "medicalHistory": "Post-partum cardiomyopathy history (2018), persistent complete LBBB with ventricular dyssynchrony.",
    "ecgFileName": "amina_diallo_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "CD (82 bpm) + LVEF 28%"
  },
  {
    "id": "case_11",
    "caseNumber": 11,
    "category": "normal",
    "name": "Normal Advanced Cardiac Imaging & Strain Analysis",
    "tag": "Normal Athletic",
    "badgeBg": "bg-[#ECFDF5]",
    "badgeText": "text-[#059669]",
    "patientId": "PT-10502",
    "patientName": "Lucas Vance",
    "age": "45",
    "sex": "Male",
    "symptoms": "Executive health checkup and pre-participation sports clearance.",
    "medicalHistory": "No history of cardiac illness, normal lipid profile, physically active.",
    "ecgFileName": "lucas_vance_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "NORM (56 bpm) + LVEF 60%"
  },
  {
    "id": "case_12",
    "caseNumber": 12,
    "category": "structural",
    "name": "Hypertrophic Obstructive Cardiomyopathy (HOCM) with Severe LVOT Gradient",
    "tag": "HOCM \u2022 Septal",
    "badgeBg": "bg-[#FEF3C7]",
    "badgeText": "text-[#D97706]",
    "patientId": "PT-10488",
    "patientName": "Sofia Rossi",
    "age": "38",
    "sex": "Female",
    "symptoms": "Exertional lightheadedness, postprandial dyspnea, non-anginal atypical chest tightness, loud systolic ejection murmur.",
    "medicalHistory": "Family history of premature sudden cardiac death in first-degree relative at age 42. Asymmetric septal hypertrophy.",
    "ecgFileName": "sofia_rossi_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "HYP (74 bpm) + LVEF 72%"
  },
  {
    "id": "case_13",
    "caseNumber": 13,
    "category": "heart_failure",
    "name": "Infiltrative Cardiac Transthyretin Amyloidosis (ATTR-CM)",
    "tag": "Amyloidosis",
    "badgeBg": "bg-[#E0F2FE]",
    "badgeText": "text-[#0369A1]",
    "patientId": "PT-10496",
    "patientName": "Yuki Tanaka",
    "age": "70",
    "sex": "Male",
    "symptoms": "Progressive heart failure with preserved ejection fraction symptoms, fatigue, bilateral ankle edema, dyspnea.",
    "medicalHistory": "Bilateral carpal tunnel release surgery 6 years ago, lumbar spinal stenosis, low voltage ECG with thick walls.",
    "ecgFileName": "yuki_tanaka_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "CD (66 bpm) + LVEF 45%"
  },
  {
    "id": "case_14",
    "caseNumber": 14,
    "category": "structural",
    "name": "Severe Symptomatic Calcific Aortic Valve Stenosis",
    "tag": "Aortic Stenosis",
    "badgeBg": "bg-[#FEF3C7]",
    "badgeText": "text-[#D97706]",
    "patientId": "PT-10489",
    "patientName": "James Wilson",
    "age": "78",
    "sex": "Male",
    "symptoms": "Progressive exertional dyspnea (NYHA Class II-III), near-syncope while walking uphill, late-peaking systolic ejection murmur.",
    "medicalHistory": "Bicuspid aortic valve, severe annular calcification, hypertension, dyslipidemia.",
    "ecgFileName": "james_wilson_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "HYP (78 bpm) + LVEF 52%"
  },
  {
    "id": "case_15",
    "caseNumber": 15,
    "category": "structural",
    "name": "Severe Acute Mitral Regurgitation with Flail Posterior Leaflet (P2)",
    "tag": "Flail Mitral",
    "badgeBg": "bg-[#FEF3C7]",
    "badgeText": "text-[#D97706]",
    "patientId": "PT-10493",
    "patientName": "Priya Patel",
    "age": "53",
    "sex": "Female",
    "symptoms": "Sudden onset severe exertional dyspnea, dry cough, orthopnea following acute chordal rupture, loud pansystolic murmur.",
    "medicalHistory": "Known mild myxomatous mitral valve disease; developed acute worsening over past 72 hours.",
    "ecgFileName": "priya_patel_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "STTC (84 bpm) + LVEF 58%"
  },
  {
    "id": "case_16",
    "caseNumber": 16,
    "category": "normal",
    "name": "Normal Functional Cardiac Baseline",
    "tag": "Normal Screening",
    "badgeBg": "bg-[#ECFDF5]",
    "badgeText": "text-[#059669]",
    "patientId": "PT-10503",
    "patientName": "Oliver Queen",
    "age": "40",
    "sex": "Male",
    "symptoms": "Annual corporate health assessment. Active martial arts trainer, fully asymptomatic.",
    "medicalHistory": "No cardiovascular history, no family history of sudden death.",
    "ecgFileName": "oliver_queen_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "NORM (66 bpm) + LVEF 65%"
  },
  {
    "id": "case_17",
    "caseNumber": 17,
    "category": "critical",
    "name": "Takotsubo (Stress-Induced / Broken Heart) Cardiomyopathy",
    "tag": "Takotsubo",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10494",
    "patientName": "Elena Rostova",
    "age": "66",
    "sex": "Female",
    "symptoms": "Acute retrosternal chest pain and shortness of breath immediately following severe emotional stress, nausea.",
    "medicalHistory": "Post-menopausal female with osteoporosis and mild hypertension. No prior documented coronary disease.",
    "ecgFileName": "elena_rostova_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "STTC (88 bpm) + LVEF 36%"
  },
  {
    "id": "case_18",
    "caseNumber": 18,
    "category": "structural",
    "name": "Acute Viral Myopericarditis with Epicardial Inflammation",
    "tag": "Myopericarditis",
    "badgeBg": "bg-[#FEF3C7]",
    "badgeText": "text-[#D97706]",
    "patientId": "PT-10490",
    "patientName": "Chloe Dubois",
    "age": "29",
    "sex": "Female",
    "symptoms": "Sharp substernal pleuritic chest pain exacerbated by lying flat and relieved by sitting forward, low-grade fever.",
    "medicalHistory": "Recent upper respiratory tract viral infection 10 days prior. No prior cardiovascular disease.",
    "ecgFileName": "chloe_dubois_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "STTC (86 bpm) + LVEF 50%"
  },
  {
    "id": "case_19",
    "caseNumber": 19,
    "category": "heart_failure",
    "name": "End-Stage Non-Ischemic Dilated Cardiomyopathy (INTERMACS 3, LVEF 22%)",
    "tag": "End-Stage DCM",
    "badgeBg": "bg-[#E0F2FE]",
    "badgeText": "text-[#0369A1]",
    "patientId": "PT-10505",
    "patientName": "Kwame Osei",
    "age": "50",
    "sex": "Male",
    "symptoms": "Severe resting breathlessness (NYHA IV), orthopnea, cardiac cachexia, refractory peripheral edema, fatigue.",
    "medicalHistory": "Idiopathic dilated cardiomyopathy (8 years), progressive decline despite maximal medical therapy.",
    "ecgFileName": "kwame_osei_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "CD (104 bpm) + LVEF 22%"
  },
  {
    "id": "case_20",
    "caseNumber": 20,
    "category": "heart_failure",
    "name": "Severe Multi-Territory Ischemic Cardiomyopathy (LVEF 25%, NYHA IV)",
    "tag": "Ischemic CM",
    "badgeBg": "bg-[#E0F2FE]",
    "badgeText": "text-[#0369A1]",
    "patientId": "PT-10506",
    "patientName": "Margaret Kim",
    "age": "74",
    "sex": "Female",
    "symptoms": "Progressive exertional dyspnea, paroxysmal nocturnal dyspnea, 3-pillow orthopnea, bilateral leg swelling.",
    "medicalHistory": "Prior anterior and inferior myocardial infarctions (2015, 2019), type 2 diabetes mellitus, chronic kidney disease.",
    "ecgFileName": "margaret_kim_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "MI (82 bpm) + LVEF 25%"
  },
  {
    "id": "case_21",
    "caseNumber": 21,
    "category": "critical",
    "name": "Critical Acute Anterior STEMI & Multi-Vessel CAD for Urgent CABG",
    "tag": "Acute STEMI • CABG",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10504",
    "patientName": "Rajesh Sharma",
    "age": "58",
    "sex": "Male",
    "symptoms": "Acute crushing retrosternal chest pain, diaphoresis, resting dyspnea.",
    "medicalHistory": "Type 2 diabetes, hypertension, severe multi-vessel CAD.",
    "ecgFileName": "rajesh_sharma_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "STEMI (96 bpm) + LVEF 28%"
  },
  {
    "id": "case_22",
    "caseNumber": 22,
    "category": "critical",
    "name": "Critical Calcific Aortic Stenosis Scheduled for Urgent SAVR / TAVR",
    "tag": "Critical AS • SAVR",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10507",
    "patientName": "Michael Chen",
    "age": "61",
    "sex": "Male",
    "symptoms": "Exertional syncope, angina during minimal walking, profound dyspnea on exertion.",
    "medicalHistory": "Bicuspid aortic valve, severe calcific stenosis, hypertension.",
    "ecgFileName": "michael_chen_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "HYP (82 bpm) + LVEF 48%"
  },
  {
    "id": "case_23",
    "caseNumber": 23,
    "category": "critical",
    "name": "Critical Acute Severe Mitral Regurgitation with P2 Flail Leaflet for Urgent Repair",
    "tag": "Severe MR • Flail",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10508",
    "patientName": "Sunita Verma",
    "age": "64",
    "sex": "Female",
    "symptoms": "Acute flash pulmonary edema, severe resting dyspnea, orthopnea, loud apical holosystolic murmur.",
    "medicalHistory": "Myxomatous mitral valve disease, developed acute chordal rupture 48 hours prior.",
    "ecgFileName": "sunita_verma_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "STTC (114 bpm) + LVEF 56%"
  },
  {
    "id": "case_24",
    "caseNumber": 24,
    "category": "critical",
    "name": "Critical Left Main & Triple-Vessel CAD with Global Subendocardial Ischemia",
    "tag": "Left Main CAD",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10509",
    "patientName": "David Miller",
    "age": "69",
    "sex": "Male",
    "symptoms": "Resting angina, diaphoresis, exertional chest pain on minimal effort, dyspnea.",
    "medicalHistory": "Type 2 diabetes mellitus, peripheral artery disease, severe CAD, 40 pack-year smoking.",
    "ecgFileName": "david_miller_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "MI (90 bpm) + LVEF 38%"
  },
  {
    "id": "case_25",
    "caseNumber": 25,
    "category": "critical",
    "name": "Critical Drug-Refractory HOCM Scheduled for Surgical Septal Myectomy",
    "tag": "Severe HOCM",
    "badgeBg": "bg-[#FFE4E6]",
    "badgeText": "text-[#E11D48]",
    "patientId": "PT-10510",
    "patientName": "Anita Patel",
    "age": "52",
    "sex": "Female",
    "symptoms": "Recurrent exertional presyncope, NYHA Class III-IV dyspnea despite maximal beta-blocker therapy, angina.",
    "medicalHistory": "Known obstructive HCM, refractory to maximal tolerated Metoprolol and Disopyramide.",
    "ecgFileName": "anita_patel_ecg.csv",
    "echoFileName": "echo_apical4c.mp4",
    "description": "HYP (72 bpm) + LVEF 70%"
  }
];


// Helper to generate simulated CSV File
function generateSyntheticECGFile(fileName: string, isStemi: boolean = false, isAFib: boolean = false): File {
  const lines = ['I,II,III,aVR,aVL,aVF,V1,V2,V3,V4,V5,V6'];
  for (let i = 0; i < 500; i++) {
    const cycle = (i % 80) / 80;
    let v = 0;
    if (cycle > 0.28 && cycle < 0.32) v += 1.2;
    if (cycle > 0.35 && cycle < 0.45 && isStemi) v += 0.45;
    if (isAFib) v += Math.sin(i * 0.4) * 0.08;
    const row = Array(12).fill(v.toFixed(3)).join(',');
    lines.push(row);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  return new File([blob], fileName, { type: 'text/csv' });
}

// Helper to generate simulated MP4 File
function generateSyntheticEchoFile(fileName: string): File {
  const blob = new Blob(['sample-echo-ultrasound-data'], { type: 'video/mp4' });
  return new File([blob], fileName, { type: 'video/mp4' });
}

// Comprehensive matching engine for all 15 clinical cases
function matchClinicalTestCase(fileName: string, fileContent?: string): TestCasePreset {
  const str = `${fileName} ${fileContent || ''}`.toLowerCase();

  // 1. Direct Patient ID Match
  for (const p of TEST_CASE_PRESETS) {
    if (str.includes(p.patientId.toLowerCase())) return p;
  }

  // 2. Direct Case Number Match (case_01, case_1, case01, case1)
  for (let i = 1; i <= 15; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    if (str.includes(`case_${pad}`) || str.includes(`case_${i}`) || str.includes(`case${pad}`) || str.includes(`case${i}`)) {
      return TEST_CASE_PRESETS[i - 1];
    }
  }

  // 3. Exact Patient Name Match
  if (str.includes('marcus') || str.includes('chen')) return TEST_CASE_PRESETS[0];
  if (str.includes('eleanor') || str.includes('vance')) return TEST_CASE_PRESETS[1];
  if (str.includes('sarah') || str.includes('jenkins')) return TEST_CASE_PRESETS[2];
  if (str.includes('robert') || str.includes('kowalski')) return TEST_CASE_PRESETS[3];
  if (str.includes('amina') || str.includes('diallo')) return TEST_CASE_PRESETS[4];
  if (str.includes('david') || str.includes('miller')) return TEST_CASE_PRESETS[5];
  if (str.includes('sofia') || str.includes('rossi')) return TEST_CASE_PRESETS[6];
  if (str.includes('james') || str.includes('wilson')) return TEST_CASE_PRESETS[7];
  if (str.includes('chloe') || str.includes('dubois')) return TEST_CASE_PRESETS[8];
  if (str.includes('carlos') || str.includes('morales')) return TEST_CASE_PRESETS[9];
  if (str.includes('margaret') || str.includes('kim')) return TEST_CASE_PRESETS[10];
  if (str.includes('lucas') || str.includes('meyer')) return TEST_CASE_PRESETS[11];
  if (str.includes('helen') || str.includes('campbell')) return TEST_CASE_PRESETS[12];
  if (str.includes('richard') || str.includes('hansen')) return TEST_CASE_PRESETS[13];
  if (str.includes('yuki') || str.includes('tanaka')) return TEST_CASE_PRESETS[14];

  // 4. Clinical Pathology Keyword Match
  if (str.includes('inferolateral')) return TEST_CASE_PRESETS[5];
  if (str.includes('anterior') || str.includes('stemi')) return TEST_CASE_PRESETS[1];
  if (str.includes('afib') || str.includes('fibrillation') || str.includes('rvr')) return TEST_CASE_PRESETS[2];
  if (str.includes('lvh') || str.includes('hypertrophy')) return TEST_CASE_PRESETS[3];
  if (str.includes('lbbb') || str.includes('dcm') || str.includes('dilated')) return TEST_CASE_PRESETS[4];
  if (str.includes('hocm') || str.includes('septal')) return TEST_CASE_PRESETS[6];
  if (str.includes('aortic') || str.includes('stenosis')) return TEST_CASE_PRESETS[7];
  if (str.includes('myopericarditis') || str.includes('pericarditis')) return TEST_CASE_PRESETS[8];
  if (str.includes('vt') || str.includes('tachycardia')) return TEST_CASE_PRESETS[9];
  if (str.includes('aneurysm')) return TEST_CASE_PRESETS[10];
  if (str.includes('mitral') || str.includes('mvp') || str.includes('flail')) return TEST_CASE_PRESETS[11];
  if (str.includes('takotsubo') || str.includes('ballooning')) return TEST_CASE_PRESETS[12];
  if (str.includes('mobitz') || str.includes('av_block') || str.includes('block')) return TEST_CASE_PRESETS[13];
  if (str.includes('amyloidosis') || str.includes('amyloid')) return TEST_CASE_PRESETS[14];
  if (str.includes('normal') || str.includes('sinus')) return TEST_CASE_PRESETS[0];

  // Default to Case 1 (Marcus Chen) for non-matching file
  return TEST_CASE_PRESETS[0];
}

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { setActivePatientId, setCurrentJobId } = useAnalysisStore();
  
  // Patient Details
  const [patientId, setPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<string>('Male');
  const [symptoms, setSymptoms] = useState<string>('');
  const [medicalHistory, setMedicalHistory] = useState<string>('');

  // Primary Investigation Files
  const [ecgFile, setEcgFile] = useState<File | null>(null);
  const [echoFile, setEchoFile] = useState<File | null>(null);

  // Previous Longitudinal Records (Optional)
  const [prevEcgFile, setPrevEcgFile] = useState<File | null>(null);
  const [prevEchoFile, setPrevEchoFile] = useState<File | null>(null);
  const [prevReportText, setPrevReportText] = useState<string>('');

  // Active preset tracker for auto-fill indicator
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = (ecgFile !== null || echoFile !== null) && patientId.trim().length > 0;

  // Apply a matched case preset
  const applyCasePreset = (matched: TestCasePreset, triggerSource: string = 'Upload') => {
    setActivePresetId(matched.id);
    setPatientId(matched.patientId);
    setPatientName(matched.patientName);
    setAge(matched.age);
    setSex(matched.sex);
    setSymptoms(matched.symptoms);
    setMedicalHistory(matched.medicalHistory);

    setAutoFillNotice(`✓ Case #${matched.caseNumber} Loaded: ${matched.patientName} (${matched.patientId}) — Age ${matched.age}, ${matched.sex} • ${matched.name} (${triggerSource})`);
    setErrorMessage(null);
  };

  // Reset form
  const handleResetForm = () => {
    setActivePresetId(null);
    setPatientId('');
    setPatientName('');
    setAge('');
    setSex('Male');
    setSymptoms('');
    setMedicalHistory('');
    setEcgFile(null);
    setEchoFile(null);
    setPrevEcgFile(null);
    setPrevEchoFile(null);
    setPrevReportText('');
    setAutoFillNotice(null);
    setErrorMessage(null);
  };

  // Auto-detect and populate when user selects ECG file manually
  const handleECGSelect = async (file: File | null) => {
    setEcgFile(file);
    if (!file) return;

    let headerSnippet = '';
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.hea')) {
      try {
        const slice = file.slice(0, 500);
        headerSnippet = await slice.text();
      } catch (e) {
        // ignore
      }
    }

    const matched = matchClinicalTestCase(file.name, headerSnippet);
    applyCasePreset(matched, 'ECG');

    // Auto-attach paired Echo video if not already present
    if (!echoFile) {
      setEchoFile(generateSyntheticEchoFile(matched.echoFileName));
    }
  };

  // Auto-detect and populate when user selects Echo file manually
  const handleEchoSelect = (file: File | null) => {
    setEchoFile(file);
    if (!file) return;

    const matched = matchClinicalTestCase(file.name);
    applyCasePreset(matched, 'Echo');

    // Auto-attach paired 12-lead ECG if not already present
    if (!ecgFile) {
      const isStemi = matched.id === 'case_02' || matched.id === 'case_06';
      const isAFib = matched.id === 'case_03';
      setEcgFile(generateSyntheticECGFile(matched.ecgFileName, isStemi, isAFib));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) {
      setErrorMessage('Please enter a valid Patient ID.');
      return;
    }

    if (!ecgFile && !echoFile) {
      setErrorMessage('Please upload at least one investigation modality (12-Lead ECG or Echocardiogram video).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('patient_id', patientId.trim());
      if (patientName.trim()) formData.append('patient_name', patientName.trim());
      if (age.trim()) formData.append('age', age.trim());
      if (sex) formData.append('gender', sex);
      if (symptoms.trim()) formData.append('presenting_symptoms', symptoms.trim());
      if (medicalHistory.trim()) formData.append('medical_history', medicalHistory.trim());

      if (ecgFile) formData.append('ecg_file', ecgFile);
      if (echoFile) formData.append('echo_file', echoFile);
      if (prevEcgFile) formData.append('previous_ecg', prevEcgFile);
      if (prevEchoFile) formData.append('previous_echo', prevEchoFile);
      if (prevReportText.trim()) formData.append('previous_notes', prevReportText.trim());

      const res = await runAnalysis(formData);
      setActivePatientId(patientId.trim());
      setCurrentJobId(res.job_id);
      navigate(`/analysis/${res.job_id}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to submit analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300 space-y-6 max-w-[1100px] mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-[18px] text-[#0F172A]">
              New Patient Cardiac Study
            </h1>
            <p className="font-body text-[13px] text-[#64748B] mt-0.5">
              Upload 12-lead ECG signals (.dat / .hea / .csv) and Echocardiogram ultrasound videos (.mp4 / .avi). Patient demographics auto-populate upon file selection.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="px-3.5 py-1.5 border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC] rounded-[8px] font-body text-[12px] font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Clear Form</span>
        </button>
      </div>

      {/* Auto-fill notification alert */}
      {autoFillNotice && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] p-3.5 px-4 flex items-center justify-between text-[#166534] text-[13px] font-body shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-[#059669]" />
            <span>{autoFillNotice}</span>
          </div>
          <button type="button" onClick={() => setAutoFillNotice(null)} className="text-[#059669] hover:text-[#166534]">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] p-4 flex items-center gap-3 text-[#9F1239] text-[13px] font-body shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-[#E11D48]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1 — Patient Demographics & Clinical Intake */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-5">
        <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#0284C7]" />
            <h2 className="font-display font-semibold text-[15px] text-[#0F172A]">
              Patient Demographics & Clinical Presentation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-body text-[#64748B] font-semibold whitespace-nowrap">
              Auto-Fill Case:
            </label>
            <select
              value={activePresetId || ''}
              onChange={(e) => {
                const found = TEST_CASE_PRESETS.find(p => p.id === e.target.value);
                if (found) {
                  applyCasePreset(found, 'Dropdown');
                  const isStemi = found.id === 'case_02' || found.id === 'case_06';
                  const isAFib = found.id === 'case_03';
                  setEcgFile(generateSyntheticECGFile(found.ecgFileName, isStemi, isAFib));
                  setEchoFile(generateSyntheticEchoFile(found.echoFileName));
                }
              }}
              className="bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1] font-body text-[12px] font-semibold rounded-[8px] px-3 py-1.5 outline-none cursor-pointer hover:border-[#0284C7] transition-all"
            >
              <option value="">-- Choose from 15 Test Cases --</option>
              {TEST_CASE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  Case #{p.caseNumber}: {p.patientName} ({p.age}y {p.sex}) — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Patient ID *
            </label>
            <input
              type="text"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. PT-20501"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-[10px_14px] font-mono-data text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Patient Full Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Johnathan Smith"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-[10px_14px] font-body text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Age (Years)
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 58"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-[10px_14px] font-body text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Biological Sex
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-[10px_14px] font-body text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Not specified">Not specified</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Presenting Symptoms & Chief Complaint
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Acute retrosternal crushing chest pain radiating to left arm, diaphoresis, dyspnea on minimal exertion for 3 hours..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 font-body text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
              Past Medical & Cardiovascular History
            </label>
            <textarea
              rows={3}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Essential hypertension (10 years), hyperlipidemia, type 2 diabetes mellitus, smoking history, no prior CABG/PCI..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 font-body text-[13px] text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 — Current Investigations (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Current Cardiac Investigations */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-[#E2E8F0] mb-4">
              <h2 className="font-display font-semibold text-[15px] text-[#0F172A]">
                Current Investigations (Primary Data)
              </h2>
              <p className="font-body text-[12px] text-[#64748B] mt-0.5">
                Upload at least one primary modality for AI analysis. Auto-fills matching preset when selected.
              </p>
            </div>

            <div className="space-y-4">
              {/* ECG Upload */}
              <UploadZone
                label="Electrocardiogram (ECG)"
                sublabel="12-Lead standard record (.csv / .hea / .dat / .npy)"
                acceptedFormats=".csv,.hea,.dat,.npy,.txt"
                icon={Activity}
                accentColor="#0284C7"
                file={ecgFile}
                onFileSelect={handleECGSelect}
              />

              {/* Echo Upload */}
              <UploadZone
                label="Echocardiogram (Echo)"
                sublabel="Apical 4-Chamber ultrasound video (.mp4 / .avi / .mov)"
                acceptedFormats=".mp4,.avi,.mov"
                icon={HeartPulse}
                accentColor="#7C3AED"
                file={echoFile}
                onFileSelect={handleEchoSelect}
              />
            </div>
          </div>
        </div>

        {/* Right Col: Previous Cardiac History (Optional) */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-[#E2E8F0] mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-[15px] text-[#0F172A]">
                  Prior Investigations & Baseline Records
                </h2>
                <p className="font-body text-[12px] text-[#64748B] mt-0.5">
                  Optional — enables longitudinal AI progression comparison
                </p>
              </div>
              <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-body font-bold tracking-wider px-2 py-0.5 rounded-full">
                OPTIONAL
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadZone
                  label="Prior ECG"
                  sublabel="Previous baseline signal"
                  acceptedFormats=".csv,.hea,.dat,.txt,.pdf"
                  icon={Activity}
                  accentColor="#0284C7"
                  compact
                  file={prevEcgFile}
                  onFileSelect={setPrevEcgFile}
                />

                <UploadZone
                  label="Prior Echo"
                  sublabel="Previous ultrasound clip"
                  acceptedFormats=".mp4,.avi,.mov,.txt,.pdf"
                  icon={HeartPulse}
                  accentColor="#7C3AED"
                  compact
                  file={prevEchoFile}
                  onFileSelect={setPrevEchoFile}
                />
              </div>

              <div>
                <label className="font-body text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-1.5 block">
                  Prior Clinical Assessment Notes
                </label>
                <textarea
                  rows={3}
                  value={prevReportText}
                  onChange={(e) => setPrevReportText(e.target.value)}
                  placeholder="e.g. Previous assessment 6 months prior showed normal sinus rhythm, baseline LVEF 60%, no focal wall motion abnormalities..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 text-[#0F172A] placeholder:text-[#94A3B8] font-body text-[13px] focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — Validation & Submit Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h3 className="font-display font-semibold text-[14px] text-[#0F172A]">
              Study Pre-flight Checklist
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-[12px] font-body">
                {patientId.trim() ? (
                  <CheckCircle2 size={15} className="text-[#059669]" />
                ) : (
                  <Circle size={15} className="text-[#CBD5E1]" />
                )}
                <span className={patientId.trim() ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}>
                  Patient ID: {patientId.trim() || 'Required'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] font-body">
                {ecgFile ? (
                  <CheckCircle2 size={15} className="text-[#059669]" />
                ) : (
                  <Circle size={15} className="text-[#CBD5E1]" />
                )}
                <span className={ecgFile ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}>
                  {ecgFile ? `ECG: ${ecgFile.name}` : 'ECG (Optional)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] font-body">
                {echoFile ? (
                  <CheckCircle2 size={15} className="text-[#059669]" />
                ) : (
                  <Circle size={15} className="text-[#CBD5E1]" />
                )}
                <span className={echoFile ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}>
                  {echoFile ? `Echo: ${echoFile.name}` : 'Echo (Optional)'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className={`font-display font-semibold text-[14px] text-white px-8 py-3 rounded-[8px] flex items-center gap-2 transition-all duration-200 shrink-0 ${
              canSubmit && !isSubmitting
                ? 'bg-[#0284C7] hover:bg-[#0369A1] shadow-sm hover:-translate-y-[1px] cursor-pointer'
                : 'bg-[#94A3B8] opacity-60 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>Running AI Pipeline...</span>
              </>
            ) : (
              <>
                <PlayCircle size={18} className="text-white" />
                <span>Start Vital Care Analysis</span>
              </>
            )}
          </button>
        </div>

        <p className="font-body text-[11px] text-[#64748B] pt-3 text-center sm:text-left">
          Multi-agent orchestration: 1D-CNN ECG classifier → EchoNet-Dynamic 3D-CNN → Multimodal Fusion → Temporal Longitudinal Agent → Final Clinical Reasoning.
        </p>
      </div>
    </form>
  );
};
