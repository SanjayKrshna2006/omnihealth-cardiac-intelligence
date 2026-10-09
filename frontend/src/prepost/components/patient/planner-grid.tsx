'use client';

import type { PlanChangeRecord, PlanRow } from '@/lib/types/database';
import {
  simplifyCheck,
  simplifyMealName,
  simplifyMedicine,
  simplifyRehab,
} from '@/lib/services/patient-friendly';
import { Filter, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface PlannerGridProps {
  baselinePlans: PlanRow[];
  currentPlans: PlanRow[];
  changes: PlanChangeRecord[];
  currentDayOffset: number;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
  baselinePlans,
  currentPlans,
  changes,
  currentDayOffset,
}) => {
  const [viewMode, setViewMode] = useState<'current' | 'baseline' | 'compare'>('compare');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [onlyChanges, setOnlyChanges] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{
    dayNumber: number;
    dayOffset: number;
    category: string;
    catId: string;
    currentPlan: PlanRow;
    basePlan: PlanRow;
    isChanged: boolean;
    changeDetails?: PlanChangeRecord;
  } | null>(null);

  const categories = [
    { id: 'meals', name: 'Prescribed Meals', subtitle: 'Simple heart-healthy foods' },
    { id: 'workout', name: 'Physical Rehab', subtitle: 'Gentle walking & breathing' },
    { id: 'medicines', name: 'Medications', subtitle: 'Daily doctor prescriptions' },
    { id: 'checks', name: 'Vitals & Checks', subtitle: 'Normal safe target ranges' },
    { id: 'notes', name: 'Clinical Focus', subtitle: 'Daily recovery priority' },
  ];

  const filteredCategories =
    filterCategory === 'all' ? categories : categories.filter((c) => c.id === filterCategory);

  // Helper for text representation
  const getCategoryContent = (plan: PlanRow, catId: string): string => {
    switch (catId) {
      case 'meals':
        return plan.content.meals.map((m) => m.name).join('; ');
      case 'workout':
        return `${plan.content.workout.level.toUpperCase()} (${plan.content.workout.duration_min}m) - ${plan.content.workout.instructions[0] || ''}`;
      case 'medicines':
        return plan.content.medicines.map((m) => `${m.name} (${m.instruction})`).join('; ');
      case 'checks':
        return plan.content.checks.map((c) => c.name).join('; ');
      case 'notes':
        return plan.content.focus_note;
      default:
        return '';
    }
  };

  // Helper to determine if a specific meal differs
  const isMealDifferent = (currMeal: any, baseMeal: any) => {
    if (!currMeal || !baseMeal) return false;
    if (currMeal.swapped) return true;
    return currMeal.name.trim().toLowerCase() !== baseMeal.name.trim().toLowerCase();
  };

  // Helper to determine if a whole category differs
  const isCategoryChanged = (catId: string, currentPlan: PlanRow, basePlan: PlanRow): boolean => {
    if (catId === 'meals') {
      return currentPlan.content.meals.some((cm, idx) => {
        const bm = basePlan.content.meals[idx];
        return isMealDifferent(cm, bm);
      });
    }
    if (catId === 'workout') {
      return (
        currentPlan.content.workout.duration_min !== basePlan.content.workout.duration_min ||
        currentPlan.content.workout.level !== basePlan.content.workout.level
      );
    }
    if (catId === 'medicines') {
      return currentPlan.content.medicines.some((cm, idx) => {
        const bm = basePlan.content.medicines[idx];
        return !bm || cm.instruction !== bm.instruction;
      });
    }
    return getCategoryContent(currentPlan, catId) !== getCategoryContent(basePlan, catId);
  };

  // Senior-Friendly Rich Cell Renderer
  const renderCellBody = (
    currentPlan: PlanRow,
    basePlan: PlanRow,
    catId: string,
    mode: 'current' | 'baseline' | 'compare'
  ) => {
    const activePlan = mode === 'baseline' ? basePlan : currentPlan;

    if (catId === 'meals') {
      const activeMeals = activePlan.content.meals;
      const baseMeals = basePlan.content.meals;

      return (
        <div className="space-y-1.5 py-0.5">
          {activeMeals.map((m, idx) => {
            const bm = baseMeals[idx] || m;
            const isDiff = isMealDifferent(currentPlan.content.meals[idx], bm);
            const showAdaptedHighlight = isDiff && mode !== 'baseline';

            const activeSimplified = simplifyMealName(m.name, idx);
            const baseSimplified = simplifyMealName(bm.name, idx);

            return (
              <div
                key={idx}
                className={`p-1.5 rounded-lg border transition-all ${
                  showAdaptedHighlight
                    ? 'bg-amber-100/90 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0 leading-none mt-0.5">
                    {activeSimplified.icon}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-slate-900 text-[11px] block truncate">
                        {activeSimplified.simpleName}
                      </span>
                      {showAdaptedHighlight && (
                        <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 text-[8.5px] font-black rounded shrink-0 border border-amber-300">
                          ✨ Softer
                        </span>
                      )}
                    </div>

                    <span className="text-[9.5px] text-slate-500 font-medium block">
                      {activeSimplified.slotLabel} • Low Salt
                    </span>

                    {/* DIFFERENCE HINT IN COMPARE MODE */}
                    {mode === 'compare' && isDiff && (
                      <div className="mt-1 p-1 rounded bg-white border border-amber-300 text-[9px] text-amber-900 leading-tight">
                        <span className="font-bold text-slate-500">Baseline: </span>
                        <span className="line-through text-slate-600">
                          {baseSimplified.simpleName}
                        </span>
                        <span className="block text-[8.5px] text-amber-800 font-bold mt-0.5">
                          🔄 Swapped for soothing digestion
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (catId === 'workout') {
      const rehab = simplifyRehab(
        activePlan.content.workout.duration_min,
        activePlan.content.workout.level,
        activePlan.content.workout.instructions
      );
      const isDiff =
        currentPlan.content.workout.duration_min !== basePlan.content.workout.duration_min;
      const showAdaptedHighlight = isDiff && mode !== 'baseline';

      return (
        <div className="space-y-1 py-0.5 text-[11px]">
          <div
            className={`p-1.5 rounded-lg border ${
              showAdaptedHighlight
                ? 'bg-amber-100/90 border-amber-400 ring-1 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-slate-900 block truncate">🚶 {rehab.walkText}</span>
              {showAdaptedHighlight && (
                <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 text-[8.5px] font-black rounded shrink-0">
                  ✨ Eased
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">🫁 {rehab.breathingText}</span>

            {mode === 'compare' && isDiff && (
              <div className="mt-1 p-1 rounded bg-white border border-amber-300 text-[9px] text-amber-900">
                <span className="font-bold text-slate-500">Baseline: </span>
                <span className="line-through text-slate-600">
                  {basePlan.content.workout.duration_min} mins
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (catId === 'medicines') {
      return (
        <div className="space-y-1 py-0.5 text-[10.5px]">
          {activePlan.content.medicines.map((med, idx) => {
            const sm = simplifyMedicine(med.name, med.instruction);
            return (
              <div
                key={idx}
                className={`p-1 rounded-md border flex items-center justify-between gap-1 ${
                  sm.isPaused
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  <span className="shrink-0">{sm.icon}</span>
                  <span
                    className={`font-semibold truncate ${sm.isPaused ? 'line-through text-rose-700' : ''}`}
                  >
                    {med.name}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1 py-0.2 rounded shrink-0 ${
                    sm.isPaused ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {sm.badge}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (catId === 'checks') {
      return (
        <div className="space-y-1 py-0.5 text-[10.5px]">
          {activePlan.content.checks.map((chk, idx) => {
            const sc = simplifyCheck(chk.name, chk.target);
            return (
              <div
                key={idx}
                className="p-1 rounded-md bg-slate-50 border border-slate-200 space-y-0.5"
              >
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <span>{sc.icon}</span>
                  <span className="truncate">{sc.friendlyName}</span>
                </div>
                <span className="text-[9.5px] text-blue-700 font-semibold block truncate">
                  Target: {sc.normalRange}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (catId === 'notes') {
      return (
        <div className="p-1.5 rounded-md bg-blue-50/60 border border-blue-200 text-[11px] text-slate-800 leading-relaxed font-medium">
          "{activePlan.content.focus_note}"
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
      {/* Top Header & 3-Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Overall Surgery Journey Planner
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Senior-Friendly Foods &amp; Recovery
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare original baseline plan against live adapted plan with color-coded hints.
          </p>
        </div>

        {/* 3 View Mode Switch Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('baseline')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'baseline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original Baseline
            </button>
            <button
              onClick={() => setViewMode('current')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'current'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Live Plan
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'compare'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Compare Live vs Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Status Indicator Banner */}
      <div>
        {viewMode === 'baseline' ? (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span>
                <strong>Viewing Original Baseline:</strong> Standard protocol before any adaptations.
              </span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-blue-300 font-bold shrink-0">
              Unmodified Baseline
            </span>
          </div>
        ) : viewMode === 'current' ? (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span>
                <strong>Viewing Current Live Plan:</strong> Live plan updated dynamically. Softer meals adapted for you.
              </span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-300 font-bold shrink-0">
              Live Adapted
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span>
                <strong>Live vs Baseline Comparison:</strong> Amber cells highlight changes from your original baseline forecast.
              </span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-purple-300 font-bold shrink-0">
              Live Diff Active
            </span>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Filter Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none font-semibold"
          >
            <option value="all">All Categories (Meals, Rehab, Meds, Vitals)</option>
            <option value="meals">🥣 Prescribed Meals</option>
            <option value="workout">🚶 Physical Rehab</option>
            <option value="medicines">💊 Medications</option>
            <option value="checks">🩺 Vitals &amp; Checks</option>
            <option value="notes">📋 Clinical Focus</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 hover:text-slate-900">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={(e) => setOnlyChanges(e.target.checked)}
            className="w-3.5 h-3.5 accent-blue-600 rounded"
          />
          <span>Show only days with adaptations ({changes.length})</span>
        </label>
      </div>

      {/* Scrollable Matrix Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-bold text-slate-900 sticky left-0 bg-slate-50 z-10 w-48 border-r border-slate-200">
                Pillar Category
              </th>
              {currentPlans.map((plan) => {
                const isToday = plan.day_offset === currentDayOffset;
                const isSurgery = plan.day_offset === 0;
                return (
                  <th
                    key={plan.id}
                    className={`p-3 font-bold text-center min-w-[210px] border-r border-slate-200 text-[11px] ${
                      isToday
                        ? 'bg-blue-50 text-blue-700'
                        : isSurgery
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-sm">Day {plan.day_number}</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {plan.day_offset < 0
                        ? `${Math.abs(plan.day_offset)}d before surgery`
                        : plan.day_offset === 0
                          ? '⭐ Surgery Day'
                          : `+${plan.day_offset}d post-op`}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCategories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="p-3 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                  <div className="font-extrabold text-xs text-slate-900">{cat.name}</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">{cat.subtitle}</div>
                </td>
                {currentPlans.map((currentPlan, idx) => {
                  const basePlan = baselinePlans[idx] || currentPlan;
                  const isChanged = isCategoryChanged(cat.id, currentPlan, basePlan);

                  // Find relevant change record
                  const chg = changes.find(
                    (c) =>
                      c.day_offset === currentPlan.day_offset &&
                      (c.category === cat.id || c.category === 'plan_length')
                  );

                  return (
                    <td
                      key={currentPlan.id}
                      onClick={() =>
                        setSelectedCell({
                          dayNumber: currentPlan.day_number,
                          dayOffset: currentPlan.day_offset,
                          category: cat.name,
                          catId: cat.id,
                          currentPlan,
                          basePlan,
                          isChanged,
                          changeDetails: chg,
                        })
                      }
                      className={`p-2 border-r border-slate-200 cursor-pointer transition-colors align-top ${
                        isChanged && viewMode !== 'baseline'
                          ? 'bg-amber-50/70 hover:bg-amber-100/70'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {renderCellBody(currentPlan, basePlan, cat.id, viewMode)}

                      {/* BADGE SHOWING WHAT DIFFERED */}
                      {isChanged && viewMode !== 'baseline' && (
                        <div className="mt-1 pt-1 border-t border-amber-300/80 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-200 text-amber-950 text-[9px] font-extrabold rounded border border-amber-400">
                            <Sparkles className="w-2.5 h-2.5" />
                            {viewMode === 'compare' ? 'Differs from Baseline' : 'Adapted Softer'}
                          </span>
                          <span className="text-[9px] text-amber-800 font-bold">Tap to view</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Senior-Friendly Cell Detail Modal / Inspector with createPortal for 100% viewport centering */}
      {selectedCell && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl my-auto max-h-[85vh] flex flex-col space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
                  Day {selectedCell.dayNumber} (
                  {selectedCell.dayOffset < 0
                    ? `${Math.abs(selectedCell.dayOffset)} Days Before Surgery`
                    : selectedCell.dayOffset === 0
                      ? 'Surgery Day'
                      : `+${selectedCell.dayOffset} Days After Surgery`}
                  )
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedCell.category} Guide &amp; Comparison
                </h3>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with smooth internal scroll */}
            <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
              {selectedCell.catId === 'meals' ? (
                <div className="space-y-3.5">
                  {selectedCell.isChanged ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-2.5 text-amber-950">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h4 className="font-extrabold text-amber-950 text-xs">
                          Diet Adapted to Gentle Comfort Food
                        </h4>
                        <p className="text-[11px] text-amber-900 mt-0.5">
                          This day was adapted from the baseline forecast to softer, soothing dishes (such as porridge and khichdi) to ease digestion.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5">
                      <span className="text-2xl">🥣</span>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-xs">Simple Heart-Healthy Food Menu</h4>
                        <p className="text-[11px] text-emerald-800">
                          Prepared fresh with very low salt, high natural fiber, and soft texture for easy chewing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Meals List */}
                  <div className="space-y-2.5">
                    {selectedCell.currentPlan.content.meals.map((m, idx) => {
                      const bm = selectedCell.basePlan.content.meals[idx] || m;
                      const isDiff = isMealDifferent(m, bm);

                      const currSimple = simplifyMealName(m.name, idx);
                      const baseSimple = simplifyMealName(bm.name, idx);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition-all space-y-1.5 ${
                            isDiff
                              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{currSimple.icon}</span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {currSimple.simpleName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {currSimple.slotLabel}
                              </span>
                              {isDiff && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-400">
                                  ✨ Adapted Softer
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {currSimple.easyDescription}
                          </p>

                          {/* SHOW WHAT DIFFERED DIRECTLY IN MODAL */}
                          {isDiff && (
                            <div className="p-2 rounded-xl bg-white border border-amber-300 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                                <span>📌 Original Baseline was:</span>
                                <span className="line-through text-slate-500">
                                  {baseSimple.simpleName}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-amber-900 font-medium">
                                Swapped for tender khichdi/porridge to protect your stomach and keep you hydrated.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Helpful Eating Guidance for Seniors */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1 text-xs">
                    <span className="font-bold text-amber-900 block">💡 Easy Tips for Elders &amp; Family:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-950 text-[11px] font-medium leading-relaxed">
                      <li>Chew each bite slowly and take your time eating.</li>
                      <li>Drink small sips of warm water; avoid cold icy drinks.</li>
                      <li>Do not add extra table salt, pickles, or fried chips.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="block font-bold text-slate-500 uppercase text-[10px]">
                      Current Daily Details:
                    </span>
                    <p className="text-slate-900 font-semibold text-sm leading-relaxed">
                      {getCategoryContent(selectedCell.currentPlan, selectedCell.catId)}
                    </p>
                  </div>

                  {selectedCell.isChanged && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                      <span className="block font-bold text-amber-800 uppercase text-[10px]">
                        Original Baseline:
                      </span>
                      <p className="text-slate-800 font-medium">
                        {getCategoryContent(selectedCell.basePlan, selectedCell.catId)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

