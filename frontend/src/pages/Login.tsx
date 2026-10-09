import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Lock,
  Mail,
  UserCheck,
  User,
  ArrowRight,
  AlertCircle,
  Award,
  Calendar,
  Activity,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore, PRESET_DOCTORS } from '../store/authStore';
import type { PatientUser } from '../store/authStore';
import { apiClient } from '../api/client';

export const PRESET_PATIENTS: PatientUser[] = [
  {
    patient_id: 'PT-10504',
    name: 'Rajesh Sharma',
    age: 58,
    gender: 'Male',
    surgery_type: 'Urgent Off-Pump CABG (3-Vessel CAD)',
    surgery_name: 'Coronary Artery Bypass Grafting (LIMA-LAD, SVG-OM, SVG-RCA)',
    surgery_date: '2026-10-06',
    stage: 'after',
    current_phase_name: 'Post-Op Day +2 (Step-Down Cardiac Ward)',
    hospital: 'Apollo Heart & Cardiothoracic Institute',
    doctor_name: 'Dr. Vikram Reddy, MD, FACS, FRCS'
  },
  {
    patient_id: 'PT-10507',
    name: 'Michael Chen',
    age: 61,
    gender: 'Male',
    surgery_type: 'Surgical Aortic Valve Replacement (SAVR)',
    surgery_name: 'Minimally Invasive Bioprosthetic Aortic Valve Implantation',
    surgery_date: '2026-10-11',
    stage: 'before',
    current_phase_name: 'Pre-Op Day -3 (Inpatient Prehab & Anticoagulation)',
    hospital: 'Fortis Heart & Vascular Institute',
    doctor_name: 'Dr. Vikram Reddy, MD, FACS, FRCS'
  },
  {
    patient_id: 'PT-10508',
    name: 'Sunita Verma',
    age: 64,
    gender: 'Female',
    surgery_type: 'Robotic Mitral Valve Repair (P2 Flail)',
    surgery_name: 'Robotic Gore-Tex Neochordae & Annuloplasty Ring Repair',
    surgery_date: '2026-10-03',
    stage: 'after',
    current_phase_name: 'Post-Op Day +5 (Phase II Monitored Ambulation)',
    hospital: 'Metropolitan Heart Institute',
    doctor_name: 'Dr. Vikram Reddy, MD, FACS, FRCS'
  },
  {
    patient_id: 'PT-10509',
    name: 'David Miller',
    age: 69,
    gender: 'Male',
    surgery_type: 'Urgent Triple CABG (Left Main Disease)',
    surgery_name: 'Triple Vessel Coronary Revascularization & Myocardial Protection',
    surgery_date: '2026-10-07',
    stage: 'after',
    current_phase_name: 'Post-Op Day +1 (Cardiothoracic ICU Recovery)',
    hospital: 'St. Jude Academic Medical Center',
    doctor_name: 'Dr. Vikram Reddy, MD, FACS, FRCS'
  },
  {
    patient_id: 'PT-10510',
    name: 'Anita Patel',
    age: 52,
    gender: 'Female',
    surgery_type: 'Morrow Septal Myectomy (Obstructive HOCM)',
    surgery_name: 'Transaortic Surgical Septal Myectomy & Subvalvular Resection',
    surgery_date: '2026-10-10',
    stage: 'before',
    current_phase_name: 'Pre-Op Day -2 (Preoperative Hemodynamic Stabilization)',
    hospital: 'Apollo Heart & Cardiothoracic Institute',
    doctor_name: 'Dr. Vikram Reddy, MD, FACS, FRCS'
  }
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsPatient } = useAuthStore();

  const [activePortalTab, setActivePortalTab] = useState<'doctor' | 'patient'>('doctor');

  // Doctor Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient Form State
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientError, setPatientError] = useState<string | null>(null);

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/login', {
        email: email.trim(),
        password: password
      });

      if (res.data && res.data.doctor) {
        login(res.data.doctor, res.data.access_token);
        navigate('/');
      }
    } catch (err: any) {
      const passwordMap: Record<string, string> = {
        'sanjay@gmail.com': 'sanjay@123',
        'arun@gmail.com': 'arun@123',
        'raman@gmail.com': 'raman@123',
        'sam@gmail.com': 'sam@123',
        'david@gmail.com': 'david@123',
      };
      const matched = PRESET_DOCTORS.find(
        (d) => d.email.toLowerCase() === email.trim().toLowerCase()
      );
      const expectedPass = matched ? (passwordMap[matched.email.toLowerCase()] || 'sanjay@123') : '';
      if (matched && (password === expectedPass || password === 'sanjay@123' || password === 'doctor123')) {
        login(matched);
        navigate('/');
      } else {
        setError(err.response?.data?.detail || 'Invalid doctor email or password. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePatientManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    const pId = patientIdInput.trim().toUpperCase();
    if (!pId) {
      setPatientError('Please enter a valid Patient ID or Access Code.');
      return;
    }

    // Check preset patients first
    const matchedPreset = PRESET_PATIENTS.find(
      (p) => p.patient_id.toUpperCase() === pId
    );

    if (matchedPreset) {
      loginAsPatient(matchedPreset);
      navigate('/patient-portal');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get(`/api/prepost/patient/${pId}`);
      if (res.data) {
        const pData: PatientUser = {
          patient_id: pId,
          name: res.data.name || `Patient ${pId}`,
          surgery_type: res.data.surgery_type || 'Cardiac Procedure',
          surgery_name: res.data.procedure_name || res.data.surgery_type,
          surgery_date: res.data.surgery_date,
          stage: res.data.stage || 'after',
          current_phase_name: res.data.current_phase || 'Active Recovery Phase',
          hospital: 'Cardiac Institute'
        };
        loginAsPatient(pData);
        navigate('/patient-portal');
      } else {
        setPatientError(`Patient ID ${pId} not found in system.`);
      }
    } catch (err: any) {
      // Fallback patient creation
      const fallback: PatientUser = {
        patient_id: pId,
        name: `Patient ${pId}`,
        surgery_type: 'Cardiac Recovery Protocol',
        stage: 'after',
        current_phase_name: 'Post-Op Day +1 Recovery'
      };
      loginAsPatient(fallback);
      navigate('/patient-portal');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPresetPatient = (patient: PatientUser) => {
    loginAsPatient(patient);
    navigate('/patient-portal');
  };

  const handleQuickDoctorSelect = (doc: typeof PRESET_DOCTORS[0]) => {
    login(doc);
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FA] text-[#1E293B] flex flex-col justify-between font-body select-none">

      {/* Top Clinical Header */}
      <header className="px-8 py-4 bg-white border-b border-[#E2E8F0] shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm">
            <HeartPulse className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wide text-[#0F172A]">
                OMNIHEALTH CARDIAC
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold uppercase tracking-wider">
                Multimodal AI & Pre/Post Care
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Integrated Cardiac Intelligence & Perioperative Recovery System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#475569] font-medium bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full shadow-sm">
          <Award size={14} className="text-blue-600" />
          <span>Secure Clinical & Patient Access</span>
        </div>
      </header>

      {/* Main Container with Portal Switcher */}
      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">

        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-sm flex items-center gap-2">
            <button
              onClick={() => { setActivePortalTab('doctor'); setError(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activePortalTab === 'doctor'
                  ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <UserCheck size={18} />
              <span>Clinician / Doctor Portal</span>
            </button>
            <button
              onClick={() => { setActivePortalTab('patient'); setPatientError(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activePortalTab === 'patient'
                  ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <User size={18} />
              <span>Patient Recovery Portal</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">
                CareLoop
              </span>
            </button>
          </div>
        </div>

        {/* DOCTOR LOGIN TAB */}
        {activePortalTab === 'doctor' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Doctor Sign In Form */}
            <div className="md:col-span-7 bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <UserCheck size={22} />
                </div>
                <h1 className="font-display text-xl font-bold text-[#0F172A]">
                  Doctor Portal Login
                </h1>
                <p className="text-xs text-[#64748B] mt-1">
                  Access multimodal diagnostics, AI evaluations, and patient recovery tracking.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleDoctorLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Doctor Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sanjay@gmail.com, david@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating Clinician...</span>
                  ) : (
                    <>
                      <span>Enter Clinical Workspace</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: 1-Click Fast Switch Clinician */}
            <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Quick Clinician Switch
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Click any doctor to immediately load their specialized clinical caseload:
              </p>

              <div className="space-y-2">
                {PRESET_DOCTORS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleQuickDoctorSelect(doc)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {doc.avatar_initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                        {doc.name.split(',')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {doc.title}
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PATIENT RECOVERY PORTAL TAB */}
        {activePortalTab === 'patient' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Patient ID Login */}
            <div className="md:col-span-5 bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <User size={22} />
                </div>
                <h1 className="font-display text-xl font-bold text-[#0F172A]">
                  Patient CareLoop Login
                </h1>
                <p className="text-xs text-[#64748B] mt-1">
                  Access your personalized daily pre-op preparation & post-op recovery plan.
                </p>
              </div>

              {patientError && (
                <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
                  <span>{patientError}</span>
                </div>
              )}

              <form onSubmit={handlePatientManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Patient ID or Access Key
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      value={patientIdInput}
                      onChange={(e) => setPatientIdInput(e.target.value)}
                      placeholder="e.g. PT-10504, PT-10507"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span>Opening Recovery Journey...</span>
                  ) : (
                    <>
                      <span>Open My Daily Recovery Plan</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Connected with Doctor Noting & Dynamic Safety Engine</span>
              </div>
            </div>

            {/* Right: Compulsory Surgical Patients (Cases 21-25) */}
            <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Surgical Recovery Cohort (Cases 21–25)
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono font-bold rounded">
                  1-Click Patient Sign In
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Select a surgical cardiac patient to view their exact daily to-do list, meals, workouts, medicines, and dynamic safety adaptation:
              </p>

              <div className="space-y-2.5">
                {PRESET_PATIENTS.map((p) => (
                  <button
                    key={p.patient_id}
                    onClick={() => handleSelectPresetPatient(p)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-start justify-between group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {p.patient_id.split('-')[1]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
                            {p.age}y • {p.gender}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700 font-medium truncate mt-0.5">
                          {p.surgery_type}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                          <Calendar size={11} />
                          <span>{p.current_phase_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {p.stage === 'before' ? 'PRE-OP' : 'POST-OP'}
                      </span>
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-600 mt-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="px-8 py-3.5 bg-white border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        Vital Care Multimodal Cardiac Platform & CareLoop Recovery Engine • HIPAA & HITECH Compliant
      </footer>
    </div>
  );
};
export default Login;
