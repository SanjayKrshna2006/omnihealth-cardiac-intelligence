export type FusionStatus =
  | 'agreement'
  | 'complementary'
  | 'conflict'
  | 'missing_modality'
  | 'insufficient';

export type HistoryRelationship =
  | 'similar'
  | 'persistent'
  | 'changed'
  | 'new'
  | 'conflicting'
  | 'unknown';

export interface ECGEvidence {
  modality: 'ECG';
  finding: string;
  confidence?: number;
  supporting_evidence: string[];
  model_name: string;
  model_version: string;
  limitations: string[];
  raw_predictions?: Record<string, number>;
  waveform_regions?: Array<{
    lead: number;
    start_sample: number;
    end_sample: number;
    attribution_score: number;
    label: string;
  }>;
  signal_samples?: Record<string, number[]>;
  heart_rate?: number;
  pr_interval?: number;
  qrs_duration?: number;
  qtc_interval?: number;
  rhythm_type?: string;
}

export interface EchoEvidence {
  modality: 'Echocardiogram';
  finding: string;
  confidence?: number;
  evidence: string[];
  visual_evidence_path?: string;
  model_name: string;
  model_version: string;
  limitations: string[];
  lvef?: number;
  raw_predictions?: {
    lvef_estimate?: number;
    class_probabilities?: Record<string, number>;
    predicted_class?: string;
  };
}

export interface FusionResult {
  status: FusionStatus;
  ecg_finding?: string;
  echo_finding?: string;
  agreement_summary: string;
  conflict_description?: string;
  missing_modalities: string[];
  combined_evidence: string[];
  fusion_confidence?: number;
}

export interface HistoryAnalysis {
  relationship: HistoryRelationship;
  previous_ecg_finding?: string;
  previous_echo_finding?: string;
  current_summary: string;
  changes_detected: string[];
  persistent_findings: string[];
  new_findings: string[];
  analysis_notes: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: string;
  evidence: string;
  status: 'suspected' | 'secondary' | 'ruled_out';
}

export interface FinalAssessment {
  supported_findings: string[];
  primary_assessment: string;
  suspected_condition?: string;
  clinical_priority?: string;
  priority_level?: 'critical' | 'high' | 'moderate' | 'routine';
  differential_diagnoses?: DifferentialDiagnosis[];
  diagnostic_recommendations?: string[];
  ecg_evidence_summary: string;
  echo_evidence_summary: string;
  historical_evidence_summary: string;
  cross_modal_analysis: string;
  explanation: string;
  limitations: string[];
  evidence_sufficiency: 'sufficient' | 'partial' | 'insufficient';
  requires_clinical_review: boolean;
}

export interface Patient {
  patient_id: string;
  name?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  created_at?: string;
  medical_history_summary?: string;
}

export interface OmniHealthReport {
  report_id: string;
  patient_id: string;
  assessment_date: string;
  ecg_analysis?: ECGEvidence;
  echo_analysis?: EchoEvidence;
  fusion_result: FusionResult;
  history_analysis?: HistoryAnalysis;
  final_assessment: FinalAssessment;
  pipeline_version: string;
  disclaimer: string;
}

export interface OmniHealthState {
  patient_id: string;
  ecg_file_path?: string;
  echo_file_path?: string;
  previous_ecg_path?: string;
  previous_echo_path?: string;
  previous_reports?: string[];
  ecg_evidence?: ECGEvidence;
  echo_evidence?: EchoEvidence;
  fusion_result?: FusionResult;
  history_analysis?: HistoryAnalysis;
  final_assessment?: FinalAssessment;
  errors: string[];
  pipeline_stage: string;
  missing_modalities: string[];
}
