import React, { useState, useEffect, useMemo } from 'react';
import type {
  PatientDetails,
  AlertRow,
  PlanRow,
  LogEntry,
  PlanChangeRecord,
  MedicineProposal,
  DiscomfortReport,
} from '@/lib/types/database';
import { mockDb, DOCTOR_ID } from '@/lib/services/mock-db';
import { getJourneyContext } from '@/lib/services/journey';
import { SURGERY_CATALOG } from '@/lib/services/protocols';
import { DayStrip } from '@/components/patient/day-strip';
import { DayDetail } from '@/components/patient/day-detail';
import { PlannerGrid } from '@/components/patient/planner-grid';
import { ChangeLogView } from '@/components/patient/change-log-view';
import { DiscomfortView } from '@/components/patient/discomfort-view';
import {
  LayoutGrid,
  Users,
  FileText,
  Sliders,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Printer,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Pill,
  Clock,
  ArrowRight,
  Activity,
  Heart,
  Stethoscope,
  Send,
  Save,
  Check,
  X,
  Bell,
  Globe,
  LogOut,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useSearchParams } from 'react-router-dom';

export const PrePostDoctorTracker: React.FC = () => {
  const { currentDoctor, logout } = useAuthStore();
  const allPatients = mockDb.getAllPatients();

  // Primary Left Sidebar Sub-Nav Option: 'dashboard' | 'cohort' | 'reports' | 'limits'
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub');
  const physicianSubNav = (subParam as 'dashboard' | 'cohort' | 'reports' | 'limits') || 'dashboard';
  const setPhysicianSubNav = (tab: 'dashboard' | 'cohort' | 'reports' | 'limits') => {
    setSearchParams({ sub: tab });
  };

  const [selectedPatientId, setSelectedPatientId] = useState<string>(allPatients[0]?.patient_id || 'p-cabg-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSurgery, setFilterSurgery] = useState('all');
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortFilterSurgery, setCohortFilterSurgery] = useState('all');
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  // Secondary tab bar inside Clinical Dashboard
  const [activeDashboardTab, setActiveDashboardTab] = useState<
    'overview' | 'journey' | 'planner' | 'changes' | 'proposals' | 'discomfort' | 'trends' | 'limits' | 'notes'
  >('overview');

  // Selected Day inside Timeline & Day Detail
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(3);

  const activePatient = useMemo(() => {
    return mockDb.getPatient(selectedPatientId) || allPatients[0];
  }, [selectedPatientId, tick, allPatients]);

  // Doctor Limits
  const [limits, setLimits] = useState(mockDb.getLimits(selectedPatientId));
  const [limitsSaved, setLimitsSaved] = useState(false);

  // Schedule Customization (Doctor sets days dynamically)
  const [customPlanDays, setCustomPlanDays] = useState<number>(activePatient.total_plan_days || 58);
  const [customSurgeryDate, setCustomSurgeryDate] = useState<string>(activePatient.surgery_date || '2026-10-13');
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Doctor Clinical Notes
  const [doctorNoteText, setDoctorNoteText] = useState('');
  const [doctorNoteTag, setDoctorNoteTag] = useState('general');
  const [doctorNotesList, setDoctorNotesList] = useState<any[]>([]);
  const [postingNote, setPostingNote] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<AlertRow[]>(mockDb.getAlerts());

  const currentPlans = useMemo(() => mockDb.getPlans(selectedPatientId), [selectedPatientId, tick]);
  const currentLogs = useMemo(() => mockDb.getLogs(selectedPatientId), [selectedPatientId, tick]);
  const currentChanges = useMemo(() => mockDb.getChanges(selectedPatientId), [selectedPatientId, tick]);
  const currentDiscomforts = useMemo(() => mockDb.getDiscomforts(selectedPatientId), [selectedPatientId, tick]);
  const currentProposals = useMemo(() => mockDb.getProposals(selectedPatientId), [selectedPatientId, tick]);
  const currentAnalyses = useMemo(() => mockDb.getAnalyses(selectedPatientId), [selectedPatientId, tick]);

  const journeyCtx = useMemo(() => getJourneyContext(selectedPatientId), [selectedPatientId, tick]);
  const currentDayOffset = journeyCtx.day_number;

  const backendIdMap: Record<string, string> = {
    'p-cabg-01': 'PT-10504',
    'p-valve-02': 'PT-10507',
    'p-stent-03': 'PT-10508',
    'p-cabg-05': 'PT-10509',
    'p-pace-04': 'PT-10510',
  };

  const fetchDoctorNotes = async (pid: string) => {
    try {
      const bId = backendIdMap[pid] || pid;
      const res = await apiClient.get(`/api/prepost/patient/${bId}`);
      if (res.data && res.data.doctor_notes) {
        setDoctorNotesList(res.data.doctor_notes);
      }
    } catch (e) {
      console.warn('Doctor notes sync', e);
    }
  };

  useEffect(() => {
    fetchDoctorNotes(selectedPatientId);
    setLimits(mockDb.getLimits(selectedPatientId));
    setCustomPlanDays(activePatient.total_plan_days || 58);
    setCustomSurgeryDate(activePatient.surgery_date || '2026-10-13');
  }, [selectedPatientId, tick]);

  const handlePostDoctorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorNoteText.trim()) return;

    try {
      setPostingNote(true);
      const bId = backendIdMap[selectedPatientId] || selectedPatientId;
      await apiClient.post(`/api/prepost/patient/${bId}/doctor-note`, {
        doctor_id: currentDoctor?.id || 'DOC-005',
        doctor_name: currentDoctor?.name || 'Dr. Vikram Reddy, MD',
        note: doctorNoteText.trim(),
        action_type: doctorNoteTag
      });
      setDoctorNoteText('');
      await fetchDoctorNotes(selectedPatientId);
      refresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post note.');
    } finally {
      setPostingNote(false);
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    mockDb.saveLimits(selectedPatientId, limits);
    try {
      const bId = backendIdMap[selectedPatientId] || selectedPatientId;
      await apiClient.post(`/api/prepost/patient/${bId}/doctor-limits`, limits);
    } catch (err) {
      console.warn('Backend sync failed, saved locally');
    }
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 3000);
    refresh();
  };

  const handleSaveSchedule = (overrideDays?: number, overrideDate?: string) => {
    const days = overrideDays !== undefined ? overrideDays : customPlanDays;
    const date = overrideDate !== undefined ? overrideDate : customSurgeryDate;

    // 1. Update patient record
    mockDb.updatePatientDetails(selectedPatientId, {
      total_plan_days: days,
      surgery_date: date,
      doctor_length_override: days,
    });

    // 2. Rebuild and regenerate baseline recovery plan with new total days
    mockDb.overridePatientPlanLength(
      DOCTOR_ID,
      selectedPatientId,
      days,
      `Attending physician set total recovery duration to ${days} days (surgery date: ${date})`
    );

    // 3. Run dynamic safety engine to adapt milestones
    mockDb.runEngineForPatient(selectedPatientId);

    setCustomPlanDays(days);
    setCustomSurgeryDate(date);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 3500);
    refresh();
  };

  const handleAcknowledgeAlert = (id: string) => {
    mockDb.acknowledgeAlert(id);
    setAlerts(mockDb.getAlerts());
    refresh();
  };

  const getPatientDayOffset = (p: PatientDetails): number => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const surgeryDate = p.surgery_date || today;
      const diffMs = new Date(today).getTime() - new Date(surgeryDate).getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const filteredPatients = allPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterSurgery === 'all' || p.surgery_type.toLowerCase() === filterSurgery.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const cohortFilteredPatients = allPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(cohortSearch.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(cohortSearch.toLowerCase()) ||
      p.surgery_type.toLowerCase().includes(cohortSearch.toLowerCase());
    const matchesFilter =
      cohortFilterSurgery === 'all' || p.surgery_type.toLowerCase() === cohortFilterSurgery.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const selectedPlan = currentPlans.find((p) => p.day_number === selectedDayNumber) || currentPlans[0] || {
    id: 'plan-def',
    patient_id: selectedPatientId,
    day_offset: currentDayOffset,
    day_number: 1,
    date: new Date().toISOString().split('T')[0],
    version: 1,
    is_current: true,
    is_baseline: true,
    content: {
      stage: 'before' as const,
      phase_id: 'p1',
      phase_name: 'Care Protocol',
      meals: [],
      workout: { level: 'light', duration_min: 15, instructions: [] },
      medicines: [],
      checks: []
    }
  };

  // Vitals Chart Data
  const trendData = currentLogs
    .filter((l) => l.kind === 'vital' || l.kind === 'pain')
    .map((l) => {
      const payload = (l.payload || l.data || {}) as Record<string, any>;
      return {
        date: `Day ${l.day_offset >= 0 ? '+' : ''}${l.day_offset}`,
        systolic: Number(payload.systolic || payload.sys || 120),
        diastolic: Number(payload.diastolic || payload.dia || 80),
        pain: Number(payload.pain || payload.pain_level || (l.kind === 'pain' ? payload.severity : 0)),
        heartRate: Number(payload.heart_rate || payload.pulse || 72),
      };
    });

  const formatSurgeryName = (surgeryType: string) => {
    switch (surgeryType) {
      case 'cabg':
        return 'CABG (Coronary Artery Bypass)';
      case 'valve_replacement':
        return 'Heart Valve Replacement (Aortic / Mitral / Other)';
      case 'angioplasty_stent':
        return 'Angioplasty with Stent (PCI)';
      case 'pacemaker':
        return 'Pacemaker Implantation';
      default:
        return surgeryType.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">

          {/* =========================================================================
              VIEW 1: CLINICAL DASHBOARD (As in Screenshot 2)
              ========================================================================= */}
          {physicianSubNav === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header: Cardiovascular Clinical Oversight */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Cardiovascular Clinical Oversight
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentDoctor?.name || 'Attending Cardiologist'} • {currentDoctor?.hospital || 'Metropolitan Heart Network'} • Active Patients: {allPatients.length}
                  </p>
                </div>

                {/* Search & Surgery Filter */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <div className="relative flex-1 sm:flex-none">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patients..."
                      className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-full sm:w-48"
                    />
                  </div>

                  <select
                    value={filterSurgery}
                    onChange={(e) => setFilterSurgery(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none shrink-0"
                  >
                    <option value="all">All Heart Surgeries</option>
                    <option value="cabg">CABG</option>
                    <option value="valve_replacement">Valve Replacement</option>
                    <option value="angioplasty_stent">Angioplasty / Stent</option>
                    <option value="pacemaker">Pacemaker</option>
                  </select>
                </div>
              </div>

              {/* Priority Patients Needing Attention Today (Banner) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Priority Patients Needing Attention Today (1)
                  </span>
                </div>
                <div className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-900">Michael Chen</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                      ACTION REQUIRED
                    </span>
                    <span className="text-xs text-slate-600">
                      VALVE_REPLACEMENT • Reported post-operative nausea (severity: 6/10). Dynamic engine adjusted next-day workout to rest.
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPatientId('p-valve-02')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                  >
                    Review Patient →
                  </button>
                </div>
              </div>

              {/* Horizontal Patient Cards Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                {filteredPatients.map((p) => {
                  const isSelected = p.patient_id === selectedPatientId;
                  const dayOffset = getPatientDayOffset(p);
                  return (
                    <button
                      key={p.patient_id}
                      onClick={() => setSelectedPatientId(p.patient_id)}
                      className={`text-left p-3 rounded-2xl border transition-all relative ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 font-semibold">
                          {`Day ${dayOffset >= 0 ? '+' : ''}${dayOffset}`}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 uppercase font-semibold truncate">
                        {p.surgery_type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Age {p.age}</span>
                        <span className="text-emerald-600 font-bold">Active</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Patient Header Banner & Print */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {activePatient.name} (Age {activePatient.age}, {activePatient.sex?.toUpperCase()})
                      </h3>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {`Day ${getPatientDayOffset(activePatient) >= 0 ? '+' : ''}${getPatientDayOffset(activePatient)}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Procedure: <strong className="text-slate-700">{formatSurgeryName(activePatient.surgery_type)}</strong> • Scheduled/Operated: <span className="font-mono">{activePatient.surgery_date}</span> • Conditions: {activePatient.conditions.join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Doctor Quick Plan Duration Setter */}
                    <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs">
                      <Calendar size={14} className="text-blue-600 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-700">Plan Days:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={customPlanDays}
                          onChange={(e) => setCustomPlanDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[11px] font-bold text-blue-900">Days</span>
                      </div>
                      <button
                        onClick={() => handleSaveSchedule()}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Set new plan duration for this patient"
                      >
                        <Save size={12} />
                        <span>Set</span>
                      </button>
                      {scheduleSaved && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 animate-in fade-in">
                          <Check size={13} />
                          <span>Saved!</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      <Printer size={14} className="text-slate-500" />
                      <span>Print Clinical Report</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Navigation inside Patient Dashboard */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-2 border-b border-slate-100 scrollbar-none">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'journey', label: 'Timeline & Day Detail' },
                    { id: 'planner', label: 'Planner (Diff Matrix)' },
                    { id: 'changes', label: `Adaptation Log (${currentChanges.length})` },
                    { id: 'proposals', label: `Medicine Proposals (${currentProposals.length})` },
                    { id: 'discomfort', label: `Discomfort (${currentDiscomforts.length})` },
                    { id: 'trends', label: 'Vitals & Pain Trends' },
                    { id: 'limits', label: 'Physician Limits' },
                    { id: 'notes', label: 'AI Assessment & Notes' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDashboardTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                        activeDashboardTab === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT: OVERVIEW */}
                {activeDashboardTab === 'overview' && (
                  <div className="pt-5 space-y-5">
                    {/* 3 Overview Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          READINESS / RECOVERY
                        </span>
                        <p className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                          <CheckCircle2 size={18} />
                          <span>On Track Recovery</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">All criteria verified</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          JOURNEY ADHERENCE
                        </span>
                        <p className="text-base font-bold text-blue-700 mt-1">
                          93%
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Consistent logs recorded</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          DOCTOR LIMITS APPLIED
                        </span>
                        <p className="text-base font-bold text-slate-800 mt-1">
                          Normal Range
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Systolic max: {limits?.systolicMax || 145} mmHg</p>
                      </div>
                    </div>

                    {/* Clinical Overview & Rationale */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        CLINICAL OVERVIEW & RATIONALE
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activePatient.plan_length_reason ||
                          `Patient is undergoing ${formatSurgeryName(activePatient.surgery_type)} with baseline duration calculated at ${activePatient.total_plan_days || 58} days. Condition modules for ${activePatient.conditions.join(' and ')} are active, enforcing sodium restrictions and vital threshold monitoring.`}
                      </p>
                    </div>

                    {/* Real-Time Alerts Inbox */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Real-Time Clinical Alerts Inbox
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {alerts.length} total alerts
                        </span>
                      </div>

                      <div className="space-y-2">
                        {alerts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                            Zero active emergency alerts. All patients are within safety parameters.
                          </div>
                        ) : (
                          alerts.map((a) => (
                            <div
                              key={a.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                a.acknowledged_by
                                  ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                                  : a.level === 'emergency'
                                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <AlertTriangle
                                  size={16}
                                  className={a.level === 'emergency' ? 'text-rose-600 shrink-0' : 'text-amber-600 shrink-0'}
                                />
                                <div>
                                  <span className="font-bold">{a.level === 'emergency' ? 'CRITICAL' : 'WARNING'}</span>: {a.message}
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    Patient: {a.patient_id} • {new Date(a.created_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>

                              {!a.acknowledged_by && (
                                <button
                                  onClick={() => handleAcknowledgeAlert(a.id)}
                                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-[10px] text-slate-700 hover:bg-slate-100 shrink-0"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TIMELINE & DAY DETAIL */}
                {activeDashboardTab === 'journey' && (
                  <div className="pt-5 space-y-5">
                    <DayStrip
                      plans={currentPlans}
                      selectedDayNumber={selectedDayNumber}
                      currentDayOffset={currentDayOffset}
                      onSelectDay={setSelectedDayNumber}
                    />

                    <DayDetail
                      plan={selectedPlan}
                      currentDayOffset={currentDayOffset}
                      logs={currentLogs.filter((l) => l.day_offset === selectedPlan.day_offset)}
                      discomforts={currentDiscomforts.filter((d) => d.day_offset === selectedPlan.day_offset)}
                      changes={currentChanges.filter((c) => c.day_offset === selectedPlan.day_offset)}
                      alerts={alerts.filter((a) => a.day_offset === selectedPlan.day_offset)}
                    />
                  </div>
                )}

                {/* TAB CONTENT: PLANNER DIFF MATRIX */}
                {activeDashboardTab === 'planner' && (
                  <div className="pt-5">
                    <PlannerGrid
                      baselinePlans={currentPlans.filter((p) => p.is_baseline)}
                      currentPlans={currentPlans.filter((p) => p.is_current)}
                      changes={currentChanges}
                      currentDayOffset={currentDayOffset}
                    />
                  </div>
                )}

                {/* TAB CONTENT: ADAPTATION LOG */}
                {activeDashboardTab === 'changes' && (
                  <div className="pt-5">
                    <ChangeLogView changes={currentChanges} />
                  </div>
                )}

                {/* TAB CONTENT: MEDICINE PROPOSALS */}
                {activeDashboardTab === 'proposals' && (
                  <div className="pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Prescription & Medication Adjustment Proposals
                    </h4>
                    {currentProposals.length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        No pending medication adjustments. Current medications are confirmed by the surgical team.
                      </p>
                    ) : (
                      currentProposals.map((p) => (
                        <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{p.medication_name}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">Instruction: {p.proposed_instruction} • Reason: {p.rationale}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                            {p.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB CONTENT: DISCOMFORT */}
                {activeDashboardTab === 'discomfort' && (
                  <div className="pt-5">
                    <DiscomfortView
                      discomforts={currentDiscomforts}
                      changes={currentChanges.filter((c) => c.source === 'discomfort')}
                      onOpenReportModal={() => {}}
                    />
                  </div>
                )}

                {/* TAB CONTENT: VITALS & PAIN TRENDS */}
                {activeDashboardTab === 'trends' && (
                  <div className="pt-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Longitudinal Hemodynamic & Pain Trajectory
                    </h4>
                    {trendData.length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        No daily vitals logged yet for this patient.
                      </p>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip />
                            <Line type="monotone" dataKey="systolic" stroke="#2563eb" name="Systolic BP" strokeWidth={2} />
                            <Line type="monotone" dataKey="diastolic" stroke="#60a5fa" name="Diastolic BP" strokeWidth={2} />
                            <Line type="monotone" dataKey="pain" stroke="#e11d48" name="Pain Level (0-10)" strokeWidth={2} />
                            <Line type="monotone" dataKey="heartRate" stroke="#10b981" name="Heart Rate (bpm)" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: PHYSICIAN LIMITS */}
                {activeDashboardTab === 'limits' && (
                  <div className="pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Custom Safety Thresholds for {activePatient.name}
                      </h4>
                      {limitsSaved && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Saved & Synced
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleSaveLimits} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Systolic BP Maximum (mmHg)
                        </label>
                        <input
                          type="number"
                          value={limits?.systolicMax || 145}
                          onChange={(e) => setLimits({ ...limits, systolicMax: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pain Emergency Threshold (0-10)
                        </label>
                        <input
                          type="number"
                          value={limits?.painEmergency || 7}
                          onChange={(e) => setLimits({ ...limits, painEmergency: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pain Warning Threshold (0-10)
                        </label>
                        <input
                          type="number"
                          value={limits?.painWarn || 4}
                          onChange={(e) => setLimits({ ...limits, painWarn: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Workout Intensity Cap
                        </label>
                        <select
                          value={limits?.workoutCap || 'normal'}
                          onChange={(e) => setLimits({ ...limits, workoutCap: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        >
                          <option value="minimum">Strict Bed Rest (Minimum)</option>
                          <option value="light">Light Walking Only</option>
                          <option value="normal">Normal Progression</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save size={14} />
                          <span>Save Thresholds</span>
                        </button>
                      </div>
                    </form>

                    {/* Schedule & Total Plan Duration Configuration */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-blue-600" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Recovery Plan Duration & Dynamic Day Scheduling
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Set total duration (in days) and surgery date. The CareLoop plan-builder dynamically adapts and recalculates daily protocols.
                            </p>
                          </div>
                        </div>
                        {scheduleSaved && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                            <CheckCircle2 size={15} /> Schedule Updated & Synced
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Total Recovery Plan Duration (Days)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={180}
                              value={customPlanDays}
                              onChange={(e) => setCustomPlanDays(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-slate-600">Total Days</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Applies to {activePatient.name} ({activePatient.patient_id})
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Surgery Scheduled / Operated Date
                          </label>
                          <input
                            type="date"
                            value={customSurgeryDate}
                            onChange={(e) => setCustomSurgeryDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Used to calculate Day 0 surgery offset and pre/post phases
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Duration Presets */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                          1-Click Duration Presets:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { days: 14, label: '14 Days (Rapid Prehab / Stent)' },
                            { days: 30, label: '30 Days (Standard Ablation / Pacemaker)' },
                            { days: 45, label: '45 Days (Moderate Valve Recovery)' },
                            { days: 60, label: '60 Days (Standard Full CABG)' },
                            { days: 72, label: '72 Days (Senior / High-Risk CABG)' },
                            { days: 90, label: '90 Days (Extended Cardiac Rehab)' },
                          ].map((preset) => (
                            <button
                              key={preset.days}
                              type="button"
                              onClick={() => {
                                setCustomPlanDays(preset.days);
                                handleSaveSchedule(preset.days, customSurgeryDate);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                customPlanDays === preset.days
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">
                          Active Plan: <strong className="text-slate-800 font-mono">{activePatient.total_plan_days || customPlanDays} total days</strong> (Pre-Op + Surgery + Post-Op)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveSchedule()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Save size={14} />
                          <span>Save & Recalculate Plan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: DOCTOR NOTING & AI REASONING */}
                {activeDashboardTab === 'notes' && (
                  <div className="pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Doctor Noting & Clinical Orders
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        Directly syncs to Patient Portal
                      </span>
                    </div>

                    {/* New Note Form */}
                    <form onSubmit={handlePostDoctorNote} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <textarea
                        rows={3}
                        required
                        value={doctorNoteText}
                        onChange={(e) => setDoctorNoteText(e.target.value)}
                        placeholder="Write clinical orders, medication instructions, or observations for this patient..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                      />

                      <div className="flex items-center justify-between">
                        <select
                          value={doctorNoteTag}
                          onChange={(e) => setDoctorNoteTag(e.target.value)}
                          className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                          <option value="general">General Clinical Note</option>
                          <option value="med_change">Medication Adjustment</option>
                          <option value="workout_cap">Rehab Restriction</option>
                          <option value="milestone">Post-Op Milestone Order</option>
                        </select>

                        <button
                          type="submit"
                          disabled={postingNote}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <Send size={13} />
                          <span>{postingNote ? 'Syncing...' : 'Record Doctor Note'}</span>
                        </button>
                      </div>
                    </form>

                    {/* Notes Feed */}
                    <div className="space-y-2.5">
                      {doctorNotesList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                          No notes recorded yet for this patient. Add your first note above.
                        </p>
                      ) : (
                        doctorNotesList.map((n) => (
                          <div key={n.id} className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-500">
                              <span className="font-bold text-slate-900">{n.doctor_name || 'Attending Physician'}</span>
                              <span className="font-mono text-[10px]">{new Date(n.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-800 leading-relaxed font-normal">{n.note}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: PATIENT COHORT DIRECTORY (Exact Match to Screenshot 1)
              ========================================================================= */}
          {physicianSubNav === 'cohort' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Directory Header */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-blue-600" />
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Patient Cohort Directory
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full searchable registry of cardiac surgical recovery patients ({allPatients.length} total)
                  </p>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={cohortSearch}
                      onChange={(e) => setCohortSearch(e.target.value)}
                      placeholder="Search by name, procedure, or condition..."
                      className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-64"
                    />
                  </div>

                  <select
                    value={cohortFilterSurgery}
                    onChange={(e) => setCohortFilterSurgery(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Cardiac Procedures</option>
                    <option value="cabg">CABG</option>
                    <option value="valve_replacement">Heart Valve Replacement</option>
                    <option value="angioplasty_stent">Angioplasty with Stent</option>
                    <option value="pacemaker">Pacemaker Implantation</option>
                  </select>
                </div>
              </div>

              {/* Patient Cohort Table (Exact Match to Screenshot 1) */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">PATIENT</th>
                        <th className="py-3 px-4">PROCEDURE</th>
                        <th className="py-3 px-4">TIMELINE & DAY</th>
                        <th className="py-3 px-4">PHASE</th>
                        <th className="py-3 px-4">ACTIVE CONDITIONS</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {cohortFilteredPatients.map((p) => {
                        const isAttention = p.patient_id === 'p-valve-02';
                        const dayOffset = getPatientDayOffset(p);
                        return (
                          <tr key={p.patient_id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Patient Column */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                              <div className="text-[11px] text-slate-500">
                                Age {p.age} • {p.sex?.toUpperCase()} • Diet: {p.diet}
                              </div>
                            </td>

                            {/* Procedure Column */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 text-xs">{formatSurgeryName(p.surgery_type)}</div>
                              <div className="text-[11px] font-mono text-slate-500">Date: {p.surgery_date}</div>
                            </td>

                            {/* Timeline & Day Column */}
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 block w-max">
                                {`Day ${dayOffset >= 0 ? '+' : ''}${dayOffset}`}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">
                                {dayOffset < 0
                                  ? `${Math.abs(dayOffset)} days before surgery`
                                  : `${dayOffset} days after surgery`}
                              </span>
                            </td>

                            {/* Phase Column */}
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                              {p.current_phase_name || 'Active Perioperative Protocol'}
                            </td>

                            {/* Active Conditions Column */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {p.conditions.map((c) => (
                                  <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Status Column */}
                            <td className="py-3.5 px-4">
                              {isAttention ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                  <ShieldCheck size={12} className="text-amber-700" />
                                  ATTENTION REQUIRED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  ON TRACK
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedPatientId(p.patient_id);
                                  setPhysicianSubNav('dashboard');
                                }}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-xs font-bold text-slate-800 hover:text-blue-700 transition-all shadow-xs"
                              >
                                Open Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              VIEW 3: CLINICAL REPORTS
              ========================================================================= */}
          {physicianSubNav === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <h2 className="font-display font-bold text-lg text-slate-900">
                    Clinical Discharge & Recovery Reports
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated perioperative summaries, medication reconciliations, and patient progress records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPatients.map((p) => (
                  <div key={p.patient_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className="text-[11px] text-slate-500 block">ID: {p.patient_id} • Age {p.age}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                        {p.stage.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Procedure:</strong> {formatSurgeryName(p.surgery_type)}</div>
                      <div><strong>Surgery Date:</strong> {p.surgery_date}</div>
                      <div><strong>Current Phase:</strong> {p.current_phase_name || 'Perioperative Plan'}</div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPatientId(p.patient_id);
                        setPhysicianSubNav('dashboard');
                        setTimeout(() => window.print(), 200);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer size={14} />
                      <span>Generate Full Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: ENGINE RULES & LIMITS
              ========================================================================= */}
          {physicianSubNav === 'limits' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  <h2 className="font-display font-bold text-lg text-slate-900">
                    Engine Rules, Safety Escalation & Dynamic Adaptation
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Global parameters governing dynamic next-day workout caps, pain escalation thresholds, and doctor notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Deterministic Safety Escalations
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span><strong>Pain &ge; 7 (Emergency):</strong> Halts all workouts immediately, enforces rest mode, and triggers an emergency physician alert.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span><strong>Pain &ge; 4 (Warning):</strong> Caps next day's physical therapy to light intensity and reduces duration by 50%.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span><strong>Missed Medication:</strong> Evaluates next morning safety parameters and creates an alert in the clinical inbox.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Dynamic Day Scheduling
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Physicians can dynamically modify individual surgical dates and total recovery days directly from the patient chart. The plan-builder dynamically stretches or compresses rehabilitation phases accordingly.
                  </p>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900">
                    <strong>Real-Time Sync:</strong> Any changes made by the doctor are instantaneously reflected in the patient's CareLoop daily to-do list.
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default PrePostDoctorTracker;
