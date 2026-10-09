import React, { useEffect, useState } from 'react';
import {
  Activity,
  Layers,
  AlertTriangle,
  Circle,
  FileX,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisStore } from '../store/analysisStore';
import { useAuthStore } from '../store/authStore';
import { listPatients, getPatientReports, deletePatient } from '../api/client';
import type { OmniHealthReport } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentDoctor } = useAuthStore();
  const { setCurrentReport, setCurrentState, recentReports, isBackendConnected } = useAnalysisStore();
  const [reportsList, setReportsList] = useState<OmniHealthReport[]>(recentReports);
  const [loading, setLoading] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ patientId: string; reportId?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        setLoading(true);
        const patients = await listPatients(currentDoctor?.email, currentDoctor?.id);
        const allFetchedReports: OmniHealthReport[] = [];
        for (const p of patients) {
          const reps = await getPatientReports(p.patient_id);
          allFetchedReports.push(...reps);
        }
        if (allFetchedReports.length > 0) {
          allFetchedReports.sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
          setReportsList(allFetchedReports);
        }
      } catch (err) {
        console.warn('Could not fetch historical reports list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentData();
  }, [currentDoctor?.email, currentDoctor?.id]);

  const totalCount = reportsList.length;
  const completeCount = reportsList.filter(
    (r) => r.ecg_analysis && r.echo_analysis
  ).length;
  const conflictCount = reportsList.filter(
    (r) => r.fusion_result?.status?.toLowerCase() === 'conflict'
  ).length;

  const handleViewReport = (report: OmniHealthReport) => {
    setCurrentReport(report);
    setCurrentState({
      patient_id: report.patient_id,
      ecg_evidence: report.ecg_analysis,
      echo_evidence: report.echo_analysis,
      fusion_result: report.fusion_result,
      history_analysis: report.history_analysis,
      final_assessment: report.final_assessment,
      errors: [],
      pipeline_stage: 'complete',
      missing_modalities: [],
    });
    navigate(`/report/${report.report_id}`);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      setIsDeleting(true);
      await deletePatient(patientToDelete.patientId);
      setNotification(`Patient ${patientToDelete.patientId} removed from dashboard.`);
      setReportsList(prev => prev.filter(r => r.patient_id !== patientToDelete.patientId));
      setPatientToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to remove patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    const s = (status || 'insufficient').toLowerCase();
    let badgeStyle = 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
    let label = 'INSUFFICIENT';

    if (s.includes('agreement')) {
      badgeStyle = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      label = 'AGREEMENT';
    } else if (s.includes('complementary')) {
      badgeStyle = 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]';
      label = 'COMPLEMENTARY';
    } else if (s.includes('conflict')) {
      badgeStyle = 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]';
      label = 'CONFLICT';
    } else if (s.includes('missing')) {
      badgeStyle = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      label = 'MISSING';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[10px] font-mono-data font-semibold uppercase tracking-wider border ${badgeStyle}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[10px] p-3.5 px-4 flex items-center justify-between text-[#065F46] text-[13px] font-body shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#059669]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#059669] hover:text-[#065F46]">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────
          TOP ROW — 4 stat cards (grid-cols-4 gap-4)
          ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Total Analyses */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[1.5px] text-[#64748B]">
              TOTAL ANALYSES
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-[#0284C7]/10 flex items-center justify-center">
              <Activity size={18} className="text-[#0284C7]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display font-bold text-[32px] leading-tight text-[#0F172A]">
              {totalCount > 0 ? totalCount : '—'}
            </p>
            <p className="font-body text-[12px] text-[#64748B] mt-1">All time</p>
          </div>
        </div>

        {/* Card 2 — Multimodal Complete */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[1.5px] text-[#64748B]">
              MULTIMODAL COMPLETE
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-[#059669]/10 flex items-center justify-center">
              <Layers size={18} className="text-[#059669]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display font-bold text-[32px] leading-tight text-[#059669]">
              {completeCount > 0 ? completeCount : '—'}
            </p>
            <p className="font-body text-[12px] text-[#64748B] mt-1">ECG + Echo</p>
          </div>
        </div>

        {/* Card 3 — Conflicts Detected */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[1.5px] text-[#64748B]">
              EVIDENCE CONFLICTS
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-[#E11D48]/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-[#E11D48]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display font-bold text-[32px] leading-tight text-[#E11D48]">
              {conflictCount > 0 ? conflictCount : '0'}
            </p>
            <p className="font-body text-[12px] text-[#64748B] mt-1">Requires review</p>
          </div>
        </div>

        {/* Card 4 — System Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[1.5px] text-[#64748B]">
              PIPELINE STATUS
            </span>
            <Circle size={14} className={`text-[#059669] fill-[#059669] ${isBackendConnected ? 'animate-pulse' : 'opacity-40'}`} />
          </div>
          <div className="mt-4">
            <p className="font-display font-bold text-[20px] leading-tight text-[#059669]">
              {isBackendConnected ? 'ONLINE' : 'OFFLINE'}
            </p>
            <p className="font-body text-[12px] text-[#64748B] mt-1">All agents ready</p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────
          MIDDLE ROW — 2 columns (grid-cols-3 gap-4)
          ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (col-span-2): Recent Analyses Card */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h2 className="font-display font-semibold text-[16px] text-[#0F172A]">
                Recent Analyses
              </h2>
              <button
                onClick={() => navigate('/upload')}
                className="text-[#0284C7] hover:text-[#0369A1] text-[13px] font-medium font-body transition-colors flex items-center gap-1"
              >
                <span>New Analysis</span>
                <span>→</span>
              </button>
            </div>

            {/* Table Area */}
            {loading ? (
              <div className="py-14 flex items-center justify-center text-[#64748B] text-[13px] font-body">
                <span className="w-4 h-4 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin mr-2" />
                <span>Loading recent analyses...</span>
              </div>
            ) : reportsList.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] py-2.5 px-3">
                        Patient ID
                      </th>
                      <th className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] py-2.5 px-3">
                        Date
                      </th>
                      <th className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] py-2.5 px-3">
                        Modalities
                      </th>
                      <th className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] py-2.5 px-3">
                        Fusion Status
                      </th>
                      <th className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] py-2.5 px-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.slice(0, 5).map((rep) => (
                      <tr
                        key={rep.report_id}
                        className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="font-mono-data text-[13px] font-semibold text-[#0F172A] py-3.5 px-3">
                          {rep.patient_id}
                        </td>
                        <td className="font-body text-[12px] text-[#64748B] py-3.5 px-3">
                          {new Date(rep.assessment_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {rep.ecg_analysis && (
                              <span className="bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-[10px] font-mono-data font-semibold px-2 py-0.5 rounded-[4px]">
                                ECG
                              </span>
                            )}
                            {rep.echo_analysis && (
                              <span className="bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF] text-[10px] font-mono-data font-semibold px-2 py-0.5 rounded-[4px]">
                                Echo
                              </span>
                            )}
                            {!rep.ecg_analysis && !rep.echo_analysis && (
                              <span className="text-[#94A3B8] text-[11px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {renderStatusBadge(rep.fusion_result?.status)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewReport(rep)}
                              className="text-[#0284C7] hover:text-[#0369A1] text-[13px] font-semibold font-body transition-colors"
                            >
                              View Report →
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientToDelete({ patientId: rep.patient_id, reportId: rep.report_id })}
                              className="p-1.5 text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-[6px] transition-colors cursor-pointer"
                              title="Remove patient study"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <FileX size={44} className="text-[#94A3B8] mb-3 stroke-[1.2]" />
                <p className="font-body text-[14px] text-[#64748B] mb-4">
                  No analyses yet. Start your first.
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-body text-[13px] font-medium px-5 py-2.5 rounded-[8px] transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Start Analysis</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (col-span-1): Evidence Pipeline Architecture Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="font-display font-semibold text-[16px] text-[#0F172A] mb-4 pb-4 border-b border-[#E2E8F0]">
              Evidence Pipeline
            </h2>

            {/* Vertical Pipeline Diagram */}
            <div className="space-y-0">
              {/* Stage 1: ECG Agent */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-[10px_14px] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0" />
                <div>
                  <h3 className="font-body font-semibold text-[13px] text-[#0F172A] flex items-center gap-1.5">
                    <span>ECG Agent</span>
                  </h3>
                  <p className="font-body text-[11px] text-[#64748B]">Electrical cardiac evidence</p>
                </div>
              </div>
              <div className="w-[1px] h-2 bg-[#CBD5E1] ml-4" />

              {/* Stage 2: Echo Agent */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-[10px_14px] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
                <div>
                  <h3 className="font-body font-semibold text-[13px] text-[#0F172A] flex items-center gap-1.5">
                    <span>Echo Agent</span>
                  </h3>
                  <p className="font-body text-[11px] text-[#64748B]">Structural & functional evidence</p>
                </div>
              </div>
              <div className="w-[1px] h-2 bg-[#CBD5E1] ml-4" />

              {/* Stage 3: Multimodal Fusion */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-[10px_14px] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0" />
                <div>
                  <h3 className="font-body font-semibold text-[13px] text-[#0F172A] flex items-center gap-1.5">
                    <span>Multimodal Fusion</span>
                  </h3>
                  <p className="font-body text-[11px] text-[#64748B]">Cross-modal comparison</p>
                </div>
              </div>
              <div className="w-[1px] h-2 bg-[#CBD5E1] ml-4" />

              {/* Stage 4: History Agent */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-[10px_14px] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0" />
                <div>
                  <h3 className="font-body font-semibold text-[13px] text-[#0F172A] flex items-center gap-1.5">
                    <span>History Agent</span>
                  </h3>
                  <p className="font-body text-[11px] text-[#64748B]">Temporal evidence tracking</p>
                </div>
              </div>
              <div className="w-[1px] h-2 bg-[#CBD5E1] ml-4" />

              {/* Stage 5: Final Reasoning */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-[10px_14px] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] shrink-0" />
                <div>
                  <h3 className="font-body font-semibold text-[13px] text-[#0F172A] flex items-center gap-1.5">
                    <span>Final Reasoning</span>
                  </h3>
                  <p className="font-body text-[11px] text-[#64748B]">Unified explainable assessment</p>
                </div>
              </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => navigate('/upload')}
                className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] text-[12px] font-body font-semibold py-2.5 px-3 rounded-[8px] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Launch Assessment Run</span>
                <ArrowRight size={14} className="text-[#0284C7]" />
              </button>
            </div>
          </div>
        </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {patientToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-6 max-w-[440px] w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-[16px] text-[#0F172A]">
                  Remove Patient Study?
                </h3>
                <p className="font-body text-[13px] text-[#64748B] leading-relaxed">
                  Are you sure you want to remove patient <code className="text-[#0284C7] font-mono-data text-[12px] font-semibold">{patientToDelete.patientId}</code>?
                </p>
                <p className="font-body text-[12px] text-[#9F1239] bg-[#FFF1F2] border border-[#FECDD3] p-2.5 rounded-[6px] mt-2">
                  This will delete the assessment records and remove the patient from your clinical dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC] font-body text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePatient}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white font-body text-[13px] font-semibold rounded-[8px] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
