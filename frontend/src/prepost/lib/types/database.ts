export type UserRole = 'patient' | 'doctor' | 'admin';
export type PatientStage = 'before' | 'surgery' | 'after' | 'recovered';
export type CareScope = 'alerts' | 'plan' | 'all';
export type LogKind = 'meal' | 'workout' | 'medicine' | 'vital' | 'pain' | 'discomfort';
export type AlertLevel = 'info' | 'warning' | 'emergency';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ReadinessStatus = 'ready' | 'needs_attention' | 'not_ready';
export type RecoveryTrajectoryStatus = 'ahead' | 'on_track' | 'lagging' | 'flagged';
export type ChangeSource = 'engine' | 'doctor' | 'date_change' | 'discomfort';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  phone?: string;
  language: string;
  specialty?: string;
  hospital?: string;
  created_at?: string;
}

export interface SurgeryCatalogItem {
  id: string;
  name: string;
  specialty: string;
  default_pre_op_days: number;
  default_recovery_days: number;
}

export interface PatientDetails {
  patient_id: string;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  diet: 'veg' | 'non-veg' | 'vegan' | 'other';
  allergies: string[];
  language: string;
  surgery_type: string;
  surgery_date: string;
  hospital?: string;
  surgeon?: string;
  conditions: string[];
  condition_follow_ups?: Record<string, string>;
  current_medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    doctor_instruction?: 'continue' | 'stop' | 'taper';
    stop_days_before?: number;
    confirmed_by_doctor?: boolean;
  }>;
  stage: PatientStage;
  current_phase_id?: string;
  current_phase_name?: string;
  total_plan_days: number;
  baseline_plan_days: number;
  plan_length_reason?: string;
  demo_offset_days?: number;
  doctor_length_override?: number;
  demo_shortened?: boolean;
  status?: 'in_progress' | 'program_complete';
  alert_consent: boolean;
  consent_at: string;
}

export interface MilestonePhase {
  id: string;
  name: string;
  stage: PatientStage;
  min_days: number;
  clinical_note: string;
  advance_criteria: {
    description: string;
    pain_max?: number;
    adherence_min?: number;
    consecutive_days?: number;
    doctor_signoff?: boolean;
    [key: string]: unknown;
  };
  templates: {
    meals: Array<{ name: string; notes: string }>;
    workout: {
      level: 'minimum' | 'light' | 'normal';
      duration_min: number;
      instructions: string[];
    };
    checks: Array<{ name: string; target: string }>;
    focus_note: string;
  };
}

export interface DayPlanContent {
  stage: PatientStage;
  phase_id: string;
  phase_name: string;
  meals: Array<{ id: string; name: string; notes: string; completed?: boolean; swapped?: boolean }>;
  workout: {
    level: string;
    duration_min: number;
    instructions: string[];
    completed?: boolean;
    stepped_down?: boolean;
  };
  medicines: Array<{
    id: string;
    name: string;
    dosage: string;
    time: string;
    instruction: 'continue' | 'stop' | 'dose_reminder';
    completed?: boolean;
  }>;
  checks: Array<{ id: string; name: string; target: string; completed?: boolean; added_by_engine?: boolean }>;
  focus_note: string;
  advance_progress_note?: string;
}

export interface PlanRow {
  id: string;
  patient_id: string;
  day_offset: number; // e.g. -5, 0 (surgery day), +3
  day_number: number; // 1 to N
  date: string;       // YYYY-MM-DD
  version: number;
  is_current: boolean;
  is_baseline: boolean;
  content: DayPlanContent;
  reasons: string[];
  created_at: string;
  milestone_phase?: MilestonePhase;
}

export interface PlanChangeRecord {
  id: string;
  patient_id: string;
  day_offset: number;
  day_number: number;
  date: string;
  category: 'meals' | 'workout' | 'medicines' | 'checks' | 'phase' | 'plan_length';
  before_value: string;
  after_value: string;
  factors: string[]; // e.g. ["High BP reading 148", "Pain trend rising", "Appetite loss"]
  supporting_data: Record<string, unknown>;
  source: ChangeSource;
  reason: string;
  reverted: boolean;
  created_at: string;
}

export interface DiscomfortReport {
  id: string;
  patient_id: string;
  day_offset: number;
  date: string;
  symptoms: string[];
  severity: number; // 0-10
  location?: string;
  since_when?: string;
  notes?: string;
  created_at: string;
}

export interface MedicineProposal {
  id: string;
  patient_id: string;
  medication_name: string;
  current_instruction: string;
  proposed_instruction: string;
  rationale: string;
  trigger_data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string;
}

export interface DailyAnalysis {
  id: string;
  patient_id: string;
  day_offset: number;
  date: string;
  adherence_by_category: {
    meals: number;
    workout: number;
    medicines: number;
    checks: number;
    overall: number;
  };
  risk_level: RiskLevel;
  risk_factors: string[];
  readiness_status?: ReadinessStatus;
  recovery_status?: RecoveryTrajectoryStatus;
  plan_changes_count: number;
  summary_text: string;
  created_at: string;
}

export interface DoctorSummary {
  id: string;
  patient_id: string;
  kind: 'daily' | 'weekly';
  date: string;
  summary: string;
  key_findings: string[];
  recommended_actions: string[];
}

export interface CareLink {
  id: string;
  patient_id: string;
  user_id: string;
  role: 'doctor';
  scope: CareScope;
  status: 'active' | 'revoked';
  expires_at: string | null;
  created_at: string;
}

export interface DoctorLimits {
  sugarMin: number;
  sugarMax: number;
  systolicMax: number;
  diastolicMax?: number;
  hrMin?: number;
  hrMax?: number;
  painWarn: number;
  painEmergency: number;
  workoutCap: 'minimum' | 'light' | 'normal';
}

export interface DoctorLimitRow {
  id: string;
  patient_id: string;
  set_by: string;
  key: string;
  value: DoctorLimits;
  created_at: string;
}

export interface LogEntry {
  id: string;
  patient_id: string;
  day_offset: number;
  date: string;
  kind: LogKind;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  logged_at?: string;
  created_at?: string;
  source: 'form' | 'checkin' | 'discomfort' | 'quick_log' | 'ai_checkin';
}

export interface AlertRow {
  id: string;
  patient_id: string;
  day_offset?: number;
  level: AlertLevel;
  message: string;
  created_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export interface DoctorQuestion {
  id: string;
  patient_id: string;
  text: string;
  created_at: string;
  answered_at: string | null;
}

export interface AuditLogRow {
  id: number;
  actor_id: string;
  patient_id: string;
  action: string;
  at: string;
}
