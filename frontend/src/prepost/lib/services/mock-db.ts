import { DEMO_MAX_PLAN_DAYS, DEMO_MODE } from '@/config/plan-config';
import { runDynamicEngine } from '@/lib/services/dynamic-engine';
import { addDays, generateBaselinePlan } from '@/lib/services/plan-builder';
import type {
  AlertRow,
  CareLink,
  DailyAnalysis,
  DiscomfortReport,
  DoctorLimitRow,
  LogEntry,
  MedicineProposal,
  PatientDetails,
  PlanChangeRecord,
  PlanRow,
  Profile
} from '@/lib/types/database';

export const DOCTOR_ID = '33333333-3333-3333-3333-333333333333';
export const DOCTOR_2_ID = '44444444-4444-4444-4444-444444444444';
export const PATIENT_ID = 'p-cabg-01';

export const SEEDED_PROFILES: Profile[] = [
  {
    id: 'p-cabg-01',
    role: 'patient',
    full_name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '+1 555 123 4567',
    language: 'en',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'p-valve-02',
    role: 'patient',
    full_name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 555 234 5678',
    language: 'en',
    created_at: '2026-09-25T08:00:00Z',
  },
  {
    id: 'p-stent-03',
    role: 'patient',
    full_name: 'Sunita Verma',
    email: 'sunita.verma@example.com',
    phone: '+1 555 345 6789',
    language: 'en',
    created_at: '2026-10-03T08:00:00Z',
  },
  {
    id: 'p-pace-04',
    role: 'patient',
    full_name: 'Anita Patel',
    email: 'anita.patel@example.com',
    phone: '+1 555 456 7890',
    language: 'en',
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'p-cabg-05',
    role: 'patient',
    full_name: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+1 555 567 8901',
    language: 'en',
    created_at: '2026-09-10T08:00:00Z',
  },
  {
    id: DOCTOR_ID,
    role: 'doctor',
    full_name: 'Dr. Arun Kumar',
    specialty: 'Cardiothoracic Surgery',
    hospital: 'Fortis Heart Institute',
    email: 'dr.arun@careloop.health',
    phone: '+1 555 999 8888',
    language: 'en',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: DOCTOR_2_ID,
    role: 'doctor',
    full_name: 'Dr. Sarah Jenkins',
    specialty: 'Interventional Cardiology & EP',
    hospital: 'Metro Heart Hospital',
    email: 'dr.sarah@careloop.health',
    phone: '+1 555 888 7777',
    language: 'en',
    created_at: '2026-09-01T08:00:00Z',
  },
];

export const SEEDED_CARE_LINKS: CareLink[] = [
  {
    id: 'link-01',
    patient_id: 'p-cabg-01',
    user_id: DOCTOR_ID,
    role: 'doctor',
    scope: 'all',
    status: 'active',
    expires_at: null,
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'link-02',
    patient_id: 'p-valve-02',
    user_id: DOCTOR_ID,
    role: 'doctor',
    scope: 'all',
    status: 'active',
    expires_at: null,
    created_at: '2026-09-25T08:00:00Z',
  },
  {
    id: 'link-04',
    patient_id: 'p-pace-04',
    user_id: DOCTOR_ID,
    role: 'doctor',
    scope: 'all',
    status: 'active',
    expires_at: null,
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'link-03',
    patient_id: 'p-stent-03',
    user_id: DOCTOR_2_ID,
    role: 'doctor',
    scope: 'all',
    status: 'active',
    expires_at: null,
    created_at: '2026-10-03T08:00:00Z',
  },
  {
    id: 'link-05',
    patient_id: 'p-cabg-05',
    user_id: DOCTOR_2_ID,
    role: 'doctor',
    scope: 'all',
    status: 'active',
    expires_at: null,
    created_at: '2026-09-10T08:00:00Z',
  },
];

// Today's date anchor for relative demo timing
const TODAY_STR = new Date().toISOString().split('T')[0];

