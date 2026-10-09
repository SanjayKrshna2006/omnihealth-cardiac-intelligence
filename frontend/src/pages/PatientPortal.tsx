import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Layers,
  Sparkles,
  Heart,
  TrendingUp,
  MessageSquare,
  Bell,
  Globe,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Filter,
  Clock,
  Printer,
  ChevronRight,
  Pill,
  Activity,
  Flame,
  Check,
  X,
  Sliders,
  FileText,
  AlertCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { mockDb } from '@/lib/services/mock-db';
import { getJourneyContext } from '@/lib/services/journey';
import { TodayChecklist } from '@/components/patient/today-checklist';
import { DayStrip } from '@/components/patient/day-strip';
import { JourneyHeader } from '@/components/patient/journey-header';
import { PlannerGrid } from '@/components/patient/planner-grid';
import { ProgressView } from '@/components/patient/progress-view';
import { ChangeLogView } from '@/components/patient/change-log-view';
import { DiscomfortView } from '@/components/patient/discomfort-view';
import { QuickLogModal } from '@/components/patient/quick-log-modal';
import { DiscomfortModal } from '@/components/patient/discomfort-modal';
import { AiCheckinModal } from '@/components/patient/ai-checkin-modal';
import type { DiscomfortReport, LogEntry, PlanRow, PlanChangeRecord } from '@/lib/types/database';

