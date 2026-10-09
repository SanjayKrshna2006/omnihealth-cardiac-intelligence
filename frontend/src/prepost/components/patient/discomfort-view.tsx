'use client';

import React from 'react';
import type { DiscomfortReport, PlanChangeRecord } from '@/lib/types/database';
import { ShieldAlert, TrendingDown, AlertCircle, Sparkles, MessageSquare, HeartHandshake } from 'lucide-react';

interface DiscomfortViewProps {
  discomforts: DiscomfortReport[];
  changes: PlanChangeRecord[];
  onOpenReportModal: () => void;
}

export const DiscomfortView: React.FC<DiscomfortViewProps> = ({
  discomforts,
  changes,
  onOpenReportModal,
}) => {
  // Aggregate symptom frequency
  const symptomCounts: Record<string, number> = {};
  discomforts.forEach((d) => {
    d.symptoms.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-foreground">Discomfort & Symptom Analysis</h2>
          </div>
          <p className="text-xs text-muted">
            Tracking patterns across your recovery journey to automatically adapt nutrition, rehab, and rest.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
        >
          + Report New Discomfort
        </button>
      </div>

      {discomforts.length === 0 ? (
        <div className="text-center py-12 text-muted text-xs bg-surface/50 rounded-xl border border-dashed border-border">
          <HeartHandshake className="w-6 h-6 mx-auto text-muted/60 mb-2" />
          <span>No symptoms or discomfort logged yet. You can report discomfort anytime to adapt your recovery plan.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface rounded-xl border border-border">
              <span className="text-[11px] font-bold text-muted uppercase">Total Reports</span>
              <span className="text-2xl font-extrabold text-foreground block mt-1">
                {discomforts.length}
              </span>
              <span className="text-[11px] text-muted">Logged across journey</span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border">
              <span className="text-[11px] font-bold text-muted uppercase">Most Frequent</span>
              <span className="text-xl font-extrabold text-rose-600 block mt-1 capitalize truncate">
                {sortedSymptoms[0] ? `${sortedSymptoms[0][0]} (${sortedSymptoms[0][1]}x)` : 'None'}
              </span>
              <span className="text-[11px] text-muted">Identified pattern</span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border">
              <span className="text-[11px] font-bold text-muted uppercase">Plan Adaptations</span>
              <span className="text-2xl font-extrabold text-accent block mt-1">
                {changes.length}
              </span>
              <span className="text-[11px] text-muted">Auto-tailored for comfort</span>
            </div>
          </div>

          {/* Clinical Pattern Insights ('Tell your doctor' Section) */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Questions & Patterns to Discuss with Your Doctor</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              <strong>Notice:</strong> CareLoop describes observed patterns only and never diagnoses or prescribes.
              Possible links to discuss with your surgical team at your next follow-up:
            </p>
            <ul className="text-xs text-foreground space-y-1 pl-4 list-disc">
              {sortedSymptoms.slice(0, 3).map(([sym, count]) => (
                <li key={sym}>
                  Observed {sym} on {count} {count === 1 ? 'day' : 'days'}. Possible link to medication or activity pacing; discuss with your doctor.
                </li>
              ))}
            </ul>
          </div>

          {/* Chronological Discomfort Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Discomfort Log Entries
            </h3>
            <div className="divide-y divide-border border border-border rounded-xl bg-white overflow-hidden">
              {discomforts.map((d) => (
                <div key={d.id} className="p-4 text-xs space-y-1 hover:bg-surface/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground capitalize">
                      Day {d.day_offset >= 0 ? `+${d.day_offset}` : d.day_offset}: {d.symptoms.join(', ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      d.severity >= 7 ? 'bg-rose-100 text-rose-800' : 'bg-surface text-foreground border border-border'
                    }`}>
                      Severity: {d.severity}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Location: <strong>{d.location || 'General'}</strong> • Since: {d.since_when || 'N/A'}
                  </p>
                  {d.notes && <p className="text-xs text-foreground mt-1 italic">"{d.notes}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
