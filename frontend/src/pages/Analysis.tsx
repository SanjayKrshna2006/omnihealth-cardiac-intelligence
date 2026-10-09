import React, { useEffect, useState } from 'react';
import { 
  Check, 
  Minus, 
  AlertCircle, 
  RotateCcw, 
  ArrowRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobStatus } from '../api/client';
import type { AnalysisJob } from '../api/client';
import { useAnalysisStore } from '../store/analysisStore';

interface StageConfig {
  key: string;
  name: string;
  description: string;
  color: string;
}

const STAGES: StageConfig[] = [
  {
    key: 'ecg_analysis',
    name: 'ECG Agent',
    description: 'Analysing ECG waveform and electrical features',
    color: '#0284C7',
  },
  {
    key: 'echo_analysis',
    name: 'Echo Agent',
    description: 'Processing echocardiogram video frames',
    color: '#7C3AED',
  },
  {
    key: 'multimodal_fusion',
    name: 'Multimodal Fusion',
    description: 'Comparing cross-modal cardiac evidence',
    color: '#059669',
  },
  {
    key: 'history_analysis',
    name: 'History Agent',
    description: 'Reviewing previous cardiac records',
    color: '#D97706',
  },
  {
    key: 'final_reasoning',
    name: 'Final Reasoning',
    description: 'Generating explainable unified assessment',
    color: '#0F172A',
  },
];