export const SEEDED_PATIENT_DETAILS: Record<string, PatientDetails> = {
  // 1. Day -5 CABG with Diabetes & High Blood Pressure
  'p-cabg-01': {
    patient_id: 'p-cabg-01',
    name: 'Rajesh Sharma',
    age: 58,
    sex: 'male',
    height_cm: 174,
    weight_kg: 81,
    diet: 'veg',
    allergies: ['Penicillin', 'Sulfa'],
    language: 'en',
    surgery_type: 'cabg',
    surgery_date: addDays(TODAY_STR, 5), // 5 days in future -> Day -5
    hospital: 'Fortis Heart Institute',
    surgeon: 'Dr. Arun Kumar',
    conditions: ['diabetes', 'high_blood_pressure'],
    condition_follow_ups: { diabetes: 'Oral tablets (Metformin 500mg twice daily)' },
    current_medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', doctor_instruction: 'stop', stop_days_before: 2, confirmed_by_doctor: true },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Aspirin', dosage: '75mg', frequency: 'Evening', doctor_instruction: 'stop', stop_days_before: 5, confirmed_by_doctor: true },
    ],
    stage: 'before',
    total_plan_days: 58,
    baseline_plan_days: 58,
    plan_length_reason: 'CABG protocol: 7 pre-op + 1 surgery + 42 recovery + 7 diabetes + 3 hypertension = 58 days.',
    alert_consent: true,
    consent_at: '2026-10-01T09:00:00Z',
  },

  // 2. Day +2 Valve Replacement with Arrhythmia & Blood Thinner
  'p-valve-02': {
    patient_id: 'p-valve-02',
    name: 'Michael Chen',
    age: 61,
    sex: 'male',
    height_cm: 178,
    weight_kg: 84,
    diet: 'non-veg',
    allergies: ['Latex'],
    language: 'en',
    surgery_type: 'valve_replacement',
    surgery_date: addDays(TODAY_STR, -2), // 2 days ago -> Day +2
    hospital: 'Fortis Heart Institute',
    surgeon: 'Dr. Arun Kumar',
    conditions: ['arrhythmia', 'blood_thinner_use'],
    condition_follow_ups: { blood_thinner_use: 'Warfarin 3mg nightly' },
    current_medicines: [
      { name: 'Warfarin', dosage: '3mg', frequency: 'Evening', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Bisoprolol', dosage: '2.5mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
    ],
    stage: 'after',
    total_plan_days: 57,
    baseline_plan_days: 57,
    plan_length_reason: 'Heart Valve protocol: 7 pre-op + 1 surgery + 42 recovery + 5 arrhythmia + 3 blood thinner = 57 days.',
    alert_consent: true,
    consent_at: '2026-09-25T11:00:00Z',
  },

  // 3. Day +1 Angioplasty with Stent (PCI) with Previous Heart Attack
  'p-stent-03': {
    patient_id: 'p-stent-03',
    name: 'Sunita Verma',
    age: 64,
    sex: 'female',
    height_cm: 160,
    weight_kg: 68,
    diet: 'veg',
    allergies: ['None known'],
    language: 'en',
    surgery_type: 'angioplasty_stent',
    surgery_date: addDays(TODAY_STR, -1), // 1 day ago -> Day +1
    hospital: 'Metro Heart Hospital',
    surgeon: 'Dr. Sarah Jenkins',
    conditions: ['high_blood_pressure', 'previous_heart_attack'],
    current_medicines: [
      { name: 'Ticagrelor (Brilinta)', dosage: '90mg', frequency: 'Twice daily', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Aspirin', dosage: '81mg', frequency: 'Daily', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Atorvastatin', dosage: '40mg', frequency: 'Night', doctor_instruction: 'continue', confirmed_by_doctor: true },
    ],
    stage: 'after',
    total_plan_days: 27,
    baseline_plan_days: 27,
    plan_length_reason: 'Angioplasty Stent protocol: 3 pre-op + 1 surgery + 14 recovery + 3 hypertension + 7 previous heart attack = 27 days.',
    alert_consent: true,
    consent_at: '2026-10-03T10:00:00Z',
  },

  // 4. Day +9 Pacemaker Implantation with Arrhythmia
  'p-pace-04': {
    patient_id: 'p-pace-04',
    name: 'Anita Patel',
    age: 52,
    sex: 'female',
    height_cm: 165,
    weight_kg: 62,
    diet: 'veg',
    allergies: ['None'],
    language: 'en',
    surgery_type: 'pacemaker',
    surgery_date: addDays(TODAY_STR, -9), // 9 days ago -> Day +9
    hospital: 'Fortis Heart Institute',
    surgeon: 'Dr. Arun Kumar',
    conditions: ['arrhythmia'],
    current_medicines: [
      { name: 'Metoprolol Succinate', dosage: '25mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
    ],
    stage: 'after',
    total_plan_days: 29,
    baseline_plan_days: 29,
    plan_length_reason: 'Pacemaker protocol: 3 pre-op + 1 surgery + 21 recovery + 5 arrhythmia = 29 days.',
    alert_consent: true,
    consent_at: '2026-09-20T09:00:00Z',
  },

  // 5. Day +20 CABG with Heart Failure & Diabetes
  'p-cabg-05': {
    patient_id: 'p-cabg-05',
    name: 'David Miller',
    age: 69,
    sex: 'male',
    height_cm: 182,
    weight_kg: 104,
    diet: 'non-veg',
    allergies: ['Codeine'],
    language: 'en',
    surgery_type: 'cabg',
    surgery_date: addDays(TODAY_STR, -20), // 20 days ago -> Day +20
    hospital: 'Metro Heart Hospital',
    surgeon: 'Dr. Sarah Jenkins',
    conditions: ['heart_failure', 'diabetes'],
    condition_follow_ups: { heart_failure: 'NYHA Class II, EF 38%' },
    current_medicines: [
      { name: 'Entresto (Sacubitril/Valsartan)', dosage: '24/26mg', frequency: 'Twice daily', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Furosemide (Lasix)', dosage: '20mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
      { name: 'Empagliflozin (Jardiance)', dosage: '10mg', frequency: 'Morning', doctor_instruction: 'continue', confirmed_by_doctor: true },
    ],
    stage: 'after',
    total_plan_days: 67,
    baseline_plan_days: 67,
    plan_length_reason: 'CABG protocol: 7 pre-op + 1 surgery + 42 recovery + 10 heart failure + 7 diabetes = 67 days.',
    alert_consent: true,
    consent_at: '2026-09-10T08:30:00Z',
  },
};

// Generate Plans & Seeded Memory Store
class MockDatabaseService {
  private plans: Map<string, PlanRow[]> = new Map();
  private logs: Map<string, LogEntry[]> = new Map();
  private discomforts: Map<string, DiscomfortReport[]> = new Map();
  private analyses: Map<string, DailyAnalysis[]> = new Map();
  private changes: Map<string, PlanChangeRecord[]> = new Map();
  private proposals: Map<string, MedicineProposal[]> = new Map();
  private alerts: AlertRow[] = [];
  private limits: Map<string, DoctorLimitRow['value']> = new Map();
  private careLinks: CareLink[] = [...SEEDED_CARE_LINKS];

  constructor() {
    this.seedAll();
  }

  private seedAll() {
    Object.values(SEEDED_PATIENT_DETAILS).forEach((patient) => {
      // 1. Generate baseline & live plans
      const { plans } = generateBaselinePlan(patient);
      this.plans.set(patient.patient_id, plans);

      // Default limits
      this.limits.set(patient.patient_id, {
        sugarMin: 70,
        sugarMax: 180,
        systolicMax: 145,
        painWarn: 5,
        painEmergency: 8,
        workoutCap: 'light',
      });

      // 2. Seed past logs based on stage
      const patientLogs: LogEntry[] = [];
      const patientDiscomforts: DiscomfortReport[] = [];
      const patientAnalyses: DailyAnalysis[] = [];
      const patientChanges: PlanChangeRecord[] = [];

      // Calculate current day offset
      const d1 = new Date(TODAY_STR);
      const d2 = new Date(patient.surgery_date);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      const currentOffset = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

      // For every day that has passed up to today:
      plans.forEach((plan) => {
        if (plan.day_offset <= currentOffset) {
          // Add meal logs
          patientLogs.push({
            id: `log-${patient.patient_id}-${plan.day_number}-m1`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            date: plan.date,
            kind: 'meal',
            payload: { meal_id: plan.content.meals[0]?.id, eaten: true },
            logged_at: `${plan.date}T08:30:00Z`,
            source: 'form',
          });
          patientLogs.push({
            id: `log-${patient.patient_id}-${plan.day_number}-m2`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            date: plan.date,
            kind: 'meal',
            payload: { meal_id: plan.content.meals[1]?.id, eaten: true },
            logged_at: `${plan.date}T13:00:00Z`,
            source: 'form',
          });

          // Add workout log
          if (plan.day_offset !== 0) {
            patientLogs.push({
              id: `log-${patient.patient_id}-${plan.day_number}-w`,
              patient_id: patient.patient_id,
              day_offset: plan.day_offset,
              date: plan.date,
              kind: 'workout',
              payload: { duration_min: plan.content.workout.duration_min, level: plan.content.workout.level },
              logged_at: `${plan.date}T17:00:00Z`,
              source: 'form',
            });
          }

          // Add vital and pain logs
          const sys = 126 + (plan.day_number % 12);
          const sugar = 105 + (plan.day_number % 25);
          const pain = plan.day_offset <= 0 ? 1 : Math.max(1, 6 - Math.floor(plan.day_offset / 3));

          patientLogs.push({
            id: `log-${patient.patient_id}-${plan.day_number}-v`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            date: plan.date,
            kind: 'vital',
            payload: { systolic: sys, diastolic: 82, sugar },
            logged_at: `${plan.date}T09:00:00Z`,
            source: 'form',
          });

          patientLogs.push({
            id: `log-${patient.patient_id}-${plan.day_number}-p`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            date: plan.date,
            kind: 'pain',
            payload: { score: pain },
            logged_at: `${plan.date}T20:00:00Z`,
            source: 'form',
          });

          // Seed sample analysis
          patientAnalyses.push({
            id: `da-${patient.patient_id}-${plan.day_offset}`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            date: plan.date,
            adherence_by_category: {
              meals: 100,
              workout: plan.day_offset === 0 ? 100 : 85,
              medicines: 100,
              checks: 90,
              overall: 93,
            },
            risk_level: pain > 6 ? 'high' : 'low',
            risk_factors: pain > 6 ? ['Incision tenderness noted'] : [],
            readiness_status: plan.day_offset < 0 ? 'ready' : undefined,
            recovery_status: plan.day_offset > 0 ? (plan.day_offset >= 5 ? 'ahead' : 'on_track') : undefined,
            plan_changes_count: 0,
            summary_text: `Day ${plan.day_offset >= 0 ? `+${plan.day_offset}` : plan.day_offset}: Adherence 93%. Steady recovery within doctor limits.`,
            created_at: `${plan.date}T21:00:00Z`,
          });
        }
      });

      // Add a specific discomfort for Michael Chen (Valve, Day +2)
      if (patient.patient_id === 'p-valve-02') {
        patientDiscomforts.push({
          id: 'disc-valve-01',
          patient_id: 'p-valve-02',
          day_offset: 2,
          date: TODAY_STR,
          symptoms: ['nausea', 'appetite_loss'],
          severity: 4,
          location: 'Abdominal / generalized',
          since_when: 'Since morning medication',
          notes: 'Feeling slight nausea after breakfast porridge.',
          created_at: `${TODAY_STR}T10:15:00Z`,
        });

        patientChanges.push({
          id: 'pc-valve-nausea-swap',
          patient_id: 'p-valve-02',
          day_offset: 3,
          day_number: 11,
          date: addDays(TODAY_STR, 1),
          category: 'meals',
          before_value: 'Standard recovery porridge',
          after_value: 'Ginger & clear rice broth',
          factors: ['Nausea reported', 'Appetite reduction'],
          supporting_data: { severity: 4 },
          source: 'engine',
          reason: 'Engine swapped tomorrow morning meal to ginger & clear rice broth following nausea report.',
          reverted: false,
          created_at: `${TODAY_STR}T10:16:00Z`,
        });
      }

      this.logs.set(patient.patient_id, patientLogs);
      this.discomforts.set(patient.patient_id, patientDiscomforts);
      this.analyses.set(patient.patient_id, patientAnalyses);
      this.changes.set(patient.patient_id, patientChanges);
    });

    // Seed Doctor Alerts
    this.alerts = [
      {
        id: 'alt-01',
        patient_id: 'p-valve-02',
        day_offset: 2,
        level: 'warning',
        message: 'Michael Chen: Reported post-operative nausea (severity 4/10). Meal adapted to ginger broth.',
        created_at: `${TODAY_STR}T10:16:00Z`,
        acknowledged_by: null,
        acknowledged_at: null,
      },
      {
        id: 'alt-02',
        patient_id: 'p-cabg-01',
        day_offset: -5,
        level: 'info',
        message: 'Rajesh Sharma: Fasting blood sugar 128 mg/dL within target pre-op range. Pre-op spirometry on schedule.',
        created_at: `${TODAY_STR}T07:45:00Z`,
        acknowledged_by: DOCTOR_ID,
        acknowledged_at: `${TODAY_STR}T08:00:00Z`,
      },
    ];
  }

  // API METHODS
  getProfile(id: string): Profile | undefined {
    return SEEDED_PROFILES.find((p) => p.id === id);
  }

  getPatient(id: string): PatientDetails | undefined {
    return SEEDED_PATIENT_DETAILS[id];
  }

  getPatientDetails(id: string): PatientDetails | undefined {
    return this.getPatient(id);
  }

  savePatient(details: PatientDetails) {
    SEEDED_PATIENT_DETAILS[details.patient_id] = details;
  }

  updatePatientDetails(id: string, updates: Partial<PatientDetails>) {
    if (SEEDED_PATIENT_DETAILS[id]) {
      SEEDED_PATIENT_DETAILS[id] = { ...SEEDED_PATIENT_DETAILS[id], ...updates };
    }
  }

  setDemoOffset(id: string, offset: number) {
    if (SEEDED_PATIENT_DETAILS[id]) {
      SEEDED_PATIENT_DETAILS[id].demo_offset_days = offset;
    }
  }

  getAllPatients(): PatientDetails[] {
    return Object.values(SEEDED_PATIENT_DETAILS);
  }

  getPlans(patientId: string): PlanRow[] {
    return this.plans.get(patientId) || [];
  }

  savePlans(patientId: string, plans: PlanRow[]) {
    this.plans.set(patientId, plans);
  }

  getLogs(patientId: string): LogEntry[] {
    return this.logs.get(patientId) || [];
  }

  addLog(log: LogEntry) {
    const list = this.logs.get(log.patient_id) || [];
    list.push(log);
    this.logs.set(log.patient_id, list);
  }

  getDiscomforts(patientId: string): DiscomfortReport[] {
    return this.discomforts.get(patientId) || [];
  }

  addDiscomfort(d: DiscomfortReport) {
    const list = this.discomforts.get(d.patient_id) || [];
    list.push(d);
    this.discomforts.set(d.patient_id, list);
  }

  getAnalyses(patientId: string): DailyAnalysis[] {
    return this.analyses.get(patientId) || [];
  }

  addAnalysis(a: DailyAnalysis) {
    const list = this.analyses.get(a.patient_id) || [];
    list.push(a);
    this.analyses.set(a.patient_id, list);
  }

  getChanges(patientId: string): PlanChangeRecord[] {
    return this.changes.get(patientId) || [];
  }

  addChange(c: PlanChangeRecord) {
    const list = this.changes.get(c.patient_id) || [];
    list.unshift(c); // newest first
    this.changes.set(c.patient_id, list);
  }

  revertChange(changeId: string, patientId: string) {
    const list = this.changes.get(patientId) || [];
    const target = list.find((c) => c.id === changeId);
    if (target) {
      target.reverted = true;
    }
  }

  getProposals(patientId: string): MedicineProposal[] {
    return this.proposals.get(patientId) || [];
  }

  addProposal(p: MedicineProposal) {
    const list = this.proposals.get(p.patient_id) || [];
    list.push(p);
    this.proposals.set(p.patient_id, list);
  }

  updateProposalStatus(id: string, patientId: string, status: 'approved' | 'rejected') {
    const list = this.proposals.get(patientId) || [];
    const item = list.find((p) => p.id === id);
    if (item) {
      item.status = status;
      item.resolved_at = new Date().toISOString();
    }
  }

  getLimits(patientId: string): import('@/lib/types/database').DoctorLimits {
    return this.limits.get(patientId) || {
      sugarMin: 70,
      sugarMax: 180,
      systolicMax: 145,
      diastolicMax: 90,
      hrMin: 55,
      hrMax: 100,
      painWarn: 5,
      painEmergency: 8,
      workoutCap: 'light',
    };
  }

  saveLimits(patientId: string, limits: import('@/lib/types/database').DoctorLimits) {
    this.limits.set(patientId, limits);
  }

  getAlerts(patientId?: string): AlertRow[] {
    if (patientId) {
      return this.alerts.filter((a) => a.patient_id === patientId);
    }
    return this.alerts;
  }

  acknowledgeAlert(id: string) {
    const target = this.alerts.find((a) => a.id === id);
    if (target) {
      target.acknowledged_by = DOCTOR_ID;
      target.acknowledged_at = new Date().toISOString();
    }
  }

  getCareLinks(patientId?: string): CareLink[] {
    if (patientId) {
      return this.careLinks.filter((l) => l.patient_id === patientId);
    }
    return this.careLinks;
  }

  isDoctorLinkedToPatient(doctorId: string, patientId: string): boolean {
    const profile = this.getProfile(doctorId);
    if (!profile || profile.role !== 'doctor') {
      return false;
    }
    return this.careLinks.some(
      (link) =>
        link.user_id === doctorId &&
        link.patient_id === patientId &&
        link.status === 'active' &&
        link.role === 'doctor'
    );
  }

  overridePatientPlanLength(
    doctorId: string,
    patientId: string,
    requestedLength: number,
    reason: string
  ): { success: boolean; error?: string; newLength?: number } {
    if (!this.isDoctorLinkedToPatient(doctorId, patientId)) {
      return {
        success: false,
        error: 'Unauthorized: Doctor is not linked to this patient or user does not have doctor role',
      };
    }

    const patient = this.getPatient(patientId);
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // In demo mode, capped at DEMO_MAX_PLAN_DAYS (20), minimum 1.
    // In production (DEMO_MODE=false), doctor override takes requestedLength (minimum 1).
    const effectiveLength = DEMO_MODE
      ? Math.max(1, Math.min(requestedLength, DEMO_MAX_PLAN_DAYS))
      : Math.max(1, requestedLength);

    const oldTotalDays = patient.total_plan_days;
    patient.doctor_length_override = effectiveLength;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const surg = new Date(patient.surgery_date);
    surg.setHours(0, 0, 0, 0);
    const today = new Date(todayDateStr);
    today.setHours(0, 0, 0, 0);
    const currentDayOffset = Math.round((today.getTime() - surg.getTime()) / (1000 * 60 * 60 * 24));

    const existingPlans = this.getPlans(patientId);
    // Regenerate baseline with override
    const { plans: regeneratedPlans } = generateBaselinePlan(patient, {
      doctorOverrideDays: effectiveLength,
    });

    // Regenerate only the remaining days, never past days
    const pastPlans = existingPlans.filter((p) => p.day_offset < currentDayOffset);
    const remainingNewPlans = regeneratedPlans.filter((p) => p.day_offset >= currentDayOffset);

    // Combine and truncate/adjust to effectiveLength
    const updatedPlans = [...pastPlans, ...remainingNewPlans].slice(0, effectiveLength);
    updatedPlans.forEach((p, idx) => {
      p.day_number = idx + 1;
    });

    patient.total_plan_days = effectiveLength;
    this.savePlans(patientId, updatedPlans);

    const docProfile = this.getProfile(doctorId);
    const currentPlan = existingPlans.find((p) => p.day_offset === currentDayOffset) || existingPlans[0];
    const currentDayNum = currentPlan ? currentPlan.day_number : 1;

    const changeRecord: PlanChangeRecord = {
      id: `pc-length-override-${Date.now()}`,
      patient_id: patientId,
      day_offset: currentDayOffset,
      day_number: currentDayNum,
      date: todayDateStr,
      category: 'plan_length',
      before_value: `${oldTotalDays} days`,
      after_value: `${effectiveLength} days`,
      factors: ['Doctor manual override'],
      supporting_data: {
        doctorId,
        doctorName: docProfile?.full_name || doctorId,
        requestedLength,
        effectiveLength,
        reason,
      },
      source: 'doctor',
      reason: `Doctor (${docProfile?.full_name || 'Dr. Arun Kumar'}) adjusted plan length to ${effectiveLength} days. Reason: ${reason}`,
      reverted: false,
      created_at: new Date().toISOString(),
    };
    this.addChange(changeRecord);

    return {
      success: true,
      newLength: effectiveLength,
    };
  }

  runEngineForPatient(patientId: string): import('./dynamic-engine').DynamicEngineResult | null {
    const patient = this.getPatient(patientId);
    if (!patient) return null;
    const plans = this.getPlans(patientId);
    if (plans.length === 0) return null;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const surg = new Date(patient.surgery_date);
    surg.setHours(0, 0, 0, 0);
    const today = new Date(todayDateStr);
    today.setHours(0, 0, 0, 0);
    const dayOffset = Math.round((today.getTime() - surg.getTime()) / (1000 * 60 * 60 * 24));

    // Find current plan for today
    let todayPlan = plans.find((p) => p.is_current && p.day_offset === dayOffset);
    if (!todayPlan) {
      todayPlan = plans.find((p) => p.is_current) || plans[0];
    }

    const todayLogs = this.getLogs(patientId).filter(
      (l) => l.day_offset === dayOffset || l.date === todayDateStr
    );
    const todayDiscomforts = this.getDiscomforts(patientId).filter(
      (d) => d.day_offset === dayOffset || d.date === todayDateStr
    );
    const limits = this.getLimits(patientId);

    const result = runDynamicEngine({
      patient,
      currentDayOffset: dayOffset,
      currentDate: todayDateStr,
      todayPlan,
      allPlans: plans,
      todayLogs,
      todayDiscomforts,
      limits,
    });

    this.savePlans(patientId, result.updatedPlans);

    for (const change of result.planChanges) {
      this.addChange(change);
    }

    for (const prop of result.proposals) {
      this.addProposal(prop);
    }

    this.addAnalysis(result.dailyAnalysis);

    if (result.isEmergency) {
      this.alerts.unshift({
        id: `alert-emerg-${Date.now()}`,
        patient_id: patientId,
        day_offset: dayOffset,
        level: 'emergency',
        message: `EMERGENCY ALERT for ${patient.name}: ${result.emergencyReason}`,
        created_at: new Date().toISOString(),
        acknowledged_by: null,
        acknowledged_at: null,
      });
    }

    return result;
  }
}

export const mockDb = new MockDatabaseService();
export const db = mockDb;
