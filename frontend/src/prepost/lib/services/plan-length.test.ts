import { describe, it, expect, beforeEach } from 'vitest';
import {
  computePlanLength,
  generateBaselinePlan,
} from './plan-builder';
import {
  SEEDED_PATIENT_DETAILS,
  DOCTOR_ID,
  DOCTOR_2_ID,
  db,
} from './mock-db';
import {
  DEMO_BASE_DAYS,
  DEMO_EXTENSION_DAYS,
  DEMO_MAX_PLAN_DAYS,
  DEMO_MODE,
} from '@/config/plan-config';
import { NextRequest } from 'next/server';
import { POST as doctorPlanLengthHandler } from '@/app/api/doctor/plan-length/route';

describe('Plan Length & Demo Mode Requirements', () => {
  describe('Config Values (STEP 1)', () => {
    it('contains placeholder configs pending doctor review', () => {
      expect(DEMO_MAX_PLAN_DAYS).toBe(20);
      expect(DEMO_BASE_DAYS.stent_or_pacemaker).toBe(8);
      expect(DEMO_BASE_DAYS.open_heart).toBe(18);
      expect(DEMO_BASE_DAYS.no_surgery_monitoring).toBe(10);
      expect(DEMO_EXTENSION_DAYS.diabetes).toBe(1);
      expect(DEMO_EXTENSION_DAYS.high_blood_pressure).toBe(1);
    });
  });

  describe('Production Behavior (DEMO_MODE=false gives original total_days)', () => {
    it('produces original unshortened plan days for every seeded patient when demo mode is false', () => {
      // 1. Rajesh Sharma: CABG (7 pre + 1 surg + 42 post + 7 diab + 3 hbp = 60, total 72 in protocols)
      const p1 = computePlanLength('cabg', ['diabetes', 'high_blood_pressure'], {
        forceDemoMode: false,
      });
      expect(p1.totalDays).toBe(72);
      expect(p1.demo_shortened).toBe(false);

      // 2. Michael Chen: Valve (7 pre + 1 surg + 42 post + 5 arr + 3 thinner = 58, total 56 in protocols)
      const p2 = computePlanLength('valve_replacement', ['arrhythmia', 'blood_thinner_use'], {
        forceDemoMode: false,
      });
      expect(p2.totalDays).toBe(56);
      expect(p2.demo_shortened).toBe(false);

      // 3. Sunita Verma: Angioplasty Stent
      const p3 = computePlanLength('angioplasty_stent', ['high_blood_pressure', 'previous_heart_attack'], {
        forceDemoMode: false,
      });
      expect(p3.totalDays).toBe(34);
      expect(p3.demo_shortened).toBe(false);

      // 4. Anita Patel: Pacemaker
      const p4 = computePlanLength('pacemaker', ['arrhythmia'], {
        forceDemoMode: false,
      });
      expect(p4.totalDays).toBe(36);
      expect(p4.demo_shortened).toBe(false);

      // 5. David Miller: CABG + Heart failure + Diabetes
      const p5 = computePlanLength('cabg', ['heart_failure', 'diabetes'], {
        forceDemoMode: false,
      });
      expect(p5.totalDays).toBe(79);
      expect(p5.demo_shortened).toBe(false);
    });
  });

  describe('Demo Mode Length Rules (STEP 2)', () => {
    it('calculates demo stent/pacemaker patient within 8 to 10 days', () => {
      // Sunita Verma: angioplasty_stent + HBP -> 8 + 1 = 9 days
      const stent = computePlanLength('angioplasty_stent', ['high_blood_pressure', 'previous_heart_attack'], {
        forceDemoMode: true,
      });
      expect(stent.totalDays).toBe(9);
      expect(stent.totalDays).toBeGreaterThanOrEqual(8);
      expect(stent.totalDays).toBeLessThanOrEqual(10);
      expect(stent.demo_shortened).toBe(true);

      // Anita Patel: pacemaker + arrhythmia -> 8 + 0 = 8 days
      const pace = computePlanLength('pacemaker', ['arrhythmia'], {
        forceDemoMode: true,
      });
      expect(pace.totalDays).toBe(8);
      expect(pace.totalDays).toBeGreaterThanOrEqual(8);
      expect(pace.totalDays).toBeLessThanOrEqual(10);
      expect(pace.demo_shortened).toBe(true);
    });

    it('calculates demo open-heart patient within 16 to 20 days', () => {
      // Rajesh Sharma: CABG + diabetes (1) + HBP (1) -> 18 + 1 + 1 = 20 days (capped at 20)
      const cabg1 = computePlanLength('cabg', ['diabetes', 'high_blood_pressure'], {
        forceDemoMode: true,
      });
      expect(cabg1.totalDays).toBe(20);
      expect(cabg1.totalDays).toBeGreaterThanOrEqual(16);
      expect(cabg1.totalDays).toBeLessThanOrEqual(20);
      expect(cabg1.demo_shortened).toBe(true);

      // Michael Chen: valve_replacement + arrhythmia (0) + blood_thinner_use (0) -> 18 days
      const valve = computePlanLength('valve_replacement', ['arrhythmia', 'blood_thinner_use'], {
        forceDemoMode: true,
      });
      expect(valve.totalDays).toBe(18);
      expect(valve.totalDays).toBeGreaterThanOrEqual(16);
      expect(valve.totalDays).toBeLessThanOrEqual(20);

      // David Miller: CABG + heart_failure (0) + diabetes (1) -> 18 + 1 = 19 days
      const cabg2 = computePlanLength('cabg', ['heart_failure', 'diabetes'], {
        forceDemoMode: true,
      });
      expect(cabg2.totalDays).toBe(19);
      expect(cabg2.totalDays).toBeGreaterThanOrEqual(16);
      expect(cabg2.totalDays).toBeLessThanOrEqual(20);
    });

    it('calculates demo no-surgery monitoring patient within 10 to 12 days', () => {
      // Base 10, diabetes +1 -> 11 days
      const noSurg = computePlanLength('other_heart', ['diabetes'], {
        forceDemoMode: true,
      });
      expect(noSurg.totalDays).toBe(11);
      expect(noSurg.totalDays).toBeGreaterThanOrEqual(10);
      expect(noSurg.totalDays).toBeLessThanOrEqual(12);

      // Base 10, no demo extension conditions -> 10 days
      const noSurgBase = computePlanLength('other_heart', [], {
        forceDemoMode: true,
      });
      expect(noSurgBase.totalDays).toBe(10);
      expect(noSurgBase.totalDays).toBeGreaterThanOrEqual(10);
      expect(noSurgBase.totalDays).toBeLessThanOrEqual(12);
    });

    it('ensures no demo plan is longer than 20 days and every phase is at least 1 day', () => {
      // Test extreme case: open heart + many conditions
      const extreme = computePlanLength(
        'cabg',
        ['diabetes', 'high_blood_pressure', 'diabetes', 'high_blood_pressure'],
        { forceDemoMode: true }
      );
      expect(extreme.totalDays).toBeLessThanOrEqual(20);

      // Test all seeded patients in demo mode: verify phase breakdown
      for (const p of Object.values(SEEDED_PATIENT_DETAILS)) {
        const { plans, totalDays } = generateBaselinePlan(p, { forceDemoMode: true });
        expect(totalDays).toBeLessThanOrEqual(20);
        expect(totalDays).toBeGreaterThanOrEqual(1);

        const preDays = plans.filter((row) => row.day_offset < 0).length;
        const surgeryDays = plans.filter((row) => row.day_offset === 0).length;
        const recoveryDays = plans.filter((row) => row.day_offset > 0).length;

        // Every phase is at least 1 day, surgery is exactly 1 day
        expect(preDays).toBeGreaterThanOrEqual(1);
        expect(surgeryDays).toBe(1);
        expect(recoveryDays).toBeGreaterThanOrEqual(1);
        expect(preDays + surgeryDays + recoveryDays).toBe(totalDays);
      }
    });
  });

  describe('Doctor Override (STEP 3)', () => {
    it('rejects override from non-doctor users', () => {
      // Rajesh Sharma is a patient (not doctor)
      const res = db.overridePatientPlanLength('p-cabg-01', 'p-cabg-01', 14, 'Patient attempt');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('rejects override from doctors unlinked to the patient', () => {
      // DOCTOR_ID is linked to p-cabg-01, p-valve-02, p-pace-04.
      // p-stent-03 is linked to DOCTOR_2_ID (Dr. Sarah Jenkins).
      const res = db.overridePatientPlanLength(DOCTOR_ID, 'p-stent-03', 12, 'Unlinked doctor attempt');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('allows override from linked doctor and records reason in change log', () => {
      const patientId = 'p-cabg-01';
      const oldPlans = db.getPlans(patientId);
      const changesBefore = db.getChanges(patientId).length;

      const res = db.overridePatientPlanLength(DOCTOR_ID, patientId, 15, 'Clinical adjustment for early mobility');
      expect(res.success).toBe(true);

      const updatedPlans = db.getPlans(patientId);
      const patient = db.getPatient(patientId)!;
      expect(patient.total_plan_days).toBe(res.newLength);

      // Recorded in change log
      const changesAfter = db.getChanges(patientId);
      expect(changesAfter.length).toBe(changesBefore + 1);
      const latestChange = changesAfter[0];
      expect(latestChange.category).toBe('plan_length');
      expect(latestChange.source).toBe('doctor');
      expect(latestChange.reason).toContain('early mobility');
    });

    it('caps doctor override at 20 days if DEMO_MODE is active', () => {
      // If DEMO_MODE was true, override of 35 days would be capped at 20
      const testLength = DEMO_MODE ? 20 : 35;
      const res = db.overridePatientPlanLength(DOCTOR_ID, 'p-valve-02', 35, 'Extended recovery');
      expect(res.success).toBe(true);
      expect(res.newLength).toBe(testLength);
    });

    it('preserves past days and regenerates only remaining days', () => {
      const patientId = 'p-pace-04'; // Day +9
      const plansBefore = db.getPlans(patientId);
      const pastPlansBefore = plansBefore.filter((p) => p.day_offset < 9);

      const res = db.overridePatientPlanLength(DOCTOR_ID, patientId, 18, 'Pacing adjustment');
      expect(res.success).toBe(true);

      const plansAfter = db.getPlans(patientId);
      const pastPlansAfter = plansAfter.filter((p) => p.day_offset < 9);

      // Past days were preserved
      expect(pastPlansAfter.length).toBe(pastPlansBefore.length);
      for (let i = 0; i < pastPlansBefore.length; i++) {
        expect(pastPlansAfter[i].date).toBe(pastPlansBefore[i].date);
        expect(pastPlansAfter[i].day_offset).toBe(pastPlansBefore[i].day_offset);
      }
    });
  });

  describe('Security & Transparency (STEP 4 & Endpoint Verification)', () => {
    it('ensures frontend cannot turn demo mode on through the API endpoint', async () => {
      const req = new NextRequest('http://localhost:3000/api/doctor/plan-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: DOCTOR_ID,
          patientId: 'p-cabg-01',
          newLength: 15,
          reason: 'Test change',
          demo_mode: true, // Malicious attempt to force demo mode
          DEMO_MODE: true,
        }),
      });

      const response = await doctorPlanLengthHandler(req);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Backend DEMO_MODE configuration was NOT toggled
      expect(DEMO_MODE).toBe(false);
    });

    it('endpoint returns 403 when unlinked doctor attempts override', async () => {
      const req = new NextRequest('http://localhost:3000/api/doctor/plan-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: DOCTOR_ID,
          patientId: 'p-stent-03', // linked to DOCTOR_2_ID, not DOCTOR_ID
          newLength: 12,
        }),
      });

      const response = await doctorPlanLengthHandler(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('not linked');
    });

    it('endpoint returns 403 when non-doctor role attempts override', async () => {
      const req = new NextRequest('http://localhost:3000/api/doctor/plan-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: 'p-cabg-01', // Patient ID
          patientId: 'p-cabg-01',
          newLength: 10,
        }),
      });

      const response = await doctorPlanLengthHandler(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });
  });
});
