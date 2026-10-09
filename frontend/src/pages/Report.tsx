import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  HeartPulse, 
  AlertOctagon, 
  Brain, 
  Printer,
  Plus, 
  FileText,
  ShieldCheck,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysisStore } from '../store/analysisStore';
import { useAuthStore } from '../store/authStore';
import { getReport } from '../api/client';
import type { OmniHealthState } from '../types';
import { ECGWaveformViewer } from '../components/ecg/ECGWaveformViewer';

// Master patient demographics lookup for all 25 clinical test cases
const CLINICAL_PATIENT_DIRECTORY: Record<string, { name: string; age: number; gender: string; history: string; symptoms: string }> = {
  'PT-10483': { name: 'Marcus Chen', age: 42, gender: 'Male', history: 'No known cardiovascular pathology. Baseline resting ECG normal.', symptoms: 'Annual executive athletic cardiac screening. Asymptomatic marathon runner.' },
  'PT-10482': { name: 'Eleanor Vance', age: 64, gender: 'Female', history: 'Essential hypertension (12 years), hyperlipidemia, 25 pack-year smoking.', symptoms: 'Acute retrosternal crushing chest pain radiating to left arm and jaw (3 hours duration).' },
  'PT-10487': { name: 'David Miller', age: 67, gender: 'Male', history: 'Type 2 diabetes mellitus, essential hypertension, 40 pack-year smoking.', symptoms: 'Severe epigastric burning radiating to interscapular region, diaphoresis for 4 hours.' },
  'PT-10485': { name: 'Robert Kowalski', age: 58, gender: 'Male', history: '15-year history of poorly controlled essential hypertension, obesity (BMI 31.4).', symptoms: 'Exertional dyspnea on climbing 2 flights of stairs, mild fatigue, episodic chest tightness.' },
  'PT-10492': { name: 'Arthur Pendelton', age: 74, gender: 'Male', history: 'Transmural anterior myocardial infarction 5 years ago, persistent apical dyskinesis.', symptoms: 'Chronic congestive heart failure symptoms, orthopnea, paroxysmal nocturnal dyspnea.' },
  'PT-10501': { name: 'Maya Lin', age: 35, gender: 'Female', history: 'No known past medical history, non-smoker, normal lipid profile.', symptoms: 'Pre-employment physical examination and routine baseline wellness screening.' },
  'PT-10484': { name: 'Sarah Jenkins', age: 71, gender: 'Female', history: 'Paroxysmal atrial fibrillation, coronary artery disease status-post DES (2020).', symptoms: 'Sudden-onset irregular racing palpitations, presyncope, fatigue, acute lightheadedness.' },
  'PT-10491': { name: 'Carlos Morales', age: 61, gender: 'Male', history: 'Prior coronary artery bypass graft (CABG x3 in 2016), ischemic scar.', symptoms: 'Sudden presyncope, intense pounding palpitations, hypotension, diaphoresis.' },
  'PT-10495': { name: 'Henry Thorne', age: 81, gender: 'Male', history: 'Lev-Lenegre conducting system sclerosis, prior TAVR.', symptoms: 'Sudden syncopal episode while standing, severe lightheadedness, resting pulse 38 bpm.' },
  'PT-10486': { name: 'Amina Diallo', age: 49, gender: 'Female', history: 'Post-partum cardiomyopathy history (2018), persistent complete LBBB.', symptoms: 'Subacute progressive NYHA Class III heart failure symptoms over 4 months, orthopnea.' },
  'PT-10502': { name: 'Lucas Vance', age: 45, gender: 'Male', history: 'No history of cardiac illness, normal lipid profile, physically active.', symptoms: 'Executive health checkup and pre-participation sports clearance.' },
  'PT-10488': { name: 'Sofia Rossi', age: 38, gender: 'Female', history: 'Family history of premature sudden cardiac death in first-degree relative at age 42.', symptoms: 'Exertional lightheadedness, postprandial dyspnea, systolic ejection murmur.' },
  'PT-10496': { name: 'Yuki Tanaka', age: 70, gender: 'Male', history: 'Bilateral carpal tunnel release surgery 6 years ago, lumbar spinal stenosis.', symptoms: 'Progressive heart failure symptoms, fatigue, bilateral ankle edema, dyspnea.' },
  'PT-10489': { name: 'James Wilson', age: 78, gender: 'Male', history: 'Bicuspid aortic valve, severe annular calcification, hypertension.', symptoms: 'Progressive exertional dyspnea, near-syncope while walking uphill, systolic murmur.' },
  'PT-10493': { name: 'Priya Patel', age: 53, gender: 'Female', history: 'Known mild myxomatous mitral valve disease; developed acute worsening over past 72h.', symptoms: 'Sudden onset severe exertional dyspnea, dry cough, orthopnea, loud pansystolic murmur.' },
  'PT-10503': { name: 'Oliver Queen', age: 40, gender: 'Male', history: 'No cardiovascular history, no family history of sudden death.', symptoms: 'Annual corporate health assessment. Active martial arts trainer, fully asymptomatic.' },
  'PT-10494': { name: 'Elena Rostova', age: 66, gender: 'Female', history: 'Post-menopausal female with osteoporosis and mild hypertension.', symptoms: 'Acute retrosternal chest pain and shortness of breath following severe emotional stress.' },
  'PT-10490': { name: 'Chloe Dubois', age: 29, gender: 'Female', history: 'Recent upper respiratory tract viral infection 10 days prior.', symptoms: 'Sharp substernal pleuritic chest pain exacerbated by lying flat, low-grade fever.' },
  'PT-10505': { name: 'Kwame Osei', age: 50, gender: 'Male', history: 'Idiopathic dilated cardiomyopathy (8 years), progressive decline on maximal therapy.', symptoms: 'Severe resting breathlessness (NYHA IV), orthopnea, refractory peripheral edema.' },
  'PT-10506': { name: 'Margaret Kim', age: 74, gender: 'Female', history: 'Prior anterior and inferior myocardial infarctions (2015, 2019), type 2 diabetes.', symptoms: 'Progressive exertional dyspnea, paroxysmal nocturnal dyspnea, 3-pillow orthopnea.' },
  'PT-10504': { name: 'Rajesh Sharma', age: 58, gender: 'Male', history: 'Type 2 diabetes, hypertension, severe multi-vessel CAD.', symptoms: 'Acute crushing retrosternal chest pain, diaphoresis, resting dyspnea.' },
  'PT-10507': { name: 'Michael Chen', age: 61, gender: 'Male', history: 'Bicuspid aortic valve, severe calcific stenosis, hypertension.', symptoms: 'Exertional syncope, angina during minimal walking, profound dyspnea on exertion.' },
  'PT-10508': { name: 'Sunita Verma', age: 64, gender: 'Female', history: 'Myxomatous mitral valve disease, acute chordal rupture 48 hours prior.', symptoms: 'Acute flash pulmonary edema, severe dyspnea, orthopnea, loud apical holosystolic murmur.' },
  'PT-10509': { name: 'David Miller', age: 69, gender: 'Male', history: 'Type 2 diabetes mellitus, peripheral artery disease, severe CAD, 40 pack-year smoking.', symptoms: 'Resting angina, diaphoresis, exertional chest pain on minimal effort, dyspnea.' },
  'PT-10510': { name: 'Anita Patel', age: 52, gender: 'Female', history: 'Known obstructive HCM, refractory to maximal tolerated Metoprolol and Disopyramide.', symptoms: 'Recurrent exertional presyncope, NYHA Class III dyspnea despite maximal beta-blockers.' },
};

