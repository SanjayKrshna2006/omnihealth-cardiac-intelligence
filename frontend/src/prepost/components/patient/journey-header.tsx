'use client';

import type { MilestonePhase, PatientDetails, PlanChangeRecord } from '@/lib/types/database';
import {
  CheckCircle2,
  ChevronRight,
  Plus,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import React from 'react';

interface JourneyHeaderProps {
  patient: PatientDetails;
  dayOffset: number;
  currentDayNumber: number;
  totalDays: number;
  currentPhase?: MilestonePhase;
  recentChange?: PlanChangeRecord;
  onStartAiCheckin: () => void;
  onOpenQuickLog: () => void;
  onOpenDiscomfortModal: () => void;
  onOpenChangeLog: () => void;
  onCompleteDayAndAdvance?: () => void;
}

export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  patient,
  dayOffset,
  currentDayNumber,
  totalDays,
  recentChange,
  onStartAiCheckin,
  onOpenQuickLog,
  onOpenDiscomfortModal,
  onOpenChangeLog,
  onCompleteDayAndAdvance,
}) => {
  // Check if today is past the last plan day / program complete
  const isProgramComplete = patient.status === 'program_complete' || currentDayNumber > totalDays;

  // Compute Countdown Text
  let countdownTitle = '';
  let countdownBadge = '';

  if (isProgramComplete) {
    countdownTitle = 'Recovery Program Completed';
    countdownBadge = 'Program Complete';
  } else if (dayOffset < 0) {
    const daysUntil = Math.abs(dayOffset);
    countdownTitle = `Surgery in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
    countdownBadge = 'Pre-Operative Preparation';
  } else if (dayOffset === 0) {
    countdownTitle = 'Surgery is scheduled Today';
    countdownBadge = 'Surgery Day Protocol';
  } else {
    countdownTitle = `Day ${dayOffset} after surgery`;
    countdownBadge = 'Post-Operative Recovery';
  }

  return (
    <div className="space-y-4">
      {/* 1. Main Countdown & Active Phase Banner */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-accent-light text-accent border border-accent/20 rounded-md text-[11px] font-bold uppercase tracking-wider">
              {countdownBadge}
            </span>
            {patient.demo_shortened && (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold">
                Demo mode: plan shortened
              </span>
            )}
            {!isProgramComplete ? (
              <span className="text-xs text-muted font-medium">
                Day {currentDayNumber} of {totalDays}
              </span>
            ) : (
              <span className="text-xs text-muted font-medium">
                {totalDays} days completed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {countdownTitle}
          </h1>

          <p className="text-xs text-muted max-w-xl">
            Live dynamic recovery protocol for <strong className="text-foreground">{patient.surgery_type.toUpperCase()}</strong>.
            The plan continually adapts to your daily adherence, vitals, and comfort.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenDiscomfortModal}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report Discomfort</span>
          </button>

          <button
            onClick={onOpenQuickLog}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-surface hover:bg-accent-light hover:text-accent border border-border rounded-xl text-xs font-bold text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Log</span>
          </button>

          {onCompleteDayAndAdvance && !isProgramComplete && (
            <button
              onClick={onCompleteDayAndAdvance}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm ring-2 ring-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Day & Next Day →</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 'What changed for you' Live Adaptation Notification Card */}
      {recentChange && !recentChange.reverted && (
        <div className="bg-accent-light border border-accent/20 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  Live Plan Adaptation
                </span>
                <span className="text-[11px] text-muted">
                  Affects {recentChange.category.toUpperCase()} on Day {recentChange.day_number}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {recentChange.reason}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                <span>Factors: {recentChange.factors.join(', ')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenChangeLog}
            className="text-xs font-bold text-accent hover:underline shrink-0 flex items-center gap-1"
          >
            <span>View Full Change Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
