'use client';

import React, { useState } from 'react';
import type {
  PatientDetails,
  PlanRow,
  LogEntry,
  PlanChangeRecord,
  MedicineProposal,
  DiscomfortReport,
  AlertRow,
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
  Stethoscope,
  Users,
  AlertTriangle,
  Bell,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Check,
  X,
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

export const DoctorDashboard: React.FC = () => {
  const allPatients = mockDb.getAllPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(allPatients[0]?.patient_id || 'p-cabg-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSurgery, setFilterSurgery] = useState('all');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'journey' | 'planner' | 'changes' | 'proposals' | 'discomfort' | 'trends' | 'limits' | 'report'
  >('overview');

  // Selected Day inside Doctor Journey tab
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(3);

  // Limits State
  const activePatient = mockDb.getPatient(selectedPatientId) || allPatients[0];
  const [limits, setLimits] = useState(mockDb.getLimits(selectedPatientId));
  const [limitsSaved, setLimitsSaved] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<AlertRow[]>(mockDb.getAlerts());

  const currentPlans = mockDb.getPlans(selectedPatientId);
  const currentLogs = mockDb.getLogs(selectedPatientId);
  const currentChanges = mockDb.getChanges(selectedPatientId);
  const currentDiscomforts = mockDb.getDiscomforts(selectedPatientId);
  const currentProposals = mockDb.getProposals(selectedPatientId);
  const currentAnalyses = mockDb.getAnalyses(selectedPatientId);

  // Canonical journey context for active patient
  const journeyCtx = getJourneyContext(selectedPatientId);
  const currentDayOffset = journeyCtx.day_number;

  const doctorProfile = mockDb.getProfile(DOCTOR_ID);


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
      checks: [],
      focus_note: 'Recovery focus',
    },
    reasons: [],
    created_at: '',
  };

  const handleAcknowledgeAlert = (id: string) => {
    mockDb.acknowledgeAlert(id);
    setAlerts([...mockDb.getAlerts()]);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    mockDb.saveLimits(selectedPatientId, limits);
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 2500);
  };

  const handleResolveProposal = (id: string, status: 'approved' | 'rejected') => {
    mockDb.updateProposalStatus(id, selectedPatientId, status);
  };

  const handleRevertChange = (changeId: string) => {
    mockDb.revertChange(changeId, selectedPatientId);
    alert('Plan adaptation reverted. Baseline schedule restored for that category.');
  };

  // Patients needing attention: active alerts or proposals or high risk
  const needsAttentionPatients = allPatients.filter((p) => {
    const pAlerts = alerts.filter((a) => a.patient_id === p.patient_id && !a.acknowledged_by);
    const pProps = mockDb.getProposals(p.patient_id).filter((pr) => pr.status === 'pending');
    return pAlerts.length > 0 || pProps.length > 0;
  });

  const filteredPatients = allPatients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.surgery_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSurgery === 'all' || p.surgery_type === filterSurgery;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="py-6 px-4 md:px-8 space-y-6 max-w-[1600px] mx-auto">
      {/* 1. TOP HEADER & ATTENTION PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              Cardiovascular Clinical Oversight
            </h1>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {doctorProfile?.full_name || 'Dr. Arun Kumar'} • {doctorProfile?.hospital || 'Heart Hospital'} • Active Patients: {allPatients.length}
          </p>
        </div>

        {/* Search & Surgery Filter */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 bg-surface border border-border rounded-xl text-xs text-foreground focus:outline-none"
            />
          </div>

          <select
            value={filterSurgery}
            onChange={(e) => setFilterSurgery(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Heart Surgeries</option>
            {SURGERY_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. 'NEEDS ATTENTION TODAY' PANEL */}
      {needsAttentionPatients.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Priority Patients Needing Attention Today ({needsAttentionPatients.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {needsAttentionPatients.map((p) => {
              const unackAlerts = alerts.filter((a) => a.patient_id === p.patient_id && !a.acknowledged_by);
              const pendProps = mockDb.getProposals(p.patient_id).filter((pr) => pr.status === 'pending');

              return (
                <div
                  key={p.patient_id}
                  onClick={() => setSelectedPatientId(p.patient_id)}
                  className="bg-white p-3.5 rounded-xl border border-amber-200 cursor-pointer hover:border-accent transition-colors text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{p.name}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">
                      Action Required
                    </span>
                  </div>
                  <p className="text-[11px] text-muted truncate">
                    {p.surgery_type.toUpperCase()} • {unackAlerts[0]?.message || `${pendProps.length} pending proposals`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PATIENTS HORIZONTAL CARDS SELECTOR */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {filteredPatients.map((p) => {
          const isSelected = p.patient_id === selectedPatientId;
          const pCtx = getJourneyContext(p.patient_id);
          const offsetLabel = pCtx.relation_label;

          return (
            <button
              key={p.patient_id}
              onClick={() => setSelectedPatientId(p.patient_id)}
              className={`p-4 rounded-2xl border text-left min-w-[220px] transition-all flex flex-col justify-between shrink-0 ${
                isSelected
                  ? 'bg-accent-light border-accent shadow-sm ring-2 ring-accent/20'
                  : 'bg-white border-border hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted">{offsetLabel}</span>
                </div>
                <span className="text-[11px] text-muted block mt-0.5 font-medium truncate">
                  {p.surgery_type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-surface text-slate-700 rounded border border-border">
                  Age {p.age}
                </span>
                <span className="text-emerald-600">Active</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. ACTIVE PATIENT FULL CLINICAL ANALYSIS */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
        {/* Patient Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground">
                {activePatient.name} (Age {activePatient.age}, {activePatient.sex.toUpperCase()})
              </h2>
              <span className="px-2.5 py-0.5 bg-accent-light text-accent text-xs font-bold rounded-full border border-accent/20">
                {journeyCtx.day_label}
              </span>
              {journeyCtx.demo_shortened && (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                  Demo mode: plan shortened
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Procedure: <strong className="text-foreground">{activePatient.surgery_type.toUpperCase()}</strong> • Scheduled/Operated: {activePatient.surgery_date} • Conditions: {activePatient.conditions.join(', ')}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-slate-100 text-foreground border border-border rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Clinical Report</span>
          </button>
        </div>

        {/* End of plan prompt: choose close, extend, or follow-up */}
        {journeyCtx.isProgramComplete && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-900 block">Program Complete</span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Scheduled plan duration has concluded. Please select clinical next steps:
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 rounded-lg font-bold text-amber-900 shadow-sm"
              >
                Close Program
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm"
              >
                Extend Plan
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 rounded-lg font-bold text-amber-900 shadow-sm"
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'journey', label: 'Timeline & Day Detail' },
            { id: 'planner', label: 'Planner (Diff Matrix)' },
            { id: 'changes', label: `Adaptation Log (${currentChanges.length})` },
            { id: 'proposals', label: `Medicine Proposals (${currentProposals.length})` },
            { id: 'discomfort', label: `Discomfort (${currentDiscomforts.length})` },
            { id: 'trends', label: 'Vitals & Pain Trends' },
            { id: 'limits', label: 'Physician Limits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface rounded-xl border border-border">
                <span className="font-bold text-muted uppercase text-[10px]">Readiness / Recovery</span>
                <span className="text-xl font-extrabold text-foreground block mt-1">
                  {currentDayOffset < 0 ? 'Ready for Surgery' : 'On Track Recovery'}
                </span>
                <span className="text-muted text-[11px]">All criteria verified</span>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-border">
                <span className="font-bold text-muted uppercase text-[10px]">Journey Adherence</span>
                <span className="text-xl font-extrabold text-accent block mt-1">93%</span>
                <span className="text-muted text-[11px]">Consistent logs recorded</span>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-border">
                <span className="font-bold text-muted uppercase text-[10px]">Doctor Limits Applied</span>
                <span className="text-xl font-extrabold text-emerald-600 block mt-1">Normal Range</span>
                <span className="text-muted text-[11px]">Systolic max: {limits.systolicMax} mmHg</span>
              </div>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">
                Clinical Overview &amp; Rationale
              </h3>
              <p className="text-muted leading-relaxed">
                Patient is undergoing {activePatient.surgery_type.toUpperCase()} with baseline duration calculated at {activePatient.baseline_plan_days} days.
                Condition modules for {activePatient.conditions.join(' and ')} are active, enforcing sodium restrictions and glycemic monitoring.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: JOURNEY & DAY DETAIL */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            <DayStrip
              plans={currentPlans}
              selectedDayNumber={selectedDayNumber}
              currentDayOffset={currentDayOffset}
              onSelectDay={setSelectedDayNumber}
            />
            <DayDetail
              plan={selectedPlan}
              currentDayOffset={currentDayOffset}
              logs={currentLogs}
              discomforts={currentDiscomforts}
              changes={currentChanges}
              alerts={alerts}
            />
          </div>
        )}

        {/* TAB 3: PLANNER MATRIX WITH REVERT */}
        {activeTab === 'planner' && (
          <PlannerGrid
            baselinePlans={currentPlans}
            currentPlans={currentPlans}
            changes={currentChanges}
            currentDayOffset={currentDayOffset}
          />
        )}

        {/* TAB 4: ADAPTATION LOG WITH REVERT BUTTONS */}
        {activeTab === 'changes' && (
          <div className="space-y-4 text-xs">
            {currentChanges.length === 0 ? (
              <div className="text-center py-12 text-muted bg-surface/50 rounded-xl">
                No adaptations recorded for this patient.
              </div>
            ) : (
              currentChanges.map((chg) => (
                <div key={chg.id} className="p-4 bg-surface rounded-xl border border-border flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-accent-light text-accent font-bold rounded">
                        Day {chg.day_number}
                      </span>
                      <span className="font-bold text-foreground capitalize">{chg.category}</span>
                      <span className="text-muted text-[11px]">• {chg.date}</span>
                    </div>
                    <p className="font-semibold text-foreground">{chg.reason}</p>
                    <p className="text-muted text-[11px]">
                      Before: <em>{chg.before_value}</em> → Live: <strong>{chg.after_value}</strong>
                    </p>
                  </div>
                  {!chg.reverted ? (
                    <button
                      onClick={() => handleRevertChange(chg.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-border rounded-lg text-xs font-bold text-muted hover:text-foreground shrink-0"
                    >
                      Revert Change
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-muted">Reverted</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: MEDICINE PROPOSALS QUEUE */}
        {activeTab === 'proposals' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
              Pending Physician Prescription Proposals
            </h3>
            {currentProposals.length === 0 ? (
              <div className="text-center py-12 text-muted bg-surface/50 rounded-xl">
                No pending proposals. All medication schedules confirmed by physician.
              </div>
            ) : (
              currentProposals.map((prop) => (
                <div key={prop.id} className="p-4 bg-white border border-border rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{prop.medication_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      prop.status === 'pending' ? 'bg-amber-100 text-amber-800' : prop.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                  <p className="text-muted leading-relaxed">{prop.rationale}</p>
                  <p className="text-[11px] font-semibold text-foreground">
                    Proposed Change: <strong>{prop.proposed_instruction}</strong>
                  </p>
                  {prop.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleResolveProposal(prop.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Proposal
                      </button>
                      <button
                        onClick={() => handleResolveProposal(prop.id, 'rejected')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject Proposal
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: DISCOMFORT ANALYSIS */}
        {activeTab === 'discomfort' && (
          <DiscomfortView
            discomforts={currentDiscomforts}
            changes={currentChanges}
            onOpenReportModal={() => alert('Discomfort reported directly by patient in real-time.')}
          />
        )}

        {/* TAB 7: TRENDS */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
              7-Day Vitals &amp; Pain Telemetry
            </h3>
            <div className="h-64 w-full bg-surface/30 rounded-xl p-3 border border-border">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { day: 'Day 1', systolic: 130, sugar: 110, pain: 2 },
                    { day: 'Day 2', systolic: 128, sugar: 108, pain: 3 },
                    { day: 'Day 3', systolic: 132, sugar: 115, pain: 2 },
                    { day: 'Day 4', systolic: 135, sugar: 122, pain: 4 },
                    { day: 'Day 5', systolic: 126, sugar: 105, pain: 3 },
                    { day: 'Day 6', systolic: 124, sugar: 102, pain: 2 },
                    { day: 'Day 7', systolic: 128, sugar: 109, pain: 3 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#2563EB" strokeWidth={2.5} name="Systolic BP" />
                  <Line type="monotone" dataKey="sugar" stroke="#059669" strokeWidth={2} name="Blood Sugar" />
                  <Line type="monotone" dataKey="pain" stroke="#DC2626" strokeWidth={2} name="Pain (0-10)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 8: PHYSICIAN LIMITS */}
        {activeTab === 'limits' && (
          <form onSubmit={handleSaveLimits} className="space-y-4 text-xs max-w-lg">
            <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">
              Physician Safety Ceilings &amp; Limits
            </h3>
            <p className="text-muted">
              Doctor limits strictly override condition modules (Hard Rule 3). Strictest rule wins.
            </p>

            {limitsSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                ✓ Physician safety ceilings saved and synchronized to closed-loop engine.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Systolic BP Ceiling (mmHg)</label>
                <input
                  type="number"
                  value={limits.systolicMax}
                  onChange={(e) => setLimits({ ...limits, systolicMax: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Pain Emergency Threshold</label>
                <input
                  type="number"
                  value={limits.painEmergency}
                  onChange={(e) => setLimits({ ...limits, painEmergency: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Physical Rehabilitation Cap</label>
              <select
                value={limits.workoutCap}
                onChange={(e) => setLimits({ ...limits, workoutCap: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white"
              >
                <option value="minimum">Minimum (Hallway pacing only)</option>
                <option value="light">Light (Up to 15 mins)</option>
                <option value="normal">Normal (Up to 30 mins)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Update Safety Limits
            </button>
          </form>
        )}
      </div>

      {/* 5. REAL-TIME ALERTS INBOX */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-foreground text-sm">Real-Time Clinical Alerts Inbox</h3>
          </div>
          <span className="text-xs text-muted font-medium">{alerts.length} total alerts</span>
        </div>

        <div className="space-y-2.5">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                alt.level === 'emergency'
                  ? 'bg-rose-50 border-rose-200'
                  : alt.level === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  alt.level === 'emergency' ? 'text-rose-600' : 'text-amber-600'
                }`} />
                <div>
                  <span className="font-bold text-foreground block">{alt.message}</span>
                  <span className="text-[11px] text-muted">{alt.created_at}</span>
                </div>
              </div>

              {!alt.acknowledged_by ? (
                <button
                  onClick={() => handleAcknowledgeAlert(alt.id)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-border rounded-lg text-xs font-bold text-foreground shrink-0 shadow-sm"
                >
                  Acknowledge
                </button>
              ) : (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
