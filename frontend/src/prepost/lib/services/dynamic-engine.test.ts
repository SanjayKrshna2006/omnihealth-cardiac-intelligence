import { describe, it, expect } from 'vitest';
import { generateBaselinePlan } from './plan-builder';
import { runDynamicEngine } from './dynamic-engine';
import { PatientDetails, PlanRow, LogEntry } from '@/lib/types/database';

describe('Dynamic Engine & Plan Builder - Closed Loop Validation', () => {
  const mockPatient: PatientDetails = {
    patient_id: 'test-p-01',
    name: 'Rajesh Sharma',
    age: 58,
    sex: 'male',
    height_cm: 174,
    weight_kg: 81,
    diet: 'veg',
    allergies: ['Penicillin'],
    language: 'en',
    surgery_type: 'cabg',
    surgery_date: '2026-10-15',
    hospital: 'Fortis Heart Institute',
    surgeon: 'Dr. Arun Kumar',
    conditions: ['diabetes', 'high_blood_pressure'],
    condition_follow_ups: { diabetes: 'Tablets' },
    current_medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', doctor_instruction: 'stop', stop_days_before: 2, confirmed_by_doctor: true },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
    ],
    stage: 'before',
    total_plan_days: 58,
    baseline_plan_days: 58,
    plan_length_reason: 'CABG baseline',
    alert_consent: true,
    consent_at: '2026-10-01T00:00:00Z',
  };

  it('generates a frozen Version 1 baseline plan with correct total days and day offsets', () => {
    const result = generateBaselinePlan(mockPatient);
    expect(result.plans.length).toBeGreaterThanOrEqual(50);
    expect(result.plans[0].version).toBe(1);
    expect(result.plans[0].is_baseline).toBe(true);
    expect(result.plans[0].day_number).toBe(1);

    // Verify surgery day exists at offset 0
    const surgeryDayPlan = result.plans.find((p) => p.day_offset === 0);
    expect(surgeryDayPlan).toBeDefined();
    expect(surgeryDayPlan?.content.meals[0].name).toContain('Fasting');
  });

  it('triggers emergency when pain is severe (>= 8/10)', () => {
    const { plans } = generateBaselinePlan(mockPatient);
    const todayPlan = plans[0];

    const emergencyPainLog: LogEntry = {
      id: 'log-e1',
      patient_id: mockPatient.patient_id,
      day_offset: todayPlan.day_offset,
      date: todayPlan.date,
      kind: 'pain',
      payload: { score: 9 },
      data: { score: 9 },
      logged_at: new Date().toISOString(),
      source: 'quick_log',
    };

    const res = runDynamicEngine({
      patient: mockPatient,
      currentDayOffset: todayPlan.day_offset,
      currentDate: todayPlan.date,
      todayPlan,
      allPlans: plans,
      todayLogs: [emergencyPainLog],
      todayDiscomforts: [],
      limits: {
        sugarMin: 70,
        sugarMax: 180,
        systolicMax: 145,
        painWarn: 5,
        painEmergency: 8,
        workoutCap: 'light',
      },
    });

    expect(res.isEmergency).toBe(true);
    expect(res.emergencyReason).toContain('Severe pain score 9/10');
  });

  it('adapts tomorrow workout and meals when patient skips workout and logs high sugar', () => {
    const { plans } = generateBaselinePlan(mockPatient);
    const todayPlan = plans[0];

    const logs: LogEntry[] = [
      {
        id: 'l1',
        patient_id: mockPatient.patient_id,
        day_offset: todayPlan.day_offset,
        date: todayPlan.date,
        kind: 'workout',
        payload: { status: 'skipped', reason: 'Too fatigued' },
        data: { status: 'skipped', reason: 'Too fatigued' },
        logged_at: new Date().toISOString(),
        source: 'quick_log',
      },
      {
        id: 'l2',
        patient_id: mockPatient.patient_id,
        day_offset: todayPlan.day_offset,
        date: todayPlan.date,
        kind: 'vital',
        payload: { systolic: 130, diastolic: 82, sugar: 210 },
        data: { systolic: 130, diastolic: 82, sugar: 210 },
        logged_at: new Date().toISOString(),
        source: 'quick_log',
      },
    ];

    const res = runDynamicEngine({
      patient: mockPatient,
      currentDayOffset: todayPlan.day_offset,
      currentDate: todayPlan.date,
      todayPlan,
      allPlans: plans,
      todayLogs: logs,
      todayDiscomforts: [],
      limits: {
        sugarMin: 70,
        sugarMax: 180,
        systolicMax: 145,
        painWarn: 5,
        painEmergency: 8,
        workoutCap: 'light',
      },
    });

    expect(res.isEmergency).toBe(false);
    expect(res.planChanges.length).toBeGreaterThan(0);

    const workoutChange = res.planChanges.find((c) => c.category === 'workout');
    expect(workoutChange).toBeDefined();
    expect(workoutChange?.factors).toContain('Workout skipped on current day');

    const mealChange = res.planChanges.find((c) => c.category === 'meals');
    expect(mealChange).toBeDefined();
    expect(mealChange?.factors.some((f) => f.includes('Elevated blood sugar'))).toBe(true);
  });

  it('generates a medicine proposal queue item instead of modifying medicines directly', () => {
    const { plans } = generateBaselinePlan(mockPatient);
    const todayPlan = plans[0];

    const highBpLog: LogEntry[] = [
      {
        id: 'l-bp',
        patient_id: mockPatient.patient_id,
        day_offset: todayPlan.day_offset,
        date: todayPlan.date,
        kind: 'vital',
        payload: { systolic: 168, diastolic: 98 },
        data: { systolic: 168, diastolic: 98 },
        logged_at: new Date().toISOString(),
        source: 'quick_log',
      },
      {
        id: 'l-med',
        patient_id: mockPatient.patient_id,
        day_offset: todayPlan.day_offset,
        date: todayPlan.date,
        kind: 'medicine',
        payload: { status: 'taken' },
        data: { status: 'taken' },
        logged_at: new Date().toISOString(),
        source: 'quick_log',
      },
    ];

    const res = runDynamicEngine({
      patient: mockPatient,
      currentDayOffset: todayPlan.day_offset,
      currentDate: todayPlan.date,
      todayPlan,
      allPlans: plans,
      todayLogs: highBpLog,
      todayDiscomforts: [],
      limits: {
        sugarMin: 70,
        sugarMax: 180,
        systolicMax: 145,
        painWarn: 5,
        painEmergency: 8,
        workoutCap: 'light',
      },
    });

    expect(res.proposals.length).toBeGreaterThan(0);
    const bpProp = res.proposals.find((p) => p.medication_name === 'Anti-hypertensive Regimen');
    expect(bpProp).toBeDefined();
    expect(bpProp?.status).toBe('pending');
    expect(bpProp?.rationale).toContain('Blood pressure reading (168 mmHg) exceeded systolic limit');

    // Ensure engine did not mutate medicine directly in plan without doctor signoff
    const tomorrowPlan = res.updatedPlans.find((p) => p.day_offset === todayPlan.day_offset + 1);
    expect(tomorrowPlan?.content.medicines.every((m) => m.name !== 'Unapproved Dosage Change')).toBe(true);
  });
});
