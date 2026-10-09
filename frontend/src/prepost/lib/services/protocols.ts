import cabgProtocol from '@/config/protocols/cabg.json';
import valveProtocol from '@/config/protocols/valve_replacement.json';
import stentProtocol from '@/config/protocols/angioplasty_stent.json';
import pacemakerProtocol from '@/config/protocols/pacemaker.json';
import icdProtocol from '@/config/protocols/icd.json';
import ablationProtocol from '@/config/protocols/ablation.json';
import congenitalProtocol from '@/config/protocols/congenital_heart_repair.json';
import aneurysmProtocol from '@/config/protocols/aortic_aneurysm_repair.json';
import otherHeartProtocol from '@/config/protocols/other_heart.json';

import diabetesCond from '@/config/conditions/diabetes.json';
import hbpCond from '@/config/conditions/high_blood_pressure.json';
import heartFailureCond from '@/config/conditions/heart_failure.json';
import prevHeartAttackCond from '@/config/conditions/previous_heart_attack.json';
import arrhythmiaCond from '@/config/conditions/arrhythmia.json';
import kidneyCond from '@/config/conditions/kidney_disease.json';
import thyroidCond from '@/config/conditions/thyroid.json';
import lungCond from '@/config/conditions/lung_disease.json';
import obesityCond from '@/config/conditions/obesity.json';
import anemiaCond from '@/config/conditions/anemia.json';
import bloodThinnerCond from '@/config/conditions/blood_thinner_use.json';
import smokingCond from '@/config/conditions/smoking.json';
import alcoholCond from '@/config/conditions/alcohol.json';

import type { SurgeryCatalogItem } from '@/lib/types/database';

export const SURGERY_PROTOCOLS_MAP: Record<string, any> = {
  cabg: cabgProtocol,
  valve_replacement: valveProtocol,
  angioplasty_stent: stentProtocol,
  pacemaker: pacemakerProtocol,
  icd: icdProtocol,
  ablation: ablationProtocol,
  congenital_heart_repair: congenitalProtocol,
  aortic_aneurysm_repair: aneurysmProtocol,
  other_heart: otherHeartProtocol,
};

export const SURGERY_CATALOG: SurgeryCatalogItem[] = [
  { id: 'cabg', name: 'CABG (Coronary Artery Bypass)', specialty: 'Cardiothoracic Surgery', default_pre_op_days: 7, default_recovery_days: 42 },
  { id: 'valve_replacement', name: 'Heart Valve Replacement (Aortic / Mitral / Other)', specialty: 'Cardiothoracic Surgery', default_pre_op_days: 7, default_recovery_days: 42 },
  { id: 'angioplasty_stent', name: 'Angioplasty with Stent (PCI)', specialty: 'Interventional Cardiology', default_pre_op_days: 3, default_recovery_days: 14 },
  { id: 'pacemaker', name: 'Pacemaker Implantation', specialty: 'Electrophysiology', default_pre_op_days: 3, default_recovery_days: 21 },
  { id: 'icd', name: 'ICD Implantation (Defibrillator)', specialty: 'Electrophysiology', default_pre_op_days: 3, default_recovery_days: 28 },
  { id: 'ablation', name: 'Catheter Ablation (Arrhythmia / AFib)', specialty: 'Electrophysiology', default_pre_op_days: 3, default_recovery_days: 14 },
  { id: 'congenital_heart_repair', name: 'Congenital Heart Defect Repair (ASD / VSD)', specialty: 'Congenital Heart Surgery', default_pre_op_days: 7, default_recovery_days: 35 },
  { id: 'aortic_aneurysm_repair', name: 'Aortic Aneurysm Repair', specialty: 'Vascular & Cardiac Surgery', default_pre_op_days: 7, default_recovery_days: 42 },
  { id: 'other_heart', name: 'Other Heart Procedure (Doctor Plan)', specialty: 'Cardiology / Cardiothoracic', default_pre_op_days: 5, default_recovery_days: 30 },
];

export const CONDITIONS_MAP: Record<string, any> = {
  diabetes: diabetesCond,
  high_blood_pressure: hbpCond,
  heart_failure: heartFailureCond,
  previous_heart_attack: prevHeartAttackCond,
  arrhythmia: arrhythmiaCond,
  kidney_disease: kidneyCond,
  thyroid: thyroidCond,
  lung_disease: lungCond,
  asthma_copd: lungCond, // backward compatibility alias
  obesity: obesityCond,
  anemia: anemiaCond,
  blood_thinner_use: bloodThinnerCond,
  smoking: smokingCond,
  alcohol: alcoholCond,
};

export const CONDITIONS_CATALOG = [
  { id: 'diabetes', name: 'Diabetes (Type 1 or 2)', follow_up_prompt: 'Are you taking insulin or oral tablets?' },
  { id: 'high_blood_pressure', name: 'High Blood Pressure (Hypertension)' },
  { id: 'heart_failure', name: 'Heart Failure (CHF / Low Ejection Fraction)' },
  { id: 'previous_heart_attack', name: 'Previous Heart Attack (Myocardial Infarction)' },
  { id: 'arrhythmia', name: 'Arrhythmia / Irregular Heartbeat (AFib / Flutter)' },
  { id: 'kidney_disease', name: 'Kidney Disease' },
  { id: 'thyroid', name: 'Thyroid Disorder' },
  { id: 'lung_disease', name: 'Lung Disease (COPD / Asthma / Pulmonary)' },
  { id: 'obesity', name: 'Obesity' },
  { id: 'anemia', name: 'Anemia' },
  { id: 'blood_thinner_use', name: 'Blood Thinner Use (Aspirin, Plavix, Warfarin, Eliquis, Xarelto)', follow_up_prompt: 'Which blood thinner are you taking and daily dose?' },
  { id: 'smoking', name: 'Smoking / Tobacco Use' },
  { id: 'alcohol', name: 'Alcohol Use History' },
  { id: 'none', name: 'None of the above' },
];

export function getSurgeryProtocol(surgeryType: string) {
  return SURGERY_PROTOCOLS_MAP[surgeryType] || SURGERY_PROTOCOLS_MAP.cabg;
}

export function getConditionModules(conditionIds: string[]) {
  return conditionIds
    .filter((id) => id !== 'none')
    .map((id) => CONDITIONS_MAP[id])
    .filter(Boolean);
}
