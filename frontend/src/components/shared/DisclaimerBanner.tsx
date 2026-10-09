import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold">RESEARCH PROTOTYPE:</strong> Vital Care is an experimental multimodal AI system for research and decision-support exploration. Not approved for clinical diagnosis or autonomous triage.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          Clinical Review Required
        </div>
      </div>
    </div>
  );
};
