import type { PatientDetails, PlanRow, PatientStage } from '@/lib/types/database';
import { mockDb } from '@/lib/services/mock-db';
import { addDays } from '@/lib/services/plan-builder';

export interface JourneyContext {
  patientId: string;
  patientName: string;
  surgeryType: string;
  surgeryDate: string;
  serverDate: string;
  demoOffsetDays: number;
  demo_offset_days: number;
  effectiveDate: string;
  date: string;
  dayOffset: number; // e.g. -5, 0, +2
  dayNumber: number; // 1 to N
  day_number: number;
  day_label: string; // e.g. "Day -5", "Day 1", "Day +2", "Program Complete"
  totalDays: number;
  total_days: number;
  stage: PatientStage;
  relation: 'before' | 'surgery' | 'after';
  relationLabel: string;
  relation_label: string;
  phaseName: string;
  phase: string;
  todayPlan: PlanRow | null;
  status: 'in_progress' | 'program_complete';
  isProgramComplete: boolean;
  demo_shortened: boolean;
}

/**
 * Update demo offset days for a patient (only used in /dev-tools sandbox)
 */
export function setPatientDemoOffset(patientId: string, offsetDays: number): void {
  const patient = mockDb.getPatient(patientId);
  if (patient) {
    patient.demo_offset_days = offsetDays;
  }
}

/**
 * Canonical Single Source of Truth for "Today" and Journey Context.
 * Used identically across all Patient and Doctor views.
 */
export function getJourneyContext(patientId: string): JourneyContext {
  const patient = mockDb.getPatient(patientId) || mockDb.getAllPatients()[0];
  const allPlans = mockDb.getPlans(patient.patient_id);
  const currentPlans = allPlans.filter((p) => p.is_current);

  const serverDate = new Date().toISOString().split('T')[0];
  const demoOffsetDays = patient.demo_offset_days || 0;
  const effectiveDate = addDays(serverDate, demoOffsetDays);

  // Exact calendar offset between effective date and surgery date
  const d1 = new Date(effectiveDate);
  const d2 = new Date(patient.surgery_date);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const dayOffset = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

  // Determine relation & label
  let relation: 'before' | 'surgery' | 'after' = 'before';
  let relationLabel = '';
  let stage: PatientStage = 'before';

  if (dayOffset < 0) {
    relation = 'before';
    stage = 'before';
    const daysUntil = Math.abs(dayOffset);
    relationLabel = `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} before surgery`;
  } else if (dayOffset === 0) {
    relation = 'surgery';
    stage = 'surgery';
    relationLabel = 'Surgery day';
  } else {
    relation = 'after';
    stage = 'after';
    relationLabel = `${dayOffset} ${dayOffset === 1 ? 'day' : 'days'} after surgery`;
  }

  // Find the live plan row for today
  let todayPlan = currentPlans.find((p) => p.day_offset === dayOffset) || null;
  if (!todayPlan && currentPlans.length > 0) {
    // If exact offset not in window, clamp to boundary
    if (dayOffset < currentPlans[0].day_offset) {
      todayPlan = currentPlans[0];
    } else {
      todayPlan = currentPlans[currentPlans.length - 1];
    }
  }

  const lastPlan = currentPlans[currentPlans.length - 1];
  const isPastLastDay = lastPlan ? dayOffset > lastPlan.day_offset : false;
  const isProgramComplete = isPastLastDay;
  const status: 'in_progress' | 'program_complete' = isProgramComplete
    ? 'program_complete'
    : 'in_progress';

  const dayNumber = todayPlan ? todayPlan.day_number : Math.max(1, dayOffset + 8);
  const phaseName = isProgramComplete
    ? 'Program Complete'
    : todayPlan?.content.phase_name ||
      (stage === 'surgery' ? 'Surgery Day Protocol' : 'Recovery Phase');
  const totalDays = patient.total_plan_days;

  const day_label = isProgramComplete
    ? 'Program Complete'
    : dayOffset < 0
    ? `Day ${dayOffset}`
    : dayOffset === 0
    ? 'Surgery Day'
    : `Day +${dayOffset}`;

  const finalRelationLabel = isProgramComplete
    ? 'Recovery program completed'
    : relationLabel;

  return {
    patientId: patient.patient_id,
    patientName: patient.name,
    surgeryType: patient.surgery_type,
    surgeryDate: patient.surgery_date,
    serverDate,
    demoOffsetDays,
    demo_offset_days: demoOffsetDays,
    effectiveDate,
    date: effectiveDate,
    dayOffset,
    dayNumber,
    day_number: dayNumber,
    day_label,
    totalDays,
    total_days: totalDays,
    stage,
    relation,
    relationLabel: finalRelationLabel,
    relation_label: finalRelationLabel,
    phaseName,
    phase: phaseName,
    todayPlan,
    status,
    isProgramComplete,
    demo_shortened: Boolean(patient.demo_shortened),
  };
}
