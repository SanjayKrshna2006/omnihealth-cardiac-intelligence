'use client';

import React from 'react';
import { AlertCircle, PhoneCall, Stethoscope, ArrowLeft } from 'lucide-react';

interface EmergencyViewProps {
  reason: string;
  onDismiss: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ reason, onDismiss }) => {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border-2 border-status-emergency p-8 space-y-6 shadow-sm">
        {/* Red Alert Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-status-emergency border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" />
          Safety Check Alert: Adaptation Paused
        </div>

        <h1 className="text-3xl font-extrabold text-foreground leading-tight">
          Please contact your healthcare provider immediately.
        </h1>

        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-muted uppercase">Clinical Flag Detected:</span>
          <p className="text-sm font-semibold text-status-emergency">{reason}</p>
        </div>

        <p className="text-foreground text-sm leading-relaxed">
          Your daily physical therapy and workout adaptation have been paused. Do not attempt further physical exertion. Please follow your hospital discharge emergency instructions.
        </p>

        {/* Emergency Call Actions */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <a
            href="tel:911"
            className="flex items-center justify-center gap-3 bg-status-emergency hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors text-center"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Emergency (911 / 112)</span>
          </a>

          <a
            href="tel:15550001122"
            className="flex items-center justify-center gap-3 bg-white hover:bg-surface border border-accent text-accent font-bold py-3.5 px-4 rounded-xl text-sm transition-colors text-center"
          >
            <Stethoscope className="w-5 h-5" />
            <span>Call Dr. Arun Kumar</span>
          </a>
        </div>

        {/* What Happens Next */}
        <div className="pt-4 border-t border-border space-y-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">What happens next:</h4>
          <ul className="text-xs text-muted space-y-1 list-disc pl-4">
            <li>Your cardiologist (Dr. Arun Kumar) and clinical care team have been alerted per your recorded consent.</li>
            <li>Your daily routine will remain safely paused until evaluated by your medical team.</li>
          </ul>
        </div>

        {/* Dismiss / Return button */}
        <div className="pt-4 flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-xs text-muted hover:text-foreground font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Daily Overview (Once contact made)</span>
          </button>
        </div>

        <p className="text-[11px] text-muted text-center pt-2 border-t border-border">
          <strong>Notice:</strong> CareLoop does not replace your physician or emergency response services.
        </p>
      </div>
    </div>
  );
};