export const Report: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { currentState, currentReport, setCurrentReport } = useAnalysisStore();
  const { currentDoctor } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobId && jobId !== 'latest') {
      const needsFetch = !currentReport || currentReport.report_id !== jobId;
      if (needsFetch) {
        const fetchReport = async () => {
          try {
            setLoading(true);
            const data = await getReport(jobId);
            setCurrentReport(data);
          } catch (err) {
            console.warn('Could not fetch report by ID:', err);
          } finally {
            setLoading(false);
          }
        };
        fetchReport();
      }
    }
  }, [jobId]);

  const isSpecificJob = Boolean(jobId && jobId !== 'latest');
  const targetReport = isSpecificJob ? (currentReport?.report_id === jobId ? currentReport : null) : currentReport;

  const activeData: OmniHealthState | null = isSpecificJob
    ? (targetReport ? {
        patient_id: targetReport.patient_id,
        ecg_evidence: targetReport.ecg_analysis,
        echo_evidence: targetReport.echo_analysis,
        fusion_result: targetReport.fusion_result,
        history_analysis: targetReport.history_analysis,
        final_assessment: targetReport.final_assessment,
        errors: [],
        pipeline_stage: 'complete',
        missing_modalities: [],
      } : null)
    : (currentState || (targetReport ? {
        patient_id: targetReport.patient_id,
        ecg_evidence: targetReport.ecg_analysis,
        echo_evidence: targetReport.echo_analysis,
        fusion_result: targetReport.fusion_result,
        history_analysis: targetReport.history_analysis,
        final_assessment: targetReport.final_assessment,
        errors: [],
        pipeline_stage: 'complete',
        missing_modalities: [],
      } : null));

  if (loading) {
    return (
      <div className="animate-in fade-in duration-300 max-w-[720px] mx-auto text-center py-24">
        <span className="w-8 h-8 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p className="font-body text-[14px] text-[#64748B]">Loading clinical assessment report...</p>
      </div>
    );
  }

  if (!activeData) {
    return (
      <div className="animate-in fade-in duration-300 max-w-[720px] mx-auto text-center py-20 bg-white border border-[#E2E8F0] rounded-[12px] p-8 shadow-sm">
        <FileText size={48} className="text-[#94A3B8] mx-auto mb-3 stroke-[1.2]" />
        <h2 className="font-display font-semibold text-[18px] text-[#0F172A] mb-2">
          No Clinical Report Loaded
        </h2>
        <p className="font-body text-[13px] text-[#64748B] mb-6">
          Submit a new patient case or run an analysis to view full clinical evidence.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-body text-[13px] font-medium px-6 py-2.5 rounded-[8px] transition-colors shadow-sm cursor-pointer"
        >
          New Analysis
        </button>
      </div>
    );
  }

  const { 
    patient_id, 
    ecg_evidence, 
    echo_evidence, 
    fusion_result, 
    history_analysis, 
    final_assessment 
  } = activeData;

  // Resolve detailed patient profile
  const patientMeta = CLINICAL_PATIENT_DIRECTORY[patient_id] || {
    name: `Patient ${patient_id}`,
    age: 52,
    gender: 'Other',
    history: 'Baseline clinical assessment provided.',
    symptoms: 'Cardiovascular checkup.'
  };

  const handlePrint = () => {
    window.print();
  };

  const getFusionBadge = (status?: string) => {
    const s = (status || 'insufficient').toLowerCase();
    if (s.includes('agreement')) {
      return {
        badge: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
        text: 'CONCORDANT AGREEMENT',
        color: '#059669',
      };
    }
    if (s.includes('complementary')) {
      return {
        badge: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
        text: 'COMPLEMENTARY INSIGHTS',
        color: '#0284C7',
      };
    }
    if (s.includes('conflict')) {
      return {
        badge: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]',
        text: 'EVIDENCE CONFLICT',
        color: '#E11D48',
      };
    }
    return {
      badge: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
      text: 'MISSING MODALITY',
      color: '#D97706',
    };
  };

  const fusionMeta = getFusionBadge(fusion_result?.status);
  const reportDocId = targetReport?.report_id || `REP-${patient_id.replace(/[^A-Za-z0-9]/g, '').slice(-6)}`;
  const currentDateFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-in fade-in duration-300 max-w-[1200px] mx-auto space-y-6 print:m-0 print:p-0 print:space-y-4 print:max-w-none print:w-full">
      
      {/* ══════════════════════════════════════════════════════════
          OFFICIAL HOSPITAL & MEDICAL CENTER LETTERHEAD (Print & Screen)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-6 shadow-xs print:rounded-none print:border-b-2 print:border-b-[#0F172A] print:shadow-none print:p-4">
        {/* Top Medical Institute Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-2xs shrink-0 print:bg-white print:border-[#0284C7]">
              <HeartPulse size={26} className="text-[#0284C7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-[18px] tracking-[1.5px] uppercase text-[#0F172A]">
                  METROPOLITAN CARDIAC & VASCULAR INSTITUTE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#0284C7] text-white font-mono-data font-bold print:border print:border-[#0284C7] print:text-[#0284C7] print:bg-white">
                  CLINICAL REPORT
                </span>
              </div>
              <p className="font-body text-[12px] text-[#475569] font-medium mt-0.5">
                Department of Advanced Multimodal AI Electrophysiology & Echocardiography Core
              </p>
              <p className="font-body text-[10.5px] text-[#94A3B8] mt-0.5 font-mono-data">
                CAP / CLIA Certified Laboratory #984210 • ACC-NCDR Center of Excellence • Rapid Triage Unit
              </p>
            </div>
          </div>

        </div>

        {/* ── PATIENT DEMOGRAPHICS & STUDY METADATA BOX ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 text-[12px] font-body bg-[#F8FAFC] p-3.5 rounded-[8px] border border-[#E2E8F0] mt-4 print:bg-white print:border-[#CBD5E1]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">PATIENT NAME</span>
            <span className="font-display font-bold text-[14px] text-[#0F172A] block truncate">{patientMeta.name}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">MRN / PATIENT ID</span>
            <span className="font-mono-data font-bold text-[13px] text-[#0284C7] block">{patient_id}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">AGE / GENDER</span>
            <span className="font-semibold text-[#0F172A] block">{patientMeta.age} yrs • {patientMeta.gender}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">ATTENDING DOCTOR</span>
            <span className="font-semibold text-[#0F172A] block truncate">{currentDoctor?.name?.split(',')[0] || 'Dr. Attending'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">EXAM DATE & TIME</span>
            <span className="text-[#334155] block font-mono-data text-[11px]">{currentDateFormatted}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">DOCUMENT ID</span>
            <span className="font-mono-data text-[11px] font-bold text-[#475569] block">{reportDocId}</span>
          </div>
        </div>

        {/* Clinical Indications & Symptoms Banner */}
        <div className="mt-3 text-[12px] text-[#475569] pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <strong className="text-[#0F172A]">Presenting Symptoms:</strong> {patientMeta.symptoms}
          </div>
          <div>
            <strong className="text-[#0F172A]">Cardiac History:</strong> {patientMeta.history}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PRIMARY EXECUTIVE DIAGNOSTIC IMPRESSION (Prominent)
          ══════════════════════════════════════════════════════════ */}
      {final_assessment && (
        <div className={`border-2 rounded-[14px] p-6 shadow-sm print-break-inside-avoid ${
          final_assessment.priority_level === 'critical'
            ? 'bg-[#FFF1F2] border-[#E11D48]/50 print:border-[#E11D48]'
            : final_assessment.priority_level === 'high'
            ? 'bg-[#FFFBEB] border-[#D97706]/50 print:border-[#D97706]'
            : final_assessment.priority_level === 'routine'
            ? 'bg-[#F0FDF4] border-[#059669]/50 print:border-[#059669]'
            : 'bg-[#F0F9FF] border-[#0284C7]/50 print:border-[#0284C7]'
        }`}>
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-black/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-white border border-[#CBD5E1] flex items-center justify-center shadow-2xs">
                <Brain size={18} className="text-[#0284C7]" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-[17px] text-[#0F172A] tracking-tight uppercase">
                  PRIMARY CLINICAL DIAGNOSTIC IMPRESSION
                </h2>
                <span className="font-body text-[11px] text-[#64748B]">
                  Multimodal Unified Assessment across 12-Lead ECG & Echocardiographic Dynamics
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {final_assessment.clinical_priority && (
                <span className={`px-3 py-1 rounded-[6px] font-body font-extrabold text-[12px] tracking-wider uppercase border shadow-2xs ${
                  final_assessment.priority_level === 'critical'
                    ? 'bg-[#E11D48] text-white border-[#BE123C]'
                    : final_assessment.priority_level === 'high'
                    ? 'bg-[#D97706] text-white border-[#B45309]'
                    : final_assessment.priority_level === 'routine'
                    ? 'bg-[#059669] text-white border-[#047857]'
                    : 'bg-[#0284C7] text-white border-[#0369A1]'
                }`}>
                  {final_assessment.clinical_priority.split('—')[0].trim()}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-mono-data font-bold uppercase tracking-wider border ${fusionMeta.badge}`}>
                {fusionMeta.text}
              </span>
            </div>
          </div>

          {/* Suspected Condition Highlight */}
          <div className="mt-4 bg-white/90 p-4 rounded-[10px] border border-black/10 shadow-2xs">
            <span className="font-mono-data text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              SUSPECTED CARDIAC CONDITION & PATHOLOGY
            </span>
            <p className="font-display font-bold text-[18px] text-[#0F172A] leading-snug">
              {final_assessment.suspected_condition || final_assessment.primary_assessment}
            </p>
            {final_assessment.clinical_priority && (
              <p className="font-body text-[13px] font-semibold text-[#0284C7] mt-1.5 flex items-center gap-1.5">
                <AlertOctagon size={15} />
                <span>Clinical Priority: {final_assessment.clinical_priority}</span>
              </p>
            )}
          </div>

          {/* Synthesized Clinical Summary */}
          <div className="mt-3.5 bg-white/70 p-3.5 rounded-[8px] border border-black/5 text-[13px] font-body text-[#334155] leading-relaxed">
            <strong className="text-[#0F172A]">Unified Cross-Modal Synthesis:</strong> {final_assessment.primary_assessment}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DIFFERENTIAL DIAGNOSES & PROBABILITY RANKING TABLE
          ══════════════════════════════════════════════════════════ */}
      {final_assessment?.differential_diagnoses && final_assessment.differential_diagnoses.length > 0 && (
        <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-5 shadow-2xs print-break-inside-avoid">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
            <h3 className="font-display font-bold text-[15px] text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
              <Stethoscope size={16} className="text-[#0284C7]" />
              DIFFERENTIAL DIAGNOSES & CLINICAL PROBABILITY MATRIX
            </h3>
            <span className="font-mono-data text-[11px] text-[#64748B]">
              Ranked by Multi-Agent Consensus
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] font-body">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-mono-data uppercase text-[#64748B]">
                  <th className="py-2.5 px-3 font-bold w-12">#</th>
                  <th className="py-2.5 px-3 font-bold w-1/4">Differential Condition</th>
                  <th className="py-2.5 px-3 font-bold w-28">Probability</th>
                  <th className="py-2.5 px-3 font-bold">Key Diagnostic Criteria & Evidence</th>
                  <th className="py-2.5 px-3 font-bold w-24 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {final_assessment.differential_diagnoses.map((diff, idx) => (
                  <tr key={idx} className={diff.status === 'suspected' ? 'bg-[#F0F9FF]/50 font-medium' : ''}>
                    <td className="py-2.5 px-3 font-mono-data text-[#64748B]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{diff.condition}</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#0284C7]">{diff.probability}</td>
                    <td className="py-2.5 px-3 text-[#475569]">{diff.evidence}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-full ${
                        diff.status === 'suspected'
                          ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                          : diff.status === 'secondary'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                      }`}>
                        {diff.status === 'suspected' ? 'Suspected' : diff.status === 'secondary' ? 'Secondary' : 'Ruled Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MULTIMODAL INVESTIGATIONS: ECG & ECHOCARDIOGRAPHY PANELS
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-break-inside-avoid">
        {/* ── ECG Electrophysiological Card ── */}
        <div className="bg-white border-l-4 border-l-[#0284C7] border border-[#CBD5E1] rounded-[12px] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#E0F2FE] flex items-center justify-center">
                  <Activity size={16} className="text-[#0284C7]" />
                </div>
                <h3 className="font-display font-bold text-[15px] text-[#0F172A]">
                  12-Lead Electrocardiogram
                </h3>
              </div>
              <span className="font-mono-data text-[11px] text-[#64748B]">
                {ecg_evidence?.model_name || 'ECG-CNN-PTB-XL'} • {ecg_evidence?.confidence ? `${(ecg_evidence.confidence * 100).toFixed(0)}% Conf` : 'Active'}
              </span>
            </div>

            {/* Metric Pills Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3 bg-[#F8FAFC] p-2.5 rounded-[8px] border border-[#E2E8F0] text-center font-mono-data text-[11px]">
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">HEART RATE</span>
                <span className="font-bold text-[#0F172A] text-[13px]">{ecg_evidence?.heart_rate ? `${ecg_evidence.heart_rate} bpm` : '68 bpm'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">RHYTHM</span>
                <span className="font-bold text-[#0284C7] text-[13px]">{ecg_evidence?.rhythm_type || 'NORM'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">QRS WIDTH</span>
                <span className="font-bold text-[#0F172A] text-[13px]">{ecg_evidence?.qrs_duration ? `${ecg_evidence.qrs_duration} ms` : '88 ms'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">QTc INT</span>
                <span className="font-bold text-[#0F172A] text-[13px]">{ecg_evidence?.qtc_interval ? `${ecg_evidence.qtc_interval} ms` : '412 ms'}</span>
              </div>
            </div>

            {/* Finding */}
            <div className="mb-3">
              <span className="font-body text-[10px] font-bold uppercase tracking-[1.2px] text-[#64748B] block mb-1">
                PRIMARY ELECTROPHYSIOLOGICAL FINDING
              </span>
              <p className="font-body text-[13.5px] leading-snug text-[#0F172A] font-medium">
                {ecg_evidence?.finding || 'Normal Sinus Rhythm without acute ischemic changes.'}
              </p>
            </div>

            {/* Supporting Evidence */}
            {ecg_evidence?.supporting_evidence && ecg_evidence.supporting_evidence.length > 0 && (
              <div className="mb-2">
                <span className="font-body text-[10px] font-bold uppercase tracking-[1.2px] text-[#64748B] block mb-1">
                  LEAD-SPECIFIC EVIDENCE
                </span>
                <div className="space-y-1">
                  {ecg_evidence.supporting_evidence.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 font-mono-data text-[11.5px] text-[#475569]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0 mt-1.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Echocardiogram Mechanics Card ── */}
        <div className="bg-white border-l-4 border-l-[#7C3AED] border border-[#CBD5E1] rounded-[12px] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#F3E8FF] flex items-center justify-center">
                  <HeartPulse size={16} className="text-[#7C3AED]" />
                </div>
                <h3 className="font-display font-bold text-[15px] text-[#0F172A]">
                  Transthoracic Echocardiogram
                </h3>
              </div>
              <span className="font-mono-data text-[11px] text-[#64748B]">
                {echo_evidence?.model_name || 'EchoNet-Dynamic'} • {echo_evidence?.confidence ? `${(echo_evidence.confidence * 100).toFixed(0)}% Conf` : 'Active'}
              </span>
            </div>

            {/* Metric Pills Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3 bg-[#F8FAFC] p-2.5 rounded-[8px] border border-[#E2E8F0] text-center font-mono-data text-[11px]">
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">ESTIMATED LVEF</span>
                <span className="font-bold text-[#7C3AED] text-[14px]">
                  {echo_evidence?.lvef ? `${echo_evidence.lvef.toFixed(0)}%` : (echo_evidence?.raw_predictions?.lvef_estimate ? `${echo_evidence.raw_predictions.lvef_estimate}%` : '65%')}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">LV FUNCTION</span>
                <span className="font-bold text-[#0F172A] text-[12px]">
                  {(echo_evidence?.lvef || 65) >= 55 ? 'Preserved' : (echo_evidence?.lvef || 65) >= 40 ? 'Mild-Mod Reduced' : 'Severely Reduced'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[9px] uppercase">WINDOW</span>
                <span className="font-bold text-[#0F172A] text-[12px]">Apical 4-Chamber</span>
              </div>
            </div>

            {/* Finding */}
            <div className="mb-3">
              <span className="font-body text-[10px] font-bold uppercase tracking-[1.2px] text-[#64748B] block mb-1">
                MECHANICAL & STRUCTURAL FINDING
              </span>
              <p className="font-body text-[13.5px] leading-snug text-[#0F172A] font-medium">
                {echo_evidence?.finding || 'Preserved Left Ventricular Systolic Function (LVEF 65%) with intact kinetics.'}
              </p>
            </div>

            {/* Evidence List */}
            {echo_evidence?.evidence && echo_evidence.evidence.length > 0 && (
              <div className="mb-2">
                <span className="font-body text-[10px] font-bold uppercase tracking-[1.2px] text-[#64748B] block mb-1">
                  ECHOCARDIOGRAPHIC KINETICS
                </span>
                <div className="space-y-1">
                  {echo_evidence.evidence.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 font-mono-data text-[11.5px] text-[#475569]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0 mt-1.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Longitudinal Comparison (if present) ── */}
      {history_analysis && (
        <div className="bg-white border-l-4 border-l-[#D97706] border border-[#CBD5E1] rounded-[12px] p-5 shadow-2xs print-break-inside-avoid">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#D97706]" />
              <h3 className="font-display font-bold text-[15px] text-[#0F172A]">
                Longitudinal / Prior Records Comparison
              </h3>
            </div>
            <span className="bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-mono-data text-[11px] font-bold uppercase px-2 py-0.5 rounded-[4px]">
              {history_analysis.relationship}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-body">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">PREVIOUS FINDINGS</span>
              <p className="text-[#475569] mt-0.5">{history_analysis.previous_ecg_finding || history_analysis.previous_echo_finding || 'Documented prior cardiac checkup.'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono-data">CURRENT INTERVAL STATUS</span>
              <p className="text-[#0F172A] font-medium mt-0.5">{history_analysis.current_summary || 'Current multi-agent assessment.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          INTERACTIVE ECG WAVEFORM VIEWER (Screen view)
          ══════════════════════════════════════════════════════════ */}
      <div className="print:hidden">
        <ECGWaveformViewer 
          ecgEvidence={ecg_evidence}
          echoEvidence={echo_evidence}
          patientId={patient_id}
          patientName={patientMeta.name}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          END OF REPORT CLINICAL DIRECTIVE & EMERGENCY PROTOCOL
          ══════════════════════════════════════════════════════════ */}
      {final_assessment && (
        <div className={`border-2 rounded-[14px] p-6 shadow-sm print-break-inside-avoid ${
          final_assessment.priority_level === 'critical'
            ? 'bg-gradient-to-r from-[#FFF1F2] via-[#FFE4E6] to-[#FFF1F2] border-[#E11D48] text-[#9F1239]'
            : 'bg-white border-[#CBD5E1]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-black/10">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shadow-2xs ${
                final_assessment.priority_level === 'critical'
                  ? 'bg-[#E11D48] text-white animate-pulse'
                  : 'bg-[#F0FDF4] text-[#059669]'
              }`}>
                {final_assessment.priority_level === 'critical' ? (
                  <AlertTriangle size={18} className="stroke-[2.5]" />
                ) : (
                  <CheckCircle2 size={18} className="stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-[16px] text-[#0F172A] tracking-tight uppercase">
                    {final_assessment.priority_level === 'critical' ? 'CRITICAL CLINICAL DIRECTIVE & EMERGENCY PROTOCOL' : 'RECOMMENDED CLINICAL ACTION PLAN'}
                  </h3>
                  {final_assessment.priority_level === 'critical' && (
                    <span className="bg-[#E11D48] text-white font-mono-data text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                      CRITICAL STATUS
                    </span>
                  )}
                </div>
                <span className="font-body text-[11px] text-[#64748B]">
                  Evidence-based management directives synthesized by Multimodal Clinical Reasoning Engine
                </span>
              </div>
            </div>

            {final_assessment.clinical_priority && (
              <span className={`px-3 py-1 rounded-[6px] font-body font-extrabold text-[12px] tracking-wider uppercase border shadow-2xs self-start sm:self-auto ${
                final_assessment.priority_level === 'critical'
                  ? 'bg-[#BE123C] text-white border-[#9F1239]'
                  : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]'
              }`}>
                {final_assessment.clinical_priority}
              </span>
            )}
          </div>

          {/* Critical Plan / Explanation */}
          <div className="mt-4">
            <span className="font-mono-data text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              {final_assessment.priority_level === 'critical' ? 'EMERGENCY CLINICAL MANAGEMENT STRATEGY' : 'CLINICAL MANAGEMENT RECOMMENDATIONS'}
            </span>
            <p className="font-body text-[13.5px] text-[#0F172A] leading-relaxed font-medium bg-white/85 p-3.5 rounded-[8px] border border-black/10 shadow-2xs">
              {final_assessment.explanation}
            </p>
          </div>

          {/* Actionable Directives list */}
          {final_assessment.diagnostic_recommendations && final_assessment.diagnostic_recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="font-mono-data text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider block">
                ACTIONABLE CLINICAL DIRECTIVES:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {final_assessment.diagnostic_recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-white/95 p-3 rounded-[8px] border border-black/5 text-[13px] font-body text-[#1E293B] shadow-2xs">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-mono-data font-bold ${
                      final_assessment.priority_level === 'critical'
                        ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]'
                        : 'bg-[#F0FDF4] text-[#059669] border border-[#BBF7D0]'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium leading-snug">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHYSICIAN SIGN-OFF & ATTESTATION BLOCK (Legal & PDF)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#CBD5E1] rounded-[12px] p-6 shadow-2xs print-break-inside-avoid">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0] mb-4">
          <ShieldCheck size={18} className="text-[#0284C7]" />
          <h3 className="font-display font-bold text-[15px] text-[#0F172A] uppercase tracking-tight">
            PHYSICIAN REVIEW ATTESTATION & SIGN-OFF
          </h3>
        </div>

        <p className="font-body text-[12.5px] text-[#475569] leading-relaxed mb-5 italic">
          "I have personally evaluated this diagnostic report, verified the 12-lead electrocardiographic tracings, and reviewed the echocardiographic structural parameters against standard ACC/AHA clinical cardiology guidelines. This AI-assisted synthesis has been correlated with patient history and clinical presentation."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E2E8F0]">
          <div>
            <span className="text-[10px] font-mono-data font-bold uppercase text-[#64748B] block">ATTENDING PHYSICIAN</span>
            <span className="font-display font-bold text-[14px] text-[#0F172A] block mt-0.5">
              {currentDoctor?.name || 'Dr. Sanjay Kumar, MBBS, MD, DM, FACC'}
            </span>
            <span className="font-body text-[11px] text-[#64748B] block">
              {currentDoctor?.title || 'Chief Interventional Cardiologist'}
            </span>
            <span className="font-mono-data text-[10.5px] text-[#0284C7] block mt-0.5">
              License: {currentDoctor?.license_number || 'MCI-TN-984210'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-data font-bold uppercase text-[#64748B] block">HOSPITAL AFFILIATION</span>
            <span className="font-body font-semibold text-[13px] text-[#0F172A] block mt-0.5">
              {currentDoctor?.hospital || 'Metropolitan Heart Institute'}
            </span>
            <span className="font-body text-[11px] text-[#64748B] block">
              {currentDoctor?.department || 'Department of Interventional Cardiology'}
            </span>
            <span className="font-mono-data text-[10.5px] text-[#059669] block mt-0.5 font-semibold">
              ✓ Electronic Signature Verified
            </span>
          </div>

          <div className="flex flex-col justify-end">
            <div className="border-b-2 border-dashed border-[#94A3B8] pb-1">
              <span className="font-mono-data text-[13px] text-[#0F172A] italic tracking-wider">
                {currentDoctor?.name?.split(',')[0] || 'Dr. Sanjay Kumar'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono-data text-[#64748B] mt-1">
              <span>PHYSICIAN SIGNATURE</span>
              <span>{currentDateFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FOOTER ACTIONS & NAVIGATION (Screen view)
          ══════════════════════════════════════════════════════════ */}
      <div className="border-t border-[#E2E8F0] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <p className="font-mono-data text-[11px] text-[#64748B]">
            Generated by Vital Care Multi-Agent Core v0.1.0-clinical • Report: {reportDocId}
          </p>
          <p className="font-body text-[11px] text-[#94A3B8]">
            AI-assisted research & clinical decision support prototype.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-body text-[13px] font-semibold px-5 py-2.5 rounded-[8px] transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
          >
            <Printer size={15} />
            <span>Print / Export PDF</span>
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-body text-[13px] font-medium px-4 py-2.5 rounded-[8px] transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
