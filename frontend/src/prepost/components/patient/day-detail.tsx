'use client';

import type {
  AlertRow,
  DiscomfortReport,
  LogEntry,
  PlanChangeRecord,
  PlanRow,
} from '@/lib/types/database';
import {
  CheckCircle2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import React from 'react';
import { TodayChecklist } from './today-checklist';

interface DayDetailProps {
  plan: PlanRow;
  currentDayOffset: number;
  logs: LogEntry[];
  discomforts: DiscomfortReport[];
  changes: PlanChangeRecord[];
  alerts: AlertRow[];
  onToggleItemDone?: (category: string, itemId: string) => void;
  onOpenQuickLog?: () => void;
  onEventSaved?: (msg?: string) => void;
}

export const DayDetail: React.FC<DayDetailProps> = ({
  plan,
  currentDayOffset,
  logs,
  discomforts,
  changes,
  alerts,
  onToggleItemDone,
  onOpenQuickLog,
  onEventSaved,
}) => {
  const isToday = plan.day_offset === currentDayOffset;
  const isPast = plan.day_offset < currentDayOffset;
  const isFuture = plan.day_offset > currentDayOffset;
  const isSurgery = plan.day_offset === 0;

  // Filter logs for this specific day
  const dayLogs = logs.filter((l) => l.day_offset === plan.day_offset);
  const dayDiscomforts = discomforts.filter((d) => d.day_offset === plan.day_offset);
  const dayChanges = changes.filter((c) => c.day_offset === plan.day_offset);
  const dayAlerts = alerts.filter((a) => a.day_offset === plan.day_offset);

  // Vitals from logs
  const vitalLog = dayLogs.find((l) => l.kind === 'vital');
  const painLog = dayLogs.find((l) => l.kind === 'pain');

  return (
    <div className="space-y-6">
      {/* Day Overview Header Card */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-accent-light text-accent border border-accent/20 rounded-md text-xs font-extrabold uppercase">
              Day {plan.day_number}
            </span>
            <span className="text-xs text-muted font-medium">
              {plan.content.stage === 'before'
                ? `${Math.abs(plan.day_offset)} Days Before Surgery`
                : plan.content.stage === 'surgery'
                  ? 'Surgery Day'
                  : `Day +${plan.day_offset} Post-Operative`}
            </span>
            <span className="text-xs text-muted">• {plan.date}</span>
          </div>

          <h2 className="text-xl font-bold text-foreground mt-1">
            {plan.content.phase_name}
          </h2>

          <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
            <strong>Clinical Focus:</strong> {plan.content.focus_note}
          </p>
        </div>

        {/* State Tag */}
        <div className="shrink-0 text-right">
          {isToday ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-light text-accent font-bold text-xs rounded-full border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Active Day (In Progress)
            </span>
          ) : isPast ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Frozen History Logged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 font-medium text-xs rounded-full border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Live Forecast (Adapts with recovery)
            </span>
          )}
        </div>
      </div>

      {/* Changes on this day (if any) */}
      {dayChanges.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Plan Changes Adapted on this Day</span>
          </div>
          <div className="divide-y divide-amber-200/60">
            {dayChanges.map((chg) => (
              <div key={chg.id} className="pt-2 first:pt-0 text-xs">
                <span className="font-bold text-foreground">{chg.reason}</span>
                <p className="text-muted text-[11px] mt-0.5">
                  Category: <span className="font-semibold text-foreground">{chg.category}</span> • Before: <em>{chg.before_value}</em> → After: <strong>{chg.after_value}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discomfort Reports on this day (if any) */}
      {dayDiscomforts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Discomfort Logged on this Day</span>
          </div>
          <div className="space-y-2">
            {dayDiscomforts.map((disc) => (
              <div key={disc.id} className="text-xs bg-white p-3 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    Symptoms: {disc.symptoms.join(', ')}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[11px]">
                    Severity: {disc.severity}/10
                  </span>
                </div>
                {disc.notes && <p className="text-muted text-[11px] mt-1">{disc.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Four Pillars Plan: Interactive Checklist with Real-Time Diet & Plan Adaptation */}
      <TodayChecklist
        patientId={plan.patient_id}
        dayOffset={plan.day_offset}
        onEventSaved={onEventSaved}
      />
    </div>
  );
};
