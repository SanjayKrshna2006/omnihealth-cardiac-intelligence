'use client';

import { eventPipeline, PlanItem } from '@/lib/services/event-pipeline';
import { evaluateVitalCheck, simplifyMealName } from '@/lib/services/patient-friendly';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  HeartPulse,
  Pill,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TodayChecklistProps {
  patientId: string;
  dayOffset: number;
  onEventSaved?: (msg?: string) => void;
}

type CategoryTab = 'all' | 'meal' | 'workout' | 'medicine' | 'check';

export const TodayChecklist: React.FC<TodayChecklistProps> = ({
  patientId,
  dayOffset,
  onEventSaved,
}) => {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [skipModalItem, setSkipModalItem] = useState<PlanItem | null>(null);
  const [selectedSkipReason, setSelectedSkipReason] = useState<string>('Felt sick / nausea');
  const [skipNote, setSkipNote] = useState<string>('');
  const [readingInputs, setReadingInputs] = useState<Record<string, string>>({});
  const [editingCheckId, setEditingCheckId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const loadItems = () => {
    const list = eventPipeline.getTodayItems(patientId, dayOffset);
    setItems([...list]);
  };

  useEffect(() => {
    loadItems();
    const unsubscribe = eventPipeline.subscribe(() => {
      loadItems();
    });
    return unsubscribe;
  }, [patientId, dayOffset]);

  const meals = items.filter((it) => it.category === 'meal');
  const workouts = items.filter((it) => it.category === 'workout');
  const medicines = items.filter((it) => it.category === 'medicine');
  const checks = items.filter((it) => it.category === 'check');

  // Adherence calculations
  const totalItems = items.length;
  const doneItems = items.filter((it) => it.status === 'done').length;
  const skippedItems = items.filter((it) => it.status === 'skipped').length;
  const adherencePct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleMarkDone = (item: PlanItem) => {
    const res = eventPipeline.recordEvent({
      patientId,
      planItemId: item.id,
      status: 'done',
    });
    if (res.success) {
      showToast(`✓ Marked "${item.title}" as completed.`);
      onEventSaved?.();
    }
  };

  const handleOpenSkipModal = (item: PlanItem) => {
    setSkipModalItem(item);
    setSelectedSkipReason(
      item.category === 'meal'
        ? 'Felt sick / nausea'
        : item.category === 'workout'
          ? 'Too fatigued / tired'
          : 'Doctor advised hold'
    );
    setSkipNote('');
  };

  const handleConfirmSkip = () => {
    if (!skipModalItem) return;

    const res = eventPipeline.recordEvent({
      patientId,
      planItemId: skipModalItem.id,
      status: 'skipped',
      skipReason: selectedSkipReason,
      note: skipNote,
    });

    if (res.success) {
      if (res.adaptedCategory === 'meals') {
        showToast(
          `✨ Diet Adapted: Upcoming meals adjusted to soothing, easily digestible dishes following skipped meal.`
        );
      } else if (res.adaptedCategory === 'workout') {
        showToast(`✨ Workout Eased: Activity duration stepped down to gentle 5-minute pacing.`);
      } else {
        showToast(`Marked "${skipModalItem.title}" as skipped.`);
      }
      onEventSaved?.(res.changeNote);
    }

    setSkipModalItem(null);
  };

  const handleSaveReading = (item: PlanItem, presetVal?: string) => {
    const val = presetVal !== undefined ? presetVal : readingInputs[item.id];
    if (!val || String(val).trim().length === 0) return;

    const trimmed = String(val).trim();
    const res = eventPipeline.recordEvent({
      patientId,
      planItemId: item.id,
      status: 'done',
      value: trimmed,
    });

    if (res.success) {
      const evalRes = evaluateVitalCheck(item.title, trimmed);
      if (evalRes.isAlert) {
        showToast(
          `🚨 High Alert: Reading (${trimmed}) is outside normal range! Please rest and follow safety precautions.`
        );
      } else {
        showToast(`✓ Saved reading "${trimmed}" for ${item.title}. Safe & within normal range!`);
      }
      setEditingCheckId(null);
      onEventSaved?.(res.changeNote);
    }
  };

  const hasMealAdaptation = meals.some((m) => m.swapped);

  // Category counts
  const getCatDone = (list: PlanItem[]) => list.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-3.5">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl shadow-xs text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* COMPACT STICKY FILTER & ADHERENCE BAR */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Adherence Mini Badge & Progress Bar */}
        <div className="flex items-center gap-2.5 px-1.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
            {adherencePct}%
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <span>{doneItems}/{totalItems} Tasks Done</span>
              {skippedItems > 0 && (
                <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded text-[9px]">
                  {skippedItems} skipped
                </span>
              )}
            </div>
            {/* Slim progress bar */}
            <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${adherencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Reduces scrolling directly) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Tasks</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalItems}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('meal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'meal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>🍽️ Meals</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'meal' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800'
            }`}>
              {getCatDone(meals)}/{meals.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('workout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'workout'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>🏃 Rehab</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'workout' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-800'
            }`}>
              {getCatDone(workouts)}/{workouts.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('medicine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'medicine'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>💊 Meds</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'medicine' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
            }`}>
              {getCatDone(medicines)}/{medicines.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('check')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'check'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>🩺 Vitals</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'check' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800'
            }`}>
              {getCatDone(checks)}/{checks.length}
            </span>
          </button>
        </div>
      </div>

      {/* COMPACT CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* =========================================================================
            1. PRESCRIBED MEALS (COMPACT)
            ========================================================================= */}
        {(selectedCategory === 'all' || selectedCategory === 'meal') && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Prescribed Meals
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">({meals.length})</span>
              </div>
              {hasMealAdaptation ? (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Gentle Diet
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                  Cardiac Diet
                </span>
              )}
            </div>

            <div className="space-y-2">
              {meals.map((meal, mIdx) => {
                const isDone = meal.status === 'done';
                const isSkipped = meal.status === 'skipped';
                const simplified = simplifyMealName(meal.title, mIdx);
                const isExpanded = expandedMealId === meal.id;

                return (
                  <div
                    key={meal.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      meal.swapped
                        ? 'border-amber-300 bg-amber-50/50'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : isSkipped
                        ? 'border-slate-200 bg-slate-50/80 opacity-75'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base shrink-0">{simplified.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-xs truncate">
                              {simplified.simpleName}
                            </span>
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded border border-blue-200 shrink-0">
                              {simplified.slotLabel}
                            </span>
                            {meal.swapped && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded border border-amber-300 shrink-0">
                                ✨ Softer Food
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {meal.scheduled_time}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {simplified.easyDescription}
                          </p>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="shrink-0 flex items-center gap-1">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                            <Check className="w-3 h-3" /> Done
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]">
                            <X className="w-3 h-3" /> Skipped
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMarkDone(meal)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3 h-3" /> Done
                            </button>
                            <button
                              onClick={() => handleOpenSkipModal(meal)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] transition-colors"
                            >
                              Skip
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
                          title="View clinical breakdown"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Clinical Protocol */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        <div><strong className="text-slate-700">Clinical Protocol:</strong> {meal.title}</div>
                        <div><strong className="text-slate-700">Nutritional Rationale:</strong> {meal.details}</div>
                        {isSkipped && (
                          <div className="text-amber-800 font-semibold bg-amber-50 p-1.5 rounded">
                            Reason: {meal.skip_reason || 'Skipped'} — Diet adjusted to gentle foods.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            2. PHYSICAL REHABILITATION (COMPACT)
            ========================================================================= */}
        {(selectedCategory === 'all' || selectedCategory === 'workout') && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Physical Rehabilitation
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">({workouts.length})</span>
              </div>
              <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Guided Protocol
              </span>
            </div>

            <div className="space-y-2">
              {workouts.map((work) => {
                const isDone = work.status === 'done';
                const isSkipped = work.status === 'skipped';

                return (
                  <div
                    key={work.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : isSkipped
                        ? 'border-slate-200 bg-slate-50/80 opacity-75'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {work.title}
                          </span>
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-200 shrink-0">
                            Rehab
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{work.details}</p>
                        {isSkipped && (
                          <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                            Reason: {work.skip_reason || 'Skipped'} — Workload stepped down.
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                            <Check className="w-3 h-3" /> Done
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]">
                            <X className="w-3 h-3" /> Skipped
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMarkDone(work)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3 h-3" /> Done
                            </button>
                            <button
                              onClick={() => handleOpenSkipModal(work)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] transition-colors"
                            >
                              Skip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            3. DOCTOR MEDICATIONS (COMPACT)
            ========================================================================= */}
        {(selectedCategory === 'all' || selectedCategory === 'medicine') && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Confirmed Medications
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">({medicines.length})</span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                Physician Directed
              </span>
            </div>

            <div className="space-y-2">
              {medicines.map((med) => {
                const isDone = med.status === 'done';
                const isSkipped = med.status === 'skipped';
                const isStop = med.details?.toLowerCase().includes('stop');

                return (
                  <div
                    key={med.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                      isStop
                        ? 'border-rose-200 bg-rose-50/40'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : isSkipped
                        ? 'border-slate-200 bg-slate-50/80 opacity-75'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs truncate">{med.title}</span>
                        {med.dose && <span className="text-[10px] text-slate-500 font-mono">({med.dose})</span>}
                        {isStop ? (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[9px] font-bold rounded shrink-0">
                            STOP
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded shrink-0">
                            CONTINUE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">{med.details}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                          <Check className="w-3 h-3" /> Taken
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]">
                          <X className="w-3 h-3" /> Skipped
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMarkDone(med)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" /> Taken
                          </button>
                          <button
                            onClick={() => handleOpenSkipModal(med)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. REQUIRED VITALS & CHECKS (COMPACT)
            ========================================================================= */}
        {(selectedCategory === 'all' || selectedCategory === 'check') && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Vitals &amp; Safety Checks
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">({checks.length})</span>
              </div>
              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Heart Safety Limits
              </span>
            </div>

            <div className="space-y-2">
              {checks.map((chk) => {
                const isDone = chk.status === 'done';
                const evalResult = evaluateVitalCheck(chk.title, chk.value);
                const isEditing = editingCheckId === chk.id || (!chk.value && !isDone);
                const isAlert = evalResult.isAlert;

                const isBP = chk.title.toLowerCase().includes('pressure') || chk.title.toLowerCase().includes('bp');
                const isSugar = chk.title.toLowerCase().includes('glucose') || chk.title.toLowerCase().includes('sugar');
                const isWeight = chk.title.toLowerCase().includes('weight');

                return (
                  <div
                    key={chk.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      isAlert
                        ? 'border-rose-400 bg-rose-50/90 shadow-xs ring-1 ring-rose-300'
                        : chk.value
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs">{chk.title}</span>
                          {chk.value && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${
                                isAlert
                                  ? 'bg-rose-200 text-rose-950 border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {chk.value}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            (Target: {evalResult.normalRangeText.replace('Normal: ', '')})
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {chk.value && !isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.8 font-bold rounded-lg text-[10px] border ${
                                isAlert
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {isAlert ? <AlertTriangle size={11} className="text-rose-600" /> : <Check size={11} className="text-emerald-600" />}
                              {isAlert ? 'Alert' : 'Normal'}
                            </span>
                            <button
                              onClick={() => {
                                setReadingInputs({
                                  ...readingInputs,
                                  [chk.id]: String(chk.value || ''),
                                });
                                setEditingCheckId(chk.id);
                              }}
                              className="px-2 py-0.8 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[10px] flex items-center gap-1"
                              title="Retest"
                            >
                              <Edit2 size={10} /> Retest
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            <input
                              type="text"
                              placeholder={
                                isBP ? '120/80' : isSugar ? '110' : isWeight ? '81.0' : 'Enter'
                              }
                              value={
                                readingInputs[chk.id] !== undefined
                                  ? readingInputs[chk.id]
                                  : chk.value
                                  ? String(chk.value)
                                  : ''
                              }
                              onChange={(e) =>
                                setReadingInputs({ ...readingInputs, [chk.id]: e.target.value })
                              }
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-20 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                            />
                            <button
                              onClick={() => handleSaveReading(chk)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-colors shadow-2xs"
                            >
                              Save
                            </button>
                            {chk.value && (
                              <button
                                onClick={() => setEditingCheckId(null)}
                                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 text-[10px]"
                              >
                                Cancel
                              </button>
                            )}

                            {/* Preset Buttons for 1-Click Fast Check */}
                            <div className="flex items-center gap-1">
                              {isBP && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '120/80')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold"
                                  >
                                    120/80
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '148/94')}
                                    className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold"
                                  >
                                    148/94 🚨
                                  </button>
                                </>
                              )}
                              {isSugar && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '105 mg/dL')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold"
                                  >
                                    105
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '165 mg/dL')}
                                    className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold"
                                  >
                                    165 🚨
                                  </button>
                                </>
                              )}
                              {isWeight && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '81.2 kg')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold"
                                  >
                                    81.2
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReading(chk, '83.5 kg')}
                                    className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold"
                                  >
                                    83.5 🚨
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RED ALERT WARNING BOX FOR OUT-OF-RANGE READINGS */}
                    {isAlert && chk.value && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-100/90 border border-rose-300 text-rose-950 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                          <span>🚨 Alert: {evalResult.alertMessage}</span>
                        </div>
                        <div className="text-[10px] text-rose-900 font-semibold pl-4">
                          💡 <strong>Advice:</strong> {evalResult.adviceText}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* REASON MODAL FOR SKIPPING */}
      {skipModalItem && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl border border-slate-200 animate-scaleIn my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Skip {skipModalItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSkipModalItem(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <p className="text-slate-500 text-[11px]">
                CareLoop's closed-loop engine will automatically adapt your upcoming recovery plan once you log this skip.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-[11px]">Reason:</label>
                <div className="grid grid-cols-1 gap-1">
                  {(skipModalItem.category === 'meal'
                    ? [
                        'Felt sick / nausea',
                        'Loss of appetite',
                        'Incision pain during eating',
                        'Doctor advised dietary hold',
                      ]
                    : skipModalItem.category === 'workout'
                      ? [
                          'Too fatigued / tired',
                          'Incision pain / discomfort',
                          'Dizziness / lightheadedness',
                          'Shortness of breath',
                        ]
                      : [
                          'Doctor advised temporary hold',
                          'Prescription delay / refill needed',
                          'Mild stomach discomfort after pill',
                        ]
                  ).map((r) => (
                    <label
                      key={r}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors text-[11px] ${
                        selectedSkipReason === r
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="skip_reason"
                        value={r}
                        checked={selectedSkipReason === r}
                        onChange={() => setSelectedSkipReason(r)}
                        className="accent-blue-600"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-[11px]">
                  Optional Note:
                </label>
                <textarea
                  rows={2}
                  value={skipNote}
                  onChange={(e) => setSkipNote(e.target.value)}
                  placeholder="Notes for clinical team..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSkipModalItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
              >
                Confirm Skip &amp; Adapt Plan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
