'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, Utensils, Pill, Smile, AlertCircle } from 'lucide-react';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: 'before' | 'after';
  onSaveLog: (kind: string, data: Record<string, unknown>) => void;
  onTriggerEmergency: (reason: string) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  stage,
  onSaveLog,
  onTriggerEmergency,
}) => {
  const [tab, setTab] = useState<'vitals' | 'pain' | 'meal' | 'workout' | 'meds'>('vitals');

  // Form states
  const [systolic, setSystolic] = useState('124');
  const [diastolic, setDiastolic] = useState('80');
  const [sugar, setSugar] = useState('105');
  const [pain, setPain] = useState(2);
  const [mealStatus, setMealStatus] = useState<'eaten' | 'skipped'>('eaten');
  const [workoutStatus, setWorkoutStatus] = useState<'done' | 'skipped'>('done');
  const [workoutMins, setWorkoutMins] = useState('15');
  const [medStatus, setMedStatus] = useState<'taken' | 'missed'>('taken');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'vitals') {
      const sys = parseInt(systolic, 10);
      const sug = parseInt(sugar, 10);
      if (sug < 70) {
        onTriggerEmergency(`Blood sugar reading (${sug} mg/dL) is dangerously below minimum (70 mg/dL).`);
        onClose();
        return;
      }
      onSaveLog('vital', { systolic: sys, diastolic: parseInt(diastolic, 10), sugar: sug });
    } else if (tab === 'pain') {
      if (pain >= 8) {
        onTriggerEmergency(`Pain score ${pain}/10 is at or above the emergency threshold.`);
        onClose();
        return;
      }
      onSaveLog('pain', { score: pain });
    } else if (tab === 'meal') {
      onSaveLog('meal', { status: mealStatus });
    } else if (tab === 'workout') {
      onSaveLog('workout', { status: workoutStatus, durationMinutes: parseInt(workoutMins, 10) });
    } else if (tab === 'meds') {
      onSaveLog('medicine', { status: medStatus });
    }

    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-extrabold text-sm text-slate-900">Manual Health Log</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Category Tabs */}
        <div className="flex border-b border-border bg-surface text-xs font-semibold">
          <button
            onClick={() => setTab('vitals')}
            className={`flex-1 py-3 border-b-2 ${
              tab === 'vitals' ? 'border-accent text-accent bg-white' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Vitals
          </button>

          {stage === 'after' && (
            <button
              onClick={() => setTab('pain')}
              className={`flex-1 py-3 border-b-2 ${
                tab === 'pain' ? 'border-accent text-accent bg-white' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Pain (0-10)
            </button>
          )}

          <button
            onClick={() => setTab('meal')}
            className={`flex-1 py-3 border-b-2 ${
              tab === 'meal' ? 'border-accent text-accent bg-white' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Meals
          </button>

          <button
            onClick={() => setTab('workout')}
            className={`flex-1 py-3 border-b-2 ${
              tab === 'workout' ? 'border-accent text-accent bg-white' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Exercise
          </button>

          <button
            onClick={() => setTab('meds')}
            className={`flex-1 py-3 border-b-2 ${
              tab === 'meds' ? 'border-accent text-accent bg-white' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Meds
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'vitals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                />
              </div>
            </div>
          )}

          {tab === 'pain' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Pain Score: <span className={pain >= 8 ? 'text-status-emergency font-bold' : 'text-accent'}>{pain} / 10</span>
                </label>
                <span className="text-xs text-muted">
                  {pain === 0 ? '😊 No Pain' : pain <= 3 ? '🙂 Mild' : pain <= 6 ? '😐 Moderate' : '😣 Severe'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                value={pain}
                onChange={(e) => setPain(parseInt(e.target.value, 10))}
                className="w-full accent-accent"
              />

              {pain >= 8 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-status-emergency flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Pain ≥ 8 triggers the clinical emergency safety protocol.</span>
                </div>
              )}
            </div>
          )}

          {tab === 'meal' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-foreground">Did you eat your prescribed heart-healthy meals?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMealStatus('eaten')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    mealStatus === 'eaten' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  Yes, Eaten
                </button>
                <button
                  type="button"
                  onClick={() => setMealStatus('skipped')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    mealStatus === 'skipped' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  Skipped One
                </button>
              </div>
            </div>
          )}

          {tab === 'workout' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-foreground">Rehab Walking & Breathing Routine</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWorkoutStatus('done')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    workoutStatus === 'done' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutStatus('skipped')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    workoutStatus === 'skipped' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  Skipped
                </button>
              </div>

              {workoutStatus === 'done' && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={workoutMins}
                    onChange={(e) => setWorkoutMins(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'meds' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-foreground">Prescribed Medications</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMedStatus('taken')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    medStatus === 'taken' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  All Taken
                </button>
                <button
                  type="button"
                  onClick={() => setMedStatus('missed')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold ${
                    medStatus === 'missed' ? 'border-accent bg-accent-light text-accent' : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  Missed Dose
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors mt-2 shadow-xs"
          >
            Save to Today's Record
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
