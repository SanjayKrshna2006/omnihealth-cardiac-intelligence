'use client';

import React, { useState } from 'react';
import type { PlanChangeRecord } from '@/lib/types/database';
import { Sparkles, Filter, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ChangeLogViewProps {
  changes: PlanChangeRecord[];
}

export const ChangeLogView: React.FC<ChangeLogViewProps> = ({ changes }) => {
  const [filterCat, setFilterCat] = useState<string>('all');

  const filteredChanges = filterCat === 'all'
    ? changes
    : changes.filter((c) => c.category === filterCat);

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h2 className="text-lg font-bold text-foreground">Live Plan Change Log</h2>
          </div>
          <p className="text-xs text-muted">
            Transparent record of every dynamic adaptation made to your recovery journey with supporting factors.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <span className="font-semibold text-muted">Filter:</span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Categories ({changes.length})</option>
            <option value="meals">Meals</option>
            <option value="workout">Physical Rehab</option>
            <option value="checks">Checks & Telemetry</option>
            <option value="plan_length">Plan Duration</option>
          </select>
        </div>
      </div>

      {/* Changes List */}
      {filteredChanges.length === 0 ? (
        <div className="text-center py-12 text-muted text-xs bg-surface/50 rounded-xl border border-dashed border-border">
          <Sparkles className="w-6 h-6 mx-auto text-muted/60 mb-2" />
          <span>No plan adaptations recorded for this category yet. Your live plan matches the baseline forecast.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChanges.map((change) => (
            <div
              key={change.id}
              className="p-5 rounded-xl border border-border bg-surface/30 space-y-3 transition-colors hover:border-accent/40"
            >
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-accent-light text-accent text-xs font-bold rounded uppercase">
                    Day {change.day_number}
                  </span>
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {change.category} Adaptation
                  </span>
                  <span className="text-xs text-muted">• {change.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-white border border-border rounded text-muted">
                    Source: {change.source.toUpperCase()}
                  </span>
                  {change.reverted && (
                    <span className="text-[11px] px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded">
                      Reverted by Doctor
                    </span>
                  )}
                </div>
              </div>

              {/* Rationale Statement */}
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {change.reason}
              </p>

              {/* Before vs After Pill */}
              <div className="p-3 bg-white rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-muted uppercase block">Before:</span>
                  <span className="text-muted line-through">{change.before_value}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-accent shrink-0 hidden sm:block" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-accent uppercase block">Now (Live):</span>
                  <span className="font-bold text-foreground">{change.after_value}</span>
                </div>
              </div>

              {/* Factors & Supporting Logs */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted pt-1 border-t border-border/60">
                <span className="font-semibold text-foreground">Triggering Factors:</span>
                {change.factors.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-border rounded-md text-foreground">
                    • {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
