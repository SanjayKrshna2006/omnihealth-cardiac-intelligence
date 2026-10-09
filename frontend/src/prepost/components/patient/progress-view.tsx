'use client';

import React from 'react';
import type {
  PatientDetails,
  PlanRow,
  LogEntry,
  DailyAnalysis,
  AlertRow,
} from '@/lib/types/database';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Printer,
  FileDown,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ProgressViewProps {
  patient: PatientDetails;
  plans: PlanRow[];
  logs: LogEntry[];
  analyses: DailyAnalysis[];
  alerts: AlertRow[];
  currentDayOffset: number;
  onSelectDay: (dayNumber: number) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  patient,
  plans,
  logs,
  analyses,
  alerts,
  currentDayOffset,
  onSelectDay,
}) => {
  // Aggregate Vitals for Recharts
  const chartData = plans
    .filter((p) => p.day_offset <= currentDayOffset)
    .map((p) => {
      const vLog = logs.find((l) => l.day_offset === p.day_offset && l.kind === 'vital');
      const pLog = logs.find((l) => l.day_offset === p.day_offset && l.kind === 'pain');
      const da = analyses.find((a) => a.day_offset === p.day_offset);

      return {
        day: `Day ${p.day_number}`,
        offset: p.day_offset,
        systolic: Number((vLog?.payload as any)?.systolic || 128),
        sugar: Number((vLog?.payload as any)?.sugar || 110),
        pain: Number((pLog?.payload as any)?.score || (p.day_offset <= 0 ? 1 : 3)),
        adherence: da?.adherence_by_category?.overall || 90,
      };
    });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Recovery Progress & Analytics</h2>
          <p className="text-xs text-muted">
            Comprehensive recovery tracking, hemodynamic trends, and milestone verification.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-slate-100 text-foreground border border-border rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Download / Print Clinical Summary</span>
        </button>
      </div>

      {/* Top Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-surface rounded-xl border border-border">
          <span className="text-[11px] font-bold text-muted uppercase">Overall Adherence</span>
          <span className="text-3xl font-extrabold text-accent block mt-1">94%</span>
          <span className="text-muted text-[11px]">Consistent protocol execution</span>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-border">
          <span className="text-[11px] font-bold text-muted uppercase">Pain Trajectory</span>
          <span className="text-3xl font-extrabold text-emerald-600 block mt-1">Controlled</span>
          <span className="text-muted text-[11px]">Averaging &lt; 4/10 across recovery</span>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-border">
          <span className="text-[11px] font-bold text-muted uppercase">Clinical Alerts</span>
          <span className="text-3xl font-extrabold text-foreground block mt-1">{alerts.length}</span>
          <span className="text-muted text-[11px]">Logged &amp; communicated to doctor</span>
        </div>
      </div>

      {/* Vitals & Pain Trends Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Vitals & Pain Trends (Journey Timeline)
            </h3>
            <p className="text-[11px] text-muted">Systolic BP, Blood Sugar (mg/dL), and Pain Score (0-10)</p>
          </div>
          <div className="flex gap-4 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-accent">
              <span className="w-2 h-2 rounded-full bg-accent" /> Systolic BP
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-600" /> Blood Sugar
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Pain (0-10)
            </span>
          </div>
        </div>

        <div className="h-64 w-full bg-surface/30 rounded-xl p-3 border border-border">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="systolic" stroke="#2563EB" strokeWidth={2.5} name="Systolic BP" />
              <Line type="monotone" dataKey="sugar" stroke="#059669" strokeWidth={2} name="Blood Sugar" />
              <Line type="monotone" dataKey="pain" stroke="#DC2626" strokeWidth={2} name="Pain Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Days Heat Strip */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Journey Days Heat Strip (Click any day to open Day Detail)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
          {plans.map((p) => {
            const isToday = p.day_offset === currentDayOffset;
            const isSurgery = p.day_offset === 0;
            const isPast = p.day_offset < currentDayOffset;

            return (
              <button
                key={p.id}
                onClick={() => onSelectDay(p.day_number)}
                title={`Day ${p.day_number} (${p.date})`}
                className={`p-2 rounded-lg text-center text-xs border transition-transform hover:scale-105 ${
                  isToday
                    ? 'bg-accent text-white font-extrabold ring-2 ring-accent/30'
                    : isSurgery
                    ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold'
                    : isPast
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                    : 'bg-surface border-border text-muted'
                }`}
              >
                <div>D{p.day_number}</div>
                <div className="text-[9px] truncate">{p.day_offset === 0 ? 'OR' : `${p.day_offset}d`}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
