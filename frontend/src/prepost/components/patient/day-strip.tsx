'use client';

import React, { useRef, useEffect } from 'react';
import type { PlanRow } from '@/lib/types/database';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayStripProps {
  plans: PlanRow[];
  selectedDayNumber: number;
  currentDayOffset: number;
  onSelectDay: (dayNumber: number) => void;
}

export const DayStrip: React.FC<DayStripProps> = ({
  plans,
  selectedDayNumber,
  currentDayOffset,
  onSelectDay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected day on load or selection
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDayNumber]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
            Surgery Journey Timeline
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            (Select any day to view logs or forecast)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Today
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Forecast
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              title="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              title="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Days Bar */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 select-none"
      >
        {plans.map((plan) => {
          const isSelected = plan.day_number === selectedDayNumber;
          const isToday = plan.day_offset === currentDayOffset;
          const isSurgery = plan.day_offset === 0;
          const isPast = plan.day_offset < currentDayOffset;
          const isFuture = plan.day_offset > currentDayOffset;

          const dateObj = new Date(plan.date);
          const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          let sublabel = '';
          if (plan.day_offset < 0) {
            sublabel = `${Math.abs(plan.day_offset)}d before`;
          } else if (plan.day_offset === 0) {
            sublabel = 'Surgery';
          } else {
            sublabel = `+${plan.day_offset}d post`;
          }

          return (
            <button
              key={plan.id}
              data-active={isSelected}
              onClick={() => onSelectDay(plan.day_number)}
              className={`flex-shrink-0 w-24 p-2 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : isSurgery
                  ? 'bg-purple-50/70 border-purple-200 hover:border-purple-300'
                  : isToday
                  ? 'bg-white border-blue-400 hover:bg-slate-50'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Top Row: Day Number + Status Indicator */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold ${isSelected ? 'text-blue-700' : isSurgery ? 'text-purple-700' : 'text-slate-800'}`}>
                  Day {plan.day_number}
                </span>

                {isSurgery ? (
                  <span className="text-[9px] bg-purple-600 text-white font-bold px-1 rounded uppercase leading-tight">
                    OR
                  </span>
                ) : isToday ? (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Today" />
                ) : isPast ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completed Day" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" title="Forecasted Day" />
                )}
              </div>

              {/* Sublabel */}
              <span className={`block text-[10px] font-semibold mt-0.5 truncate ${isSurgery ? 'text-purple-700 font-bold' : 'text-slate-500'}`}>
                {sublabel}
              </span>

              {/* Calendar Date */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-slate-400 font-mono">
                  {dateFormatted}
                </span>
                {isFuture && (
                  <span className="text-[8px] text-blue-600 font-bold">
                    Forecast
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

