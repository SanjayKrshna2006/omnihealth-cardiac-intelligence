import React, { useEffect, useState } from 'react';
import { Heart, Activity, GitMerge, History, Brain, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getJobStatus } from '../../api/client';
import type { AnalysisJob } from '../../api/client';
import { useAnalysisStore } from '../../store/analysisStore';

const STAGES = [
  {
    key: 'ecg_analysis',
    label: 'ECG Analysis Agent',
    description: 'Signal filtering, 12-lead R-peak detection & PTB-XL CNN inference',
    icon: Heart,
    color: 'rose',
  },
  {
    key: 'echo_analysis',
    label: 'Echo Video Agent',
    description: '3D Spatiotemporal video feature extraction & LVEF quantification',
    icon: Activity,
    color: 'blue',
  },
  {
    key: 'multimodal_fusion',
    label: 'Multimodal Fusion Engine',
    description: 'Electrical vs. mechanical cardiac physiology synthesis',
    icon: GitMerge,
    color: 'purple',
  },
  {
    key: 'history_analysis',
    label: 'Longitudinal History Agent',
    description: 'Comparative tracking against prior reports & baseline changes',
    icon: History,
    color: 'amber',
  },
  {
    key: 'final_reasoning',
    label: 'Explainable Final Reasoning',
    description: 'Structured clinical assessment with safety guardrails & limitations',
    icon: Brain,
    color: 'emerald',
  },
];

interface PipelineTrackerProps {
  jobId: string;
  onComplete?: (job: AnalysisJob) => void;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ jobId, onComplete }) => {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentState, setActivePage } = useAnalysisStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const pollStatus = async () => {
      try {
        const data = await getJobStatus(jobId);
        setJob(data);

        if (data.status === 'complete') {
          clearInterval(interval);
          if (data.result) {
            setCurrentState(data.result);
          }
          if (onComplete) {
            onComplete(data);
          }
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error || 'Pipeline execution failed');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to poll analysis status');
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  const currentStageIndex = STAGES.findIndex((s) => s.key === job?.stage);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/80 p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
              Real-Time Execution
            </span>
            <span className="text-xs font-mono text-slate-400">Job: {jobId.slice(0, 8)}...</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Multimodal Assessment Pipeline</h2>
          <p className="text-xs text-slate-500">Autonomous multi-agent LangGraph orchestration</p>
        </div>

        {job?.status === 'complete' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Analysis Complete</span>
          </div>
        ) : job?.status === 'failed' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Failed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Processing Agents...</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Pipeline Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Stage Flow */}
      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const isDone = job?.status === 'complete' || (currentStageIndex > -1 && idx < currentStageIndex);
          const isActive = job?.status !== 'complete' && idx === currentStageIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-slate-50/80 border-slate-200/80 text-slate-900'
                  : isActive
                  ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-blue-300 shadow-md shadow-blue-500/5'
                  : 'bg-white border-slate-100 text-slate-400 opacity-60'
              }`}
            >
              {/* Stage Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white animate-bounce'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs font-bold ${isActive ? 'text-blue-900' : isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                    {stage.label}
                  </h3>
                  {isActive && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{stage.description}</p>
              </div>

              {/* Status Badge */}
              <div className="text-right shrink-0">
                {isDone ? (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </span>
                ) : isActive ? (
                  <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Waiting</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action when complete */}
      {job?.status === 'complete' && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setActivePage('report')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>View Full Clinical Report</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};
