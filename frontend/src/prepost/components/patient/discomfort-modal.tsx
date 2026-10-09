'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert, Send } from 'lucide-react';
import type { DiscomfortReport } from '@/lib/types/database';

interface DiscomfortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Omit<DiscomfortReport, 'id' | 'created_at'>) => void;
  dayOffset: number;
  currentDate: string;
  patientId: string;
}

const AVAILABLE_SYMPTOMS = [
  { id: 'pain', label: 'Pain' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'breathlessness', label: 'Breathlessness' },
  { id: 'swelling', label: 'Swelling' },
  { id: 'fever', label: 'Fever / Chills' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'poor_sleep', label: 'Poor Sleep' },
  { id: 'wound_redness', label: 'Wound Redness / Discharge' },
  { id: 'appetite_loss', label: 'Appetite Loss' },
  { id: 'palpitations', label: 'Palpitations' },
  { id: 'other', label: 'Other Symptom' },
];

export const DiscomfortModal: React.FC<DiscomfortModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dayOffset,
  currentDate,
  patientId,
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number>(3);
  const [location, setLocation] = useState('');
  const [sinceWhen, setSinceWhen] = useState('Today morning');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom.');
      return;
    }

    onSubmit({
      patient_id: patientId,
      day_offset: dayOffset,
      date: currentDate,
      symptoms: selectedSymptoms,
      severity,
      location: location || 'General',
      since_when: sinceWhen,
      notes: notes || undefined,
    });

    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl my-auto max-h-[88vh] overflow-y-auto animate-scaleIn">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Report Discomfort</h3>
              <p className="text-xs text-slate-500">Adapts your meals, workout, and checks automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symptom Multi-Select */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              What symptoms are you experiencing? (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SYMPTOMS.map((sym) => {
                const active = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {sym.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">Severity Level (0 to 10):</span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  severity >= 8
                    ? 'bg-red-100 text-red-800'
                    : severity >= 4
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {severity} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>0 (Mild)</span>
              <span>5 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* Location & Since When */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Body Location</label>
              <input
                type="text"
                placeholder="e.g. Incision area, stomach, leg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Since When?</label>
              <input
                type="text"
                placeholder="e.g. 2 hours ago, since breakfast"
                value={sinceWhen}
                onChange={(e) => setSinceWhen(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="text-xs">
            <label className="block font-bold text-slate-800 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              placeholder="Any details to help adapt your plan (e.g. occurred after taking pill or walk)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Discomfort &amp; Adapt Plan</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
