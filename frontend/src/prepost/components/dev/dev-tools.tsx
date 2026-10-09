'use client';

import React from 'react';
import { FastForward, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

import type { PatientDetails } from '@/lib/types/database';

interface DevToolsProps {
  onAdvanceDay: () => void;
  onSimulateDayLogs: (quality: 'good' | 'partial' | 'bad') => void;
  onTriggerEmergency: () => void;
  currentDayOffset: number;
  patients?: PatientDetails[];
  activePatientId?: string;
  onSelectPatient?: (id: string) => void;
}

export const DevTools: React.FC<DevToolsProps> = ({
  onAdvanceDay,
  onSimulateDayLogs,
  onTriggerEmergency,
  currentDayOffset,
  patients,
  activePatientId,
  onSelectPatient,
}) => {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 text-xs">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-accent text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
            DEV-TOOLS DEMO
          </span>
          <span className="font-semibold text-slate-300">
            Current Offset: <strong className="text-white">{currentDayOffset >= 0 ? `+${currentDayOffset}` : currentDayOffset}d</strong>
          </span>

          {patients && patients.length > 0 && onSelectPatient && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-400 text-[11px]">Patient:</span>
              <select
                value={activePatientId}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.surgery_type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}
          <span className="text-[11px] text-slate-400 hidden md:inline">
            (Time-travel engine simulator • Isolated from production patient view)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAdvanceDay}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-accent" />
            <span>Advance 1 Day</span>
          </button>

          <button
            onClick={() => onSimulateDayLogs('good')}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simulate Good Day</span>
          </button>

          <button
            onClick={() => onSimulateDayLogs('partial')}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Partial Day (Skips)</span>
          </button>

          <button
            onClick={onTriggerEmergency}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Emergency (Pain 9)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
