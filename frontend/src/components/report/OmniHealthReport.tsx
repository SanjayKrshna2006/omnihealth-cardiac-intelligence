import React from 'react';
import { 
  Heart, Activity, GitMerge, History, Brain, ShieldAlert, 
  CheckCircle2, AlertTriangle, Printer, Eye 
} from 'lucide-react';
import type { OmniHealthState } from '../../types';
import { API_BASE_URL } from '../../api/client';

interface ReportProps {
  state: OmniHealthState;
}

const FUSION_BADGES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  agreement: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Concordant Agreement' },
  complementary: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'Complementary Insights' },
  conflict: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', label: 'Clinical Discrepancy / Conflict' },
  missing_modality: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Unimodal / Missing Modality' },
  insufficient: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Insufficient Evidence' },
};

export const OmniHealthReport: React.FC<ReportProps> = ({ state }) => {
  const { 
    patient_id, 
    ecg_evidence, 
    echo_evidence, 
    fusion_result, 
    history_analysis, 
    final_assessment 
  } = state;

  const fusionStyle = fusion_result ? FUSION_BADGES[fusion_result.status] || FUSION_BADGES.insufficient : FUSION_BADGES.insufficient;

  const handlePrint = () => {
    window.print();
  };

  const getGradCamUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalized = path.replace(/\\/g, '/');
    const filename = normalized.split('/').pop();
    return `${API_BASE_URL}/uploads/explainability/${filename}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:p-0">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-black">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900">Vital Care Clinical Assessment Report</h1>
            <p className="text-[11px] text-slate-500">Patient ID: <strong className="text-slate-800 font-mono">{patient_id}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold tracking-tight">AI-Assisted Research Prototype — Clinical Decision Support Only</p>
          <p className="text-amber-800/90 leading-relaxed text-[11px]">
            This assessment synthesizes 12-lead electrophysiology and 3D echocardiographic deep learning models. Findings are advisory and must be verified by a board-certified cardiologist before diagnostic or therapeutic intervention.
          </p>
        </div>
      </div>

      {/* Multimodal Fusion Status Banner */}
      {fusion_result && (
        <div className={`rounded-xl border p-5 ${fusionStyle.bg} ${fusionStyle.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4 mb-3">
            <div className="flex items-center gap-2.5">
              <GitMerge className="w-5 h-5 text-slate-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Multimodal Cardiac Fusion Layer
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${fusionStyle.bg} ${fusionStyle.text} ${fusionStyle.border}`}>
              {fusionStyle.label}
            </span>
          </div>

          <p className="text-xs font-medium text-slate-800 leading-relaxed">
            {fusion_result.agreement_summary}
          </p>

          {fusion_result.conflict_description && (
            <div className="mt-3 p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Clinical Discrepancy Note</p>
                <p className="text-[11px] mt-0.5">{fusion_result.conflict_description}</p>
              </div>
            </div>
          )}

          {fusion_result.combined_evidence && fusion_result.combined_evidence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-black/5">
              {fusion_result.combined_evidence.map((ev, i) => (
                <span key={i} className="px-2.5 py-1 bg-white/80 border border-slate-200/80 rounded-md text-[11px] font-medium text-slate-700">
                  ✓ {ev}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unimodal Evidence Cards (ECG & Echo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ECG Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">12-Lead ECG Analysis</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ECG-CNN-PTB-XL</p>
                </div>
              </div>
              {ecg_evidence?.confidence && (
                <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold rounded-md">
                  {(ecg_evidence.confidence * 100).toFixed(0)}% Conf
                </span>
              )}
            </div>

            {ecg_evidence ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Finding</label>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">{ecg_evidence.finding}</p>
                </div>

                {ecg_evidence.supporting_evidence && ecg_evidence.supporting_evidence.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Electrophysiology Metrics</label>
                    <ul className="mt-1 space-y-1">
                      {ecg_evidence.supporting_evidence.map((point, idx) => (
                        <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ecg_evidence.raw_predictions && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PTB-XL Superclass Distribution</label>
                    <div className="mt-1.5 grid grid-cols-5 gap-1.5 text-center">
                      {Object.entries(ecg_evidence.raw_predictions).map(([label, prob]) => (
                        <div key={label} className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-700 block">{label}</span>
                          <span className="text-[10px] font-mono text-slate-500">{((prob as number) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No ECG modality data supplied for this assessment.
              </div>
            )}
          </div>

          {ecg_evidence?.limitations && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-500">Limitations:</span> {ecg_evidence.limitations[0]}
            </div>
          )}
        </div>

        {/* Echo Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">Echocardiogram Video</h3>
                  <p className="text-[10px] text-slate-400 font-mono">EchoNet-Dynamic 3D</p>
                </div>
              </div>
              {echo_evidence?.confidence && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold rounded-md">
                  {(echo_evidence.confidence * 100).toFixed(0)}% Conf
                </span>
              )}
            </div>

            {echo_evidence ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated LVEF & Classification</label>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{echo_evidence.finding}</p>
                </div>

                {/* Evidence bullets */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Functional Metrics</label>
                  <ul className="mt-1 space-y-1">
                    {echo_evidence.evidence.map((point, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grad-CAM Visual Overlay */}
                {echo_evidence.visual_evidence_path && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-500" />
                      <span>3D Grad-CAM Saliency Heatmap</span>
                    </label>
                    <div className="mt-1.5 relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 max-h-36 flex items-center justify-center">
                      <img
                        src={getGradCamUrl(echo_evidence.visual_evidence_path) || ''}
                        alt="Grad-CAM Cardiac Saliency"
                        className="object-contain max-h-36 w-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No Echocardiogram video supplied for this assessment.
              </div>
            )}
          </div>

          {echo_evidence?.limitations && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-500">Limitations:</span> {echo_evidence.limitations[0]}
            </div>
          )}
        </div>
      </div>

      {/* Longitudinal History Section */}
      {history_analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
            <History className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Longitudinal History & Temporal Comparison
            </h3>
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
              {history_analysis.relationship}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Prior State / Baseline</span>
                <p className="text-slate-700 mt-0.5">{history_analysis.previous_ecg_finding || 'No prior ECG record on file.'}</p>
              </div>

              {history_analysis.changes_detected && history_analysis.changes_detected.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Changes Detected</span>
                  <ul className="mt-0.5 space-y-1">
                    {history_analysis.changes_detected.map((c, i) => (
                      <li key={i} className="text-[11px] text-rose-700 font-medium">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Comparative Clinical Analysis</span>
                <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                  {history_analysis.analysis_notes || history_analysis.current_summary}
                </p>
              </div>

              {history_analysis.persistent_findings && history_analysis.persistent_findings.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Persistent Findings</span>
                  <ul className="mt-0.5 space-y-1">
                    {history_analysis.persistent_findings.map((p, i) => (
                      <li key={i} className="text-[11px] text-emerald-800 font-medium">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final AI-Assisted Assessment */}
      {final_assessment && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">Final AI-Assisted Synthesis</h2>
                <p className="text-xs text-indigo-200">Explainable Multi-Agent Reasoning</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold capitalize">
                Sufficiency: {final_assessment.evidence_sufficiency}
              </span>
              <span className="px-3 py-1 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-full text-xs font-bold">
                Review Required
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Primary Assessment Callout */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                Primary Assessment Summary
              </label>
              <p className="text-sm font-bold text-white mt-1 leading-relaxed">
                {final_assessment.primary_assessment}
              </p>
            </div>

            {/* Supported Findings Checklist */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block mb-2">
                Supported Findings
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {final_assessment.supported_findings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Explanation */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block mb-1">
                Step-by-Step Clinical Reasoning
              </label>
              <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                {final_assessment.explanation}
              </p>
            </div>

            {/* Limitations Box */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 block mb-1">
                Model Limitations & Safety Constraints
              </label>
              <ul className="space-y-1">
                {final_assessment.limitations.map((limit, idx) => (
                  <li key={idx} className="text-[11px] text-rose-200/80 flex items-start gap-1.5">
                    <span className="text-rose-400">•</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Clinician Sign-Off Section */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300">Cardiologist Verification</p>
              <p className="text-[11px]">Electronic record verification pending clinical signature.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-44 border-b border-dashed border-slate-500 flex items-end justify-center pb-1 text-[11px] text-slate-500 italic">
                Physician Signature
              </div>
              <div className="h-8 w-28 border-b border-dashed border-slate-500 flex items-end justify-center pb-1 text-[11px] text-slate-500 italic">
                Date
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