export const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const { currentPatient, logout } = useAuthStore();

  // Primary Left Sidebar Sub-Nav: 'today' | 'planner' | 'changes' | 'discomfort' | 'progress'
  const [patientSubNav, setPatientSubNav] = useState<
    'today' | 'planner' | 'changes' | 'discomfort' | 'progress'
  >('today');

  // Mapping currentPatient to zip mockDb ID
  const patientIdMap: Record<string, string> = {
    'PT-10504': 'p-cabg-01',
    'PT-10507': 'p-valve-02',
    'PT-10508': 'p-stent-03',
    'PT-10509': 'p-cabg-05',
    'PT-10510': 'p-pace-04',
  };

  const patientDbId = (currentPatient?.patient_id && patientIdMap[currentPatient.patient_id]) || 'p-cabg-01';

  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const context = useMemo(() => getJourneyContext(patientDbId), [patientDbId, tick]);
  const patient = useMemo(() => mockDb.getPatient(patientDbId) || mockDb.getPatient('p-cabg-01')!, [patientDbId, tick]);
  const allPlans = useMemo(() => mockDb.getPlans(patientDbId), [patientDbId, tick]);
  const baselinePlans = useMemo(() => allPlans.filter((p) => p.is_baseline), [allPlans]);
  const currentPlans = useMemo(() => allPlans.filter((p) => p.is_current), [allPlans]);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isDiscomfortOpen, setIsDiscomfortOpen] = useState(false);
  const [isAiCheckinOpen, setIsAiCheckinOpen] = useState(false);

  const logs = useMemo(() => mockDb.getLogs(patientDbId), [patientDbId, tick]);
  const discomforts = useMemo(() => mockDb.getDiscomforts(patientDbId), [patientDbId, tick]);
  const changes = useMemo(() => mockDb.getChanges(patientDbId), [patientDbId, tick]);
  const alerts = useMemo(() => mockDb.getAlerts(patientDbId), [patientDbId, tick]);
  const analyses = useMemo(() => mockDb.getAnalyses(patientDbId), [patientDbId, tick]);

  const [changeLogFilter, setChangeLogFilter] = useState('all');
  const [trajectoryMode, setTrajectoryMode] = useState<'full' | 'logged'>('full');

  // Backend sync note
  const [backendPatientData, setBackendPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const pid = currentPatient?.patient_id || 'PT-10504';
        const res = await apiClient.get(`/api/prepost/patient/${pid}`);
        if (res.data) {
          setBackendPatientData(res.data);
        }
      } catch (e) {
        console.warn('Backend sync note:', e);
      }
    };
    fetchBackend();
  }, [currentPatient?.patient_id, tick]);

  const handleSaveQuickLog = (kind: string, data: Record<string, unknown>) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      patient_id: patientDbId,
      day_offset: context.dayOffset,
      date: context.effectiveDate,
      kind: kind as any,
      payload: data,
      source: 'quick_log',
      created_at: new Date().toISOString(),
    };
    mockDb.addLog(newLog);
    setIsQuickLogOpen(false);
    refresh();
  };

  const handleSaveDiscomfort = (report: Omit<DiscomfortReport, 'id' | 'created_at'>) => {
    const newReport: DiscomfortReport = {
      ...report,
      id: `disc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockDb.addDiscomfort(newReport);
    setIsDiscomfortOpen(false);
    refresh();
  };

  const handleCompleteDay = () => {
    const p = mockDb.getPatient(patientDbId);
    if (p) {
      p.demo_offset_days = (p.demo_offset_days || 0) + 1;
      mockDb.runEngineForPatient(patientDbId);
    }
    refresh();
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const currentPlan = currentPlans.find((p) => p.day_offset === context.dayOffset) || currentPlans[0] || {
    id: 'plan-curr',
    patient_id: patientDbId,
    day_offset: context.dayOffset,
    day_number: 1,
    date: context.effectiveDate,
    version: 1,
    is_current: true,
    is_baseline: true,
    content: {
      stage: 'before' as const,
      phase_id: 'p1',
      phase_name: 'Pre-Surgical Cardiac Prep',
      meals: [],
      workout: { level: 'light', duration_min: 15, instructions: [] },
      medicines: [],
      checks: []
    }
  };

  // Trajectory mock dataset matching Screenshot 3
  const trajectoryData = [
    { day: 'D1 (5d pre)', systolic: 124, sugar: 92, pain: 0 },
    { day: 'D2 (4d pre)', systolic: 125, sugar: 95, pain: 0 },
    { day: 'D3 (3d pre)', systolic: 126, sugar: 95, pain: 0 },
    { day: 'D4 (2d pre)', systolic: 126, sugar: 96, pain: 0 },
    { day: 'D5 (1d pre)', systolic: 126, sugar: 96, pain: 0 },
    { day: 'Surgery (OR)', systolic: 118, sugar: 110, pain: 2 },
    { day: 'D7 (+1d)', systolic: 122, sugar: 114, pain: 4 },
    { day: 'D8 (+2d)', systolic: 124, sugar: 112, pain: 3 },
    { day: 'D10 (+4d)', systolic: 124, sugar: 110, pain: 2 },
    { day: 'D13 (+7d)', systolic: 124, sugar: 104, pain: 2 },
    { day: 'D16 (+10d)', systolic: 124, sugar: 104, pain: 1 },
    { day: 'D20 (+14d)', systolic: 122, sugar: 104, pain: 1 },
    { day: 'D27 (+21d)', systolic: 122, sugar: 104, pain: 0 },
    { day: 'D34 (+28d)', systolic: 122, sugar: 104, pain: 0 },
    { day: 'D48 (+42d)', systolic: 120, sugar: 102, pain: 0 },
    { day: 'D72 (+66d)', systolic: 120, sugar: 102, pain: 0 },
  ];

  const filteredChanges = changeLogFilter === 'all'
    ? changes
    : changes.filter(c => c.category === changeLogFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      
      {/* ── TOP PATIENT BAR (Exact Match to Screenshot) ── */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {currentPatient?.name || patient.name || 'Rajesh Sharma'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                PATIENT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Cardiac Recovery Journey • {currentPatient?.surgery_type || patient.surgery_type?.toUpperCase() || 'CABG Protocol'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              1
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white shadow-xs">
            <Globe size={14} className="text-slate-500" />
            <span>EN</span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-xs"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── MAIN BODY: 2 COLUMN LAYOUT (Sub-Options Sidebar + Content) ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── LEFT RECOVERY PORTAL SUB-NAV (Exact Match to Screenshot) ── */}
        <aside className="w-56 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="px-3 pb-3 mb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                RECOVERY PORTAL
              </span>
            </div>

            <nav className="space-y-1.5">
              {/* 1. Today's Journey */}
              <button
                onClick={() => setPatientSubNav('today')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  patientSubNav === 'today'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className={patientSubNav === 'today' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Today's Journey</span>
                </div>
                {patientSubNav === 'today' && <ChevronRight size={14} className="text-blue-600" />}
              </button>

              {/* 2. Overall Planner */}
              <button
                onClick={() => setPatientSubNav('planner')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  patientSubNav === 'planner'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className={patientSubNav === 'planner' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Overall Planner</span>
                </div>
                {patientSubNav === 'planner' && <ChevronRight size={14} className="text-blue-600" />}
              </button>

              {/* 3. Change Log */}
              <button
                onClick={() => setPatientSubNav('changes')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  patientSubNav === 'changes'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className={patientSubNav === 'changes' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Change Log</span>
                </div>
                {patientSubNav === 'changes' && <ChevronRight size={14} className="text-blue-600" />}
              </button>

              {/* 4. Discomfort Tracker */}
              <button
                onClick={() => setPatientSubNav('discomfort')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  patientSubNav === 'discomfort'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart size={16} className={patientSubNav === 'discomfort' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Discomfort Tracker</span>
                </div>
                {patientSubNav === 'discomfort' && <ChevronRight size={14} className="text-blue-600" />}
              </button>

              {/* 5. My Progress & Trends */}
              <button
                onClick={() => setPatientSubNav('progress')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  patientSubNav === 'progress'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={16} className={patientSubNav === 'progress' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>My Progress & Trends</span>
                </div>
                {patientSubNav === 'progress' && <ChevronRight size={14} className="text-blue-600" />}
              </button>
            </nav>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <ShieldCheck size={20} className="text-emerald-600 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-700 block">CareLoop Protected</span>
            <span className="text-[9px] text-slate-500 block">Doctor Verified Protocol</span>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT AREA ── */}
        <main className="flex-1 bg-[#F8FAFC] p-6 overflow-y-auto space-y-6">

          {/* =========================================================================
              VIEW 1: TODAY'S JOURNEY (Screenshot 5 Match)
              ========================================================================= */}
          {patientSubNav === 'today' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Compact Unified Header Bar */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                      {patient.stage === 'before' ? 'PRE-OP' : 'POST-OP'} • Day {selectedDayNumber} of {patient.total_plan_days || 72}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {context.dayOffset < 0
                        ? `${Math.abs(context.dayOffset)} Days Before Surgery`
                        : context.dayOffset > 0
                        ? `Day +${context.dayOffset} Post-Op`
                        : 'OR Surgery Day'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Active Day
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <h1 className="font-display font-bold text-base text-slate-900">
                      {currentPlan?.content?.phase_name || 'Phase II Cardiac Conditioning'}
                    </h1>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-700">Clinical Focus:</strong> Prepare respiratory muscles and keep vitals stable.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => setIsDiscomfortOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs"
                  >
                    + Discomfort
                  </button>

                  <button
                    onClick={() => setIsQuickLogOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    + Quick Log
                  </button>

                  <button
                    onClick={handleCompleteDay}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>Complete Day</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Timeline Day Strip (Direct, no double wrapper) */}
              <DayStrip
                plans={currentPlans}
                selectedDayNumber={selectedDayNumber}
                currentDayOffset={context.dayOffset}
                onSelectDay={setSelectedDayNumber}
              />

              {/* Today's Checklist with Category Filter Tabs & Compact Rows */}
              <TodayChecklist
                patientId={patientDbId}
                dayOffset={context.dayOffset}
                onEventSaved={() => refresh()}
              />

            </div>
          )}

          {/* =========================================================================
              VIEW 2: OVERALL PLANNER (Screenshot 4 Match)
              ========================================================================= */}
          {patientSubNav === 'planner' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <PlannerGrid
                baselinePlans={baselinePlans}
                currentPlans={currentPlans}
                changes={changes}
                currentDayOffset={context.dayOffset}
              />
            </div>
          )}

          {/* =========================================================================
              VIEW 3: CHANGE LOG (Screenshot 1 Match)
              ========================================================================= */}
          {patientSubNav === 'changes' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <ChangeLogView changes={changes} />
            </div>
          )}

          {/* =========================================================================
              VIEW 4: DISCOMFORT TRACKER (Screenshot 2 Match)
              ========================================================================= */}
          {patientSubNav === 'discomfort' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DiscomfortView
                discomforts={discomforts}
                changes={changes.filter((c) => c.source === 'discomfort')}
                onOpenReportModal={() => setIsDiscomfortOpen(true)}
              />
            </div>
          )}

          {/* =========================================================================
              VIEW 5: MY PROGRESS & TRENDS (Screenshot 3 Match)
              ========================================================================= */}
          {patientSubNav === 'progress' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono uppercase tracking-wider">
                    RECOVERY ANALYTICS • Patient: {patient.name} ({patient.surgery_type?.toUpperCase()})
                  </span>
                  <h1 className="font-display font-bold text-xl text-slate-900 mt-2">
                    My Recovery Progress & Hemodynamic Trends
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    Monitor real-time vitals, blood pressure stability, blood sugar balance, and pain control across all {patient.total_plan_days || 72} recovery days.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Download / Print Clinical Report</span>
                </button>
              </div>

              {/* 4-Stage Clinical Recovery Milestones */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    4-Stage Clinical Recovery Milestones
                  </span>
                  <span className="text-slate-500 text-[11px] font-semibold">
                    Currently on Stage 1 (Day 1 of 72)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/40 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">1. Pre-Op Prep</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono uppercase">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">Days 1–5 (Vitals baseline & spirometry)</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">2. Surgery Day</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">
                        Day 6
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Hospital admission & bypass graft</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">3. Acute Sternal</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                        14 Days
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Days 7–20 (Graft protection)</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">4. Conditioning</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                        Maintenance
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Days 21–72 (Walking stamina)</p>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      OVERALL ADHERENCE
                    </span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">94%</p>
                    <p className="text-xs text-slate-500 mt-0.5">Consistent protocol execution to date</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      PAIN TRAJECTORY
                    </span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Controlled</p>
                    <p className="text-xs text-slate-500 mt-0.5">Averaging &lt; 4/10 across recovery targets</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp size={22} />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      CLINICAL ALERTS
                    </span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">1</p>
                    <p className="text-xs text-slate-500 mt-0.5">Logged & communicated to attending physician</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={22} />
                  </div>
                </div>
              </div>

              {/* Vitals & Pain Trajectory Line Chart */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-blue-600" />
                      <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
                        VITALS & PAIN RECOVERY TRAJECTORY
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Systolic BP (mmHg), Blood Sugar (mg/dL), and Expected Pain Score (0–10).
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setTrajectoryMode('full')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        trajectoryMode === 'full'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Full Recovery Trajectory (72 Days)
                    </button>
                    <button
                      onClick={() => setTrajectoryMode('logged')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        trajectoryMode === 'logged'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Logged Readings to Date (1)
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 text-xs font-semibold pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Systolic Blood Pressure (Target 110–135)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Blood Sugar (Target 80–130)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    Pain Score (0–10 Trajectory)
                  </span>
                </div>

                {/* Recharts Trajectory Graph */}
                <div className="h-80 w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 160]} />
                      <Tooltip />
                      <ReferenceLine y={135} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'BP Safe Ceiling (135)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                      <Line type="monotone" dataKey="systolic" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} name="Systolic BP" />
                      <Line type="monotone" dataKey="sugar" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Blood Sugar" />
                      <Line type="monotone" dataKey="pain" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }} name="Pain Level" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        stage={patient.stage === 'before' ? 'before' : 'after'}
        onSaveLog={handleSaveQuickLog}
        onTriggerEmergency={(reason) => {
          alert(`Emergency reported: ${reason}`);
          setIsQuickLogOpen(false);
          refresh();
        }}
      />

      <DiscomfortModal
        isOpen={isDiscomfortOpen}
        onClose={() => setIsDiscomfortOpen(false)}
        onSubmit={handleSaveDiscomfort}
        dayOffset={context.dayOffset}
        currentDate={context.effectiveDate}
        patientId={patientDbId}
      />

      <AiCheckinModal
        isOpen={isAiCheckinOpen}
        onClose={() => setIsAiCheckinOpen(false)}
        stage={patient.stage === 'before' ? 'before' : 'after'}
        language="en"
        onConfirmLogs={(confirmedLogs) => {
          for (const l of confirmedLogs) {
            mockDb.addLog({
              id: `log-ai-${Date.now()}-${Math.random()}`,
              patient_id: patientDbId,
              day_offset: context.dayOffset,
              date: context.effectiveDate,
              kind: l.kind as any,
              payload: l.data,
              source: 'ai_checkin',
              created_at: new Date().toISOString(),
            });
          }
          setIsAiCheckinOpen(false);
          refresh();
        }}
        onTriggerEmergency={(reason) => {
          alert(`Emergency alert triggered: ${reason}`);
          setIsAiCheckinOpen(false);
          refresh();
        }}
        onSwitchToQuickForm={() => {
          setIsAiCheckinOpen(false);
          setIsQuickLogOpen(true);
        }}
      />

    </div>
  );
};

export default PatientPortal;