export const Analysis: React.FC = () => {
  const { jobId: routeJobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { currentJobId, activePatientId, setCurrentState } = useAnalysisStore();
  const effectiveJobId = routeJobId || currentJobId;

  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!effectiveJobId) return;

    let isMounted = true;
    const poll = async () => {
      try {
        const data = await getJobStatus(effectiveJobId);
        if (!isMounted) return;
        setJob(data);

        if (data.status === 'complete') {
          if (data.result) {
            setCurrentState(data.result);
          }
        } else if (data.status === 'failed') {
          setError(data.error || 'Pipeline execution encountered an unexpected error.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Status poll error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveJobId, setCurrentState]);

  const handleViewReport = () => {
    const reportTarget = job?.report_id || 'latest';
    navigate(`/report/${reportTarget}`);
  };

  if (!effectiveJobId) {
    return (
      <div className="animate-in fade-in duration-300 max-w-[720px] mx-auto text-center py-20 bg-white border border-[#E2E8F0] rounded-[12px] p-8 shadow-sm">
        <h2 className="font-display font-semibold text-[18px] text-[#0F172A] mb-2">
          No Active Analysis Pipeline
        </h2>
        <p className="font-body text-[13px] text-[#64748B] mb-6">
          Please upload a patient study or launch an analysis from the dashboard.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-body text-[13px] font-medium px-6 py-2.5 rounded-[8px] transition-colors shadow-sm"
        >
          New Analysis
        </button>
      </div>
    );
  }

  // Determine stage index
  const stageKeys = STAGES.map((s) => s.key);
  const currentStageIndex = job?.stage ? stageKeys.indexOf(job.stage) : 0;
  const isComplete = job?.status === 'complete';
  const isFailed = job?.status === 'failed';

  const getStageState = (idx: number): 'complete' | 'running' | 'pending' | 'skipped' => {
    if (isComplete) return 'complete';
    if (isFailed && idx >= currentStageIndex) return 'pending';
    if (idx < currentStageIndex) return 'complete';
    if (idx === currentStageIndex) return 'running';
    return 'pending';
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-[720px] w-full mx-auto space-y-6">
      {/* ────────────────────────────────────────
          TOP: Patient context bar
          ──────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-[16px_24px] shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
        <div>
          <span className="font-body text-[10px] font-semibold uppercase tracking-[1.2px] text-[#64748B] block">
            PATIENT ID
          </span>
          <p className="font-mono-data font-semibold text-[16px] text-[#0F172A] mt-0.5">
            {job?.patient_id || activePatientId || 'PT-10482'}
          </p>
        </div>

        <div className="text-right">
          <span className="font-body text-[12px] text-[#64748B] block">
            Analysis started
          </span>
          <p className="font-mono-data text-[12px] text-[#0F172A] mt-0.5 font-medium">
            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────
          MAIN: Pipeline stage tracker
          ──────────────────────────────────────── */}
      <div className="text-center pt-2">
        <h2 className="font-display font-bold text-[22px] text-[#0F172A] tracking-tight">
          Running Vital Care Pipeline
        </h2>
        <p className="font-body text-[13px] text-[#64748B] mt-1 mb-8">
          Agents are processing cardiac evidence
        </p>

        {/* 5 Pipeline Stages List */}
        <div className="text-left">
          {STAGES.map((stage, idx) => {
            const state = getStageState(idx);
            const isLast = idx === STAGES.length - 1;
            const prevCompleted = idx > 0 && getStageState(idx - 1) === 'complete';

            return (
              <div key={stage.key}>
                {/* Stage Card */}
                <div
                  className={`w-full rounded-[10px] p-[14px_18px] transition-all duration-300 relative flex items-center justify-between shadow-2xs ${
                    state === 'running'
                      ? 'bg-white border-2 border-[#0284C7] shadow-[0_0_15px_rgba(2,132,199,0.12)]'
                      : state === 'complete'
                      ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                      : state === 'skipped'
                      ? 'bg-[#F8FAFC] border border-dashed border-[#E2E8F0]'
                      : 'bg-white border border-[#E2E8F0]'
                  }`}
                >
                  {/* Left: Indicator Dot + Stage Info */}
                  <div className="flex items-center gap-3.5">
                    {/* Left Dot */}
                    <div className="relative flex items-center justify-center shrink-0">
                      {state === 'running' && (
                        <span className="absolute w-3.5 h-3.5 rounded-full bg-[#0284C7] animate-ping opacity-60" />
                      )}
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          state === 'complete'
                            ? 'bg-[#059669]'
                            : state === 'running'
                            ? 'bg-[#0284C7]'
                            : 'bg-[#F1F5F9] border border-[#CBD5E1]'
                        }`}
                      >
                        {state === 'complete' && (
                          <Check size={9} className="text-white stroke-[3]" />
                        )}
                        {state === 'skipped' && (
                          <Minus size={9} className="text-[#94A3B8]" />
                        )}
                      </div>
                    </div>

                    {/* Stage Name & Subtitle */}
                    <div>
                      <h3
                        className={`font-body font-semibold text-[14px] leading-tight ${
                          state === 'running' || state === 'complete'
                            ? 'text-[#0F172A]'
                            : 'text-[#64748B]'
                        }`}
                      >
                        {stage.name}
                      </h3>
                      <p
                        className={`font-body text-[11px] mt-0.5 ${
                          state === 'running' || state === 'complete'
                            ? 'text-[#64748B]'
                            : 'text-[#94A3B8]'
                        }`}
                      >
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: State Label */}
                  <div className="text-right shrink-0">
                    {state === 'running' && (
                      <div className="flex items-center gap-1.5 font-mono-data text-[12px] font-semibold text-[#0284C7]">
                        <span>Processing</span>
                        <span className="animate-pulse">...</span>
                      </div>
                    )}

                    {state === 'complete' && (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-[12px] text-[#059669] font-semibold">
                          Complete ✓
                        </span>
                        <span className="font-mono-data text-[11px] text-[#64748B]">
                          {Math.max(1, Math.round(elapsedSeconds / (idx + 1)))}s
                        </span>
                      </div>
                    )}

                    {state === 'skipped' && (
                      <span className="font-body text-[11px] text-[#94A3B8]">
                        Skipped — data not provided
                      </span>
                    )}

                    {state === 'pending' && (
                      <span className="font-body text-[11px] text-[#94A3B8]">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Vertical Connector Line */}
                {!isLast && (
                  <div 
                    className={`w-[1px] h-6 ml-5 my-1 transition-colors ${
                      prevCompleted || state === 'complete'
                        ? 'bg-[#059669]/40'
                        : 'bg-[#CBD5E1]'
                    }`} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────
          BOTTOM: Summary bar (appears when all done)
          ──────────────────────────────────────── */}
      {isComplete && (() => {
        const isCritical = 
          job?.result?.final_assessment?.priority_level === 'critical' || 
          job?.result?.final_assessment?.clinical_priority?.toLowerCase().includes('critical') || 
          job?.result?.final_assessment?.primary_assessment?.toLowerCase().includes('critical') ||
          job?.result?.final_assessment?.suspected_condition?.toLowerCase().includes('critical');

        return (
          <div className={`rounded-[12px] p-[20px_24px] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
            isCritical
              ? 'bg-[#FFF1F2] border-[#FDA4AF]'
              : 'bg-[#F0FDF4] border-[#BBF7D0]'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-display font-bold text-[16px] ${
                  isCritical ? 'text-[#9F1239]' : 'text-[#065F46]'
                }`}>
                  {isCritical ? 'CRITICAL CARDIAC FINDING DETECTED' : 'Analysis Complete — Assessment Ready'}
                </h3>
                {isCritical && (
                  <span className="bg-[#E11D48] text-white font-mono-data text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                    CRITICAL PRIORITY
                  </span>
                )}
              </div>
              <p className="font-body text-[12px] text-[#64748B] mt-0.5">
                {isCritical 
                  ? 'Immediate clinical review recommended. Evidence shows critical electrical or structural pathology.'
                  : 'All multi-agent evidence synthesized into explainable assessment.'}
              </p>
            </div>

            <button
              onClick={handleViewReport}
              className={`font-display font-semibold text-[14px] px-7 py-2.5 rounded-[8px] transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 hover:scale-[1.01] ${
                isCritical
                  ? 'bg-[#E11D48] hover:bg-[#BE123C] text-white animate-pulse'
                  : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
              }`}
            >
              <span>{isCritical ? 'View Critical Assessment' : 'View Full Assessment'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        );
      })()}

      {/* Error state */}
      {isFailed && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[12px] p-6 text-[#9F1239] space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-display font-semibold text-[15px] text-[#E11D48]">
            <AlertCircle size={18} />
            <span>Analysis Execution Failed</span>
          </div>
          <p className="font-mono-data text-[12px] text-[#9F1239] bg-white border border-[#FECDD3] p-3 rounded-[6px]">
            {error || 'An unexpected error interrupted the LangGraph execution.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="border border-[#E11D48] text-[#E11D48] hover:bg-[#FFE4E6] font-body text-[13px] font-semibold px-4 py-2 rounded-[8px] transition-colors flex items-center gap-2 bg-white"
            >
              <RotateCcw size={14} />
              <span>Retry Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
