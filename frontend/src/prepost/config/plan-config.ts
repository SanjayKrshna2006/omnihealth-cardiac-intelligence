// Backend Plan Duration Configuration
// Values marked "placeholder, pending doctor review" as instructed

export const DEMO_MODE = false; // placeholder, pending doctor review

export const DEMO_MAX_PLAN_DAYS = 20; // placeholder, pending doctor review

export const DEMO_BASE_DAYS = {
  stent_or_pacemaker: 8, // placeholder, pending doctor review
  open_heart: 18, // placeholder, pending doctor review
  no_surgery_monitoring: 10, // placeholder, pending doctor review
} as const;

export const DEMO_EXTENSION_DAYS: Record<string, number> = {
  diabetes: 1, // placeholder, pending doctor review
  high_blood_pressure: 1, // placeholder, pending doctor review
};

export function getProcedureTypeCategory(
  surgeryType: string
): 'open_heart' | 'stent_or_pacemaker' | 'no_surgery_monitoring' {
  switch (surgeryType) {
    case 'cabg':
    case 'valve_replacement':
    case 'congenital_heart_repair':
    case 'aortic_aneurysm_repair':
      return 'open_heart';
    case 'angioplasty_stent':
    case 'pacemaker':
    case 'icd':
    case 'ablation':
      return 'stent_or_pacemaker';
    default:
      return 'no_surgery_monitoring';
  }
}
