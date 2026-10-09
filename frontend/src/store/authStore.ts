import { create } from 'zustand';
import type { Doctor } from '../types/auth';

// 5 default pre-configured doctors for instant access
export const PRESET_DOCTORS: Doctor[] = [
  {
    id: "DOC-001",
    name: "Dr. Sanjay Kumar, MBBS, MD, DM, FACC",
    title: "Chief Interventional Cardiologist",
    email: "sanjay@gmail.com",
    specialization: "Interventional Cardiology & Complex Coronary Angioplasty",
    department: "Department of Interventional Cardiology",
    hospital: "Metropolitan Heart Institute",
    avatar_initials: "SK",
    license_number: "MCI-TN-984210",
    role: "Chief Cardiologist",
    active_cases: 5
  },
  {
    id: "DOC-002",
    name: "Dr. Arun Mohan, MBBS, MD, DM, FHRS",
    title: "Director of Cardiac Electrophysiology",
    email: "arun@gmail.com",
    specialization: "Cardiac Electrophysiology, Arrhythmia Mapping & Ablation",
    department: "Heart Rhythm & Electrophysiology Center",
    hospital: "Apollo Heart Institute",
    avatar_initials: "AM",
    license_number: "MCI-TN-872419",
    role: "Lead Electrophysiologist",
    active_cases: 5
  },
  {
    id: "DOC-003",
    name: "Dr. Raman Sundaram, MBBS, MD, DNB, FASE",
    title: "Head of Advanced Cardiac Imaging",
    email: "raman@gmail.com",
    specialization: "3D Echocardiography, Strain Imaging & Structural Echo",
    department: "Cardiovascular Imaging Laboratory",
    hospital: "Fortis Heart & Vascular Institute",
    avatar_initials: "RS",
    license_number: "MCI-DL-652391",
    role: "Senior Imaging Specialist",
    active_cases: 5
  },
  {
    id: "DOC-004",
    name: "Dr. Samuel Davies, MD, PhD, FACC",
    title: "Senior Consultant in Heart Failure & Transplant",
    email: "sam@gmail.com",
    specialization: "Advanced Heart Failure (HFrEF/HFpEF), LVAD & Transplantation",
    department: "Heart Failure Intensive Care Unit",
    hospital: "St. Jude Academic Medical Center",
    avatar_initials: "SD",
    license_number: "GMC-UK-710492",
    role: "Heart Failure Specialist",
    active_cases: 5
  },
  {
    id: "DOC-005",
    name: "Dr. Vikram Reddy, MD, FACS, FRCS (CTh)",
    title: "Chief of Cardiothoracic & Structural Surgery",
    email: "david@gmail.com",
    specialization: "CABG, Robotic Valve Repair, Morrow Septal Myectomy & Surgical Recovery",
    department: "Division of Cardiothoracic & Structural Surgery",
    hospital: "Apollo Heart & Cardiothoracic Institute",
    avatar_initials: "VR",
    license_number: "MED-NY-529183",
    role: "Cardiothoracic Surgeon",
    active_cases: 5
  }
];

export interface PatientUser {
  patient_id: string;
  name: string;
  age?: number;
  gender?: string;
  surgery_type?: string;
  surgery_name?: string;
  surgery_date?: string;
  stage?: 'before' | 'surgery' | 'after' | 'recovered';
  current_phase_name?: string;
  hospital?: string;
  surgeon?: string;
  doctor_name?: string;
}

export interface AuthState {
  currentDoctor: Doctor | null;
  currentPatient: PatientUser | null;
  role: 'doctor' | 'patient';
  token: string | null;
  isAuthenticated: boolean;
  login: (doctor: Doctor, token?: string) => void;
  loginAsPatient: (patient: PatientUser, token?: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'omnihealth_auth_session';

const getInitialState = (): { doctor: Doctor | null; patient: PatientUser | null; role: 'doctor' | 'patient'; token: string | null } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'patient' && parsed.patient) {
        return { doctor: null, patient: parsed.patient, role: 'patient', token: parsed.token || 'demo-patient-token' };
      }
      if (parsed.doctor) {
        return { doctor: parsed.doctor, patient: null, role: 'doctor', token: parsed.token || 'demo-doc-token' };
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved auth session', e);
  }
  return { doctor: PRESET_DOCTORS[0], patient: null, role: 'doctor', token: 'omnihealth_session_default' };
};

const initial = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  currentDoctor: initial.doctor,
  currentPatient: initial.patient,
  role: initial.role,
  token: initial.token,
  isAuthenticated: !!(initial.doctor || initial.patient),
  login: (doctor: Doctor, token = 'omnihealth_session_active') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ doctor, role: 'doctor', token }));
    set({ currentDoctor: doctor, currentPatient: null, role: 'doctor', token, isAuthenticated: true });
  },
  loginAsPatient: (patient: PatientUser, token = 'omnihealth_patient_active') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ patient, role: 'patient', token }));
    set({ currentDoctor: null, currentPatient: patient, role: 'patient', token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ currentDoctor: null, currentPatient: null, role: 'doctor', token: null, isAuthenticated: false });
  },
}));
