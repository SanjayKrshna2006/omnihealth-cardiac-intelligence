import React, { useEffect, useState } from 'react';
import { Users, FileText, ChevronRight, Loader2, User, Clock, Plus, Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listPatients, getPatientReports, deletePatient } from '../api/client';
import type { Patient, OmniHealthReport } from '../types';
import { useAnalysisStore } from '../store/analysisStore';
import { useAuthStore } from '../store/authStore';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentDoctor } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<OmniHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const { setCurrentState, setCurrentReport, setActivePatientId } = useAnalysisStore();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const list = await listPatients(currentDoctor?.email, currentDoctor?.id);
        setPatients(list);
        if (list.length > 0) {
          setSelectedPatient(list[0]);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [currentDoctor?.email, currentDoctor?.id]);

  useEffect(() => {
    if (!selectedPatient) return;
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const data = await getPatientReports(selectedPatient.patient_id);
        setReports(data);
      } catch (err) {
        console.error('Error fetching patient reports:', err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, [selectedPatient]);

  const handleSelectReport = (report: OmniHealthReport) => {
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

  const handleNewAnalysisForPatient = () => {
    if (selectedPatient) {
      setActivePatientId(selectedPatient.patient_id);
    }
    navigate('/upload');
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      setIsDeleting(true);
      await deletePatient(patientToDelete.patient_id);
      setNotification(`Patient ${patientToDelete.name || patientToDelete.patient_id} removed successfully.`);
      const updatedList = patients.filter((p) => p.patient_id !== patientToDelete.patient_id);
      setPatients(updatedList);
      if (selectedPatient?.patient_id === patientToDelete.patient_id) {
        setSelectedPatient(updatedList.length > 0 ? updatedList[0] : null);
      }
      setPatientToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to remove patient');
    } finally {
      setIsDeleting(false);
    }
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

      {/* 2 Column Layout: Left Patient List, Right Longitudinal Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Patients List */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h2 className="font-display font-semibold text-[15px] text-[#0F172A] flex items-center gap-2">
              <Users size={16} className="text-[#0284C7]" />
              <span>Registered Cohort ({patients.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-[#64748B] text-[13px]">
              <Loader2 size={20} className="animate-spin text-[#0284C7] mr-2" />
              <span>Loading patients...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-[13px] font-body text-[#64748B]">
              No patients registered in cohort.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {patients.map((p) => {
                const isSelected = selectedPatient?.patient_id === p.patient_id;
                return (
                  <div
                    key={p.patient_id}
                    onClick={() => setSelectedPatient(p)}
                    className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#E0F2FE]/50 border-[#0284C7]/40 text-[#0F172A]'
                        : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-[#0284C7] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        <User size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-body text-[13px] font-semibold text-[#0F172A] truncate max-w-[130px]">
                          {p.name || p.patient_id}
                        </p>
                        <p className="font-mono-data text-[11px] text-[#64748B]">
                          {p.patient_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(p);
                        }}
                        className="p-1 text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-[4px] opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove patient"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={14} className={isSelected ? 'text-[#0284C7]' : 'text-[#94A3B8]'} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Patient Details & Longitudinal Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-6">
          {selectedPatient ? (
            <>
              {/* Selected Patient Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-[18px] text-[#0F172A]">
                      {selectedPatient.name || selectedPatient.patient_id}
                    </h2>
                    <span className="bg-[#E0F2FE] text-[#0369A1] font-mono-data text-[11px] font-semibold px-2 py-0.5 rounded">
                      {selectedPatient.patient_id}
                    </span>
                  </div>
                  <p className="font-body text-[12px] text-[#64748B] mt-0.5">
                    Age: <strong className="text-[#0F172A]">{selectedPatient.age || '54'}</strong> • Sex: <strong className="text-[#0F172A]">{selectedPatient.gender || 'Female'}</strong> • {selectedPatient.medical_history_summary || 'Clinical history on record.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPatientToDelete(selectedPatient)}
                    className="border border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2] font-body text-[12px] font-semibold px-3.5 py-2 rounded-[8px] transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                    title="Remove patient from cohort"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>

                  <button
                    onClick={handleNewAnalysisForPatient}
                    className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-body text-[12px] font-semibold px-4 py-2 rounded-[8px] transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Plus size={14} />
                    <span>New Study</span>
                  </button>
                </div>
              </div>

              {/* Assessment Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#64748B]">
                  <Clock size={14} />
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[1px]">
                    ASSESSMENT TIMELINE ({reports.length})
                  </span>
                </div>

                {loadingReports ? (
                  <div className="py-12 flex justify-center text-[#64748B]">
                    <Loader2 size={20} className="animate-spin text-[#0284C7]" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-12 text-center text-[13px] font-body text-[#64748B]">
                    No past reports for this patient.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reports.map((rep) => (
                      <div
                        key={rep.report_id}
                        onClick={() => handleSelectReport(rep)}
                        className="bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] p-4 rounded-[8px] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-[6px] bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-data text-[13px] text-[#0F172A] font-semibold">
                                {rep.report_id}
                              </span>
                              <span className="bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-[10px] font-mono-data uppercase font-semibold px-2 py-0.5 rounded-[4px]">
                                {rep.fusion_result?.status?.toUpperCase() || 'ASSESSED'}
                              </span>
                            </div>
                            <p className="font-body text-[12px] text-[#64748B] mt-1 line-clamp-1">
                              {rep.final_assessment?.primary_assessment || rep.fusion_result?.agreement_summary || 'Clinical assessment completed.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right shrink-0">
                          <span className="font-body text-[11px] text-[#64748B]">
                            {new Date(rep.assessment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <ChevronRight size={14} className="text-[#94A3B8]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-[13px] font-body text-[#64748B]">
              Select a patient from the left to view longitudinal history.
            </div>
          )}
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
                  Remove Patient from Cohort?
                </h3>
                <p className="font-body text-[13px] text-[#64748B] leading-relaxed">
                  Are you sure you want to remove <strong className="text-[#0F172A]">{patientToDelete.name || patientToDelete.patient_id}</strong> (<code className="text-[#0284C7] font-mono-data text-[11px] font-semibold">{patientToDelete.patient_id}</code>)?
                </p>
                <p className="font-body text-[12px] text-[#9F1239] bg-[#FFF1F2] border border-[#FECDD3] p-2.5 rounded-[6px] mt-2">
                  This will permanently delete the patient profile and all associated 12-lead ECG traces, echocardiograms, and multimodal clinical reports.
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
