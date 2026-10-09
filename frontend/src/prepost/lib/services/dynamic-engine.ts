import type {
  PatientDetails,
  PlanRow,
  LogEntry,
  DiscomfortReport,
  DoctorLimitRow,
  PlanChangeRecord,
  MedicineProposal,
  DailyAnalysis,
  DoctorSummary,
  RiskLevel,
  ReadinessStatus,
  RecoveryTrajectoryStatus,
} from '@/lib/types/database';
import { checkRedFlags } from '@/lib/ai/provider';

export interface DynamicEngineInput {
  patient: PatientDetails;
  currentDayOffset: number;
  currentDate: string;
  todayPlan: PlanRow;
  allPlans: PlanRow[];
  todayLogs: LogEntry[];
  todayDiscomforts: DiscomfortReport[];
  limits: DoctorLimitRow['value'];
}

export interface DynamicEngineResult {
  isEmergency: boolean;
  emergencyReason?: string;
  dailyAnalysis: DailyAnalysis;
  updatedPlans: PlanRow[];
  planChanges: PlanChangeRecord[];
  proposals: MedicineProposal[];
  doctorSummary: DoctorSummary;
}

export function runDynamicEngine(input: DynamicEngineInput): DynamicEngineResult {
  const {
    patient,
    currentDayOffset,
    currentDate,
    todayPlan,
    allPlans,
    todayLogs,
    todayDiscomforts,
    limits,
  } = input;

  const planChanges: PlanChangeRecord[] = [];
  const proposals: MedicineProposal[] = [];

  // 1. SAFETY CHECK FIRST
  let isEmergency = false;
  let emergencyReason: string | undefined;

  // Check logs for emergency vitals / pain
  const painLogs = todayLogs.filter((l) => l.kind === 'pain');
  const vitalLogs = todayLogs.filter((l) => l.kind === 'vital');

  const maxPain = painLogs.reduce((max, l) => {
    const val = Number((l.payload as any)?.score || 0);
    return Math.max(max, val);
  }, 0);

  const highestSystolic = vitalLogs.reduce((max, l) => {
    const val = Number((l.payload as any)?.systolic || 0);
    return Math.max(max, val);
  }, 0);

  const highestSugar = vitalLogs.reduce((max, l) => {
    const val = Number((l.payload as any)?.sugar || 0);
    return Math.max(max, val);
  }, 0);

  // Check discomfort severity
  const maxDiscomfortSeverity = todayDiscomforts.reduce((max, d) => Math.max(max, d.severity), 0);

  if (maxPain >= (limits?.painEmergency || 8)) {
    isEmergency = true;
    emergencyReason = `Severe pain score ${maxPain}/10 exceeds emergency threshold (${limits?.painEmergency || 8}). Activity safely paused.`;
  } else if (highestSystolic > (limits?.systolicMax || 150) + 20) {
    isEmergency = true;
    emergencyReason = `Critical systolic blood pressure (${highestSystolic} mmHg) exceeds emergency ceiling. Immediate clinical evaluation required.`;
  } else if (highestSugar > (limits?.sugarMax || 180) + 120) {
    isEmergency = true;
    emergencyReason = `Severe hyperglycemia (${highestSugar} mg/dL). Immediate medical stabilization required.`;
  }

  // Check red flag symptom keywords in discomforts or check-in notes
  todayDiscomforts.forEach((d) => {
    const combinedNotes = `${d.symptoms.join(' ')} ${d.notes || ''}`;
    const rf = checkRedFlags(combinedNotes);
    if (rf.flagged) {
      isEmergency = true;
      emergencyReason = `Emergency clinical warning: Patient reported red-flag symptom (${rf.matchedKeyword || 'critical symptom'}). Adaptation paused. Call emergency or surgical team immediately.`;
    }
  });

  // 2. SCORE THE DAY (ADHERENCE & VITALS)
  const mealsDone = todayLogs.filter((l) => {
    if (l.kind !== 'meal') return false;
    const status = (l.data?.status || l.payload?.status) as string | undefined;
    return status === 'eaten' || !status;
  }).length;

  const workoutDone = todayLogs.filter((l) => {
    if (l.kind !== 'workout') return false;
    const status = (l.data?.status || l.payload?.status) as string | undefined;
    return status === 'done' || (!status && !l.data?.reason && !l.payload?.reason);
  }).length;
  const workoutSkipped = todayLogs.some((l) => {
    if (l.kind !== 'workout') return false;
    const status = (l.data?.status || l.payload?.status) as string | undefined;
    return status === 'skipped';
  });

  const medicinesDone = todayLogs.filter((l) => {
    if (l.kind !== 'medicine') return false;
    const status = (l.data?.status || l.payload?.status) as string | undefined;
    return status === 'taken' || !status;
  }).length;
  const checksLogged = todayLogs.filter((l) => l.kind === 'vital').length;

  const plannedMealsCount = todayPlan.content.meals.length || 3;
  const plannedWorkoutCount = 1;
  const plannedMedicinesCount = todayPlan.content.medicines.length || 1;
  const plannedChecksCount = todayPlan.content.checks.length || 2;

  const mealAdherence = Math.min(1, mealsDone / plannedMealsCount);
  const workoutAdherence = workoutSkipped ? 0 : Math.min(1, workoutDone / plannedWorkoutCount);
  const medicineAdherence = Math.min(1, medicinesDone / plannedMedicinesCount);
  const checksAdherence = Math.min(1, checksLogged / plannedChecksCount);
  const overallAdherence = Math.round(
    ((mealAdherence + workoutAdherence + medicineAdherence + checksAdherence) / 4) * 100
  );

  // Determine Risk Factors and Risk Level
  const riskFactors: string[] = [];
  if (highestSystolic > (limits?.systolicMax || 150)) {
    riskFactors.push(`Systolic BP ${highestSystolic} mmHg exceeded limit (${limits?.systolicMax || 150})`);
  }
  if (highestSugar > (limits?.sugarMax || 180)) {
    riskFactors.push(`Blood glucose ${highestSugar} mg/dL exceeded ceiling (${limits?.sugarMax || 180})`);
  }
  if (maxPain >= (limits?.painWarn || 5)) {
    riskFactors.push(`Pain level ${maxPain}/10 requires observation`);
  }
  if (todayDiscomforts.length > 0) {
    riskFactors.push(`Discomfort reported: ${todayDiscomforts.map((d) => d.symptoms.join(', ')).join('; ')}`);
  }
  if (workoutAdherence === 0 && todayPlan.content.stage !== 'surgery') {
    riskFactors.push('Planned physical rehabilitation was skipped');
  }
  if (medicineAdherence < 0.8) {
    riskFactors.push('Medication adherence below 80%');
  }

  let riskLevel: RiskLevel = 'low';
  if (isEmergency) riskLevel = 'critical';
  else if (riskFactors.length >= 2 || maxPain >= 6) riskLevel = 'high';
  else if (riskFactors.length === 1 || overallAdherence < 70) riskLevel = 'medium';

  // 3. READINESS (PRE-OP) OR RECOVERY TRAJECTORY (POST-OP)
  let readinessStatus: ReadinessStatus | undefined;
  let recoveryStatus: RecoveryTrajectoryStatus | undefined;

  if (currentDayOffset < 0) {
    if (isEmergency || riskFactors.some((r) => r.includes('Critical') || r.includes('Severe'))) {
      readinessStatus = 'not_ready';
    } else if (riskFactors.length > 0 || overallAdherence < 75) {
      readinessStatus = 'needs_attention';
    } else {
      readinessStatus = 'ready';
    }
  } else if (currentDayOffset > 0) {
    if (isEmergency || maxPain >= 7) {
      recoveryStatus = 'flagged';
    } else if (workoutAdherence < 0.5 || maxPain >= 5) {
      recoveryStatus = 'lagging';
    } else if (overallAdherence >= 90 && maxPain <= 2) {
      recoveryStatus = 'ahead';
    } else {
      recoveryStatus = 'on_track';
    }
  }

  // 4. CLOSED LOOP PLAN REWRITING (Today's remaining items, tomorrow and future days)
  const updatedPlans = allPlans.map((plan) => {
    // Only adapt current day and future days; past days are frozen history
    if (plan.day_offset < currentDayOffset || !plan.is_current) {
      return plan;
    }

    const isTomorrow = plan.day_offset === currentDayOffset + 1;
    const isFuture = plan.day_offset >= currentDayOffset;

    if (!isFuture) return plan;

    const newContent = { ...plan.content };
    const factors: string[] = [];
    const changeReasons: string[] = [];

    // ADAPTATION A: WORKOUT STEP DOWN
    if (workoutSkipped || workoutAdherence === 0 || maxPain >= 5 || maxDiscomfortSeverity >= 5) {
      if (newContent.workout.level === 'normal') {
        const prevLevel = newContent.workout.level;
        newContent.workout.level = 'light';
        newContent.workout.duration_min = Math.max(10, newContent.workout.duration_min - 10);
        newContent.workout.instructions = [
          'Target adjusted to LIGHT activity: Slow paced walking with frequent rests.',
          'Duration reduced because yesterday was skipped or pain/discomfort was elevated.',
        ];
        newContent.workout.stepped_down = true;

        if (isTomorrow) {
          factors.push('Workout skipped / pain reported');
          planChanges.push({
            id: `pc-${patient.patient_id}-${plan.day_number}-workout-${Date.now()}`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            day_number: plan.day_number,
            date: plan.date,
            category: 'workout',
            before_value: `Level: ${prevLevel}`,
            after_value: `Level: ${newContent.workout.level} (${newContent.workout.duration_min} min)`,
            factors: ['Workout skipped', `Pain score ${maxPain}/10`],
            supporting_data: { maxPain, workoutAdherence },
            source: 'engine',
            reason: 'Engine stepped down workout one tier to prevent cardiovascular and surgical strain.',
            reverted: false,
            created_at: new Date().toISOString(),
          });
        }
      } else if (newContent.workout.level === 'light') {
        const prevLevel = newContent.workout.level;
        newContent.workout.level = 'minimum';
        newContent.workout.duration_min = 5;
        newContent.workout.instructions = ['Gentle hallway pacing only, pause immediately if pain recurs.'];
        newContent.workout.stepped_down = true;

        if (isTomorrow) {
          planChanges.push({
            id: `pc-${patient.patient_id}-${plan.day_number}-workout-${Date.now()}`,
            patient_id: patient.patient_id,
            day_offset: plan.day_offset,
            day_number: plan.day_number,
            date: plan.date,
            category: 'workout',
            before_value: `Level: ${prevLevel} (15 min)`,
            after_value: `Level: minimum (5 min)`,
            factors: ['Workout skipped on current day', `Pain score ${maxPain}/10`],
            supporting_data: { maxPain, workoutAdherence },
            source: 'engine',
            reason: 'Engine stepped down workout to minimum tier following skipped session or discomfort.',
            reverted: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // ADAPTATION B: MEALS MODIFICATION (Nausea / high glucose / high BP)
    const hasNausea = todayDiscomforts.some((d) => d.symptoms.includes('nausea') || d.symptoms.includes('appetite_loss'));
    if (hasNausea && isTomorrow) {
      newContent.meals = newContent.meals.map((m, idx) => ({
        ...m,
        name: idx === 0 ? 'Gentle Hydrating Ginger & Rice Broth' : m.name,
        notes: 'Small frequent portions, low fiber, bland digestible profile (adapted for nausea).',
        swapped: true,
      }));

      planChanges.push({
        id: `pc-${patient.patient_id}-${plan.day_number}-meals-${Date.now()}`,
        patient_id: patient.patient_id,
        day_offset: plan.day_offset,
        day_number: plan.day_number,
        date: plan.date,
        category: 'meals',
        before_value: 'Standard recovery meal',
        after_value: 'Bland ginger & rice broth (nausea swap)',
        factors: ['Nausea reported', 'Appetite reduction'],
        supporting_data: { symptoms: ['nausea'] },
        source: 'engine',
        reason: 'Adapted tomorrow breakfast to bland, easy-to-digest nourishment following nausea report.',
        reverted: false,
        created_at: new Date().toISOString(),
      });
    } else if (highestSugar > (limits?.sugarMax || 180) && isTomorrow) {
      newContent.meals = newContent.meals.map((m, idx) => ({
        ...m,
        name: idx === 0 ? 'Low-Glycemic Steel Cut Oats with Chia' : m.name,
        notes: 'Strict low simple carbohydrates, high soluble fiber to stabilize blood glucose.',
        swapped: true,
      }));

      planChanges.push({
        id: `pc-${patient.patient_id}-${plan.day_number}-meals-sugar-${Date.now()}`,
        patient_id: patient.patient_id,
        day_offset: plan.day_offset,
        day_number: plan.day_number,
        date: plan.date,
        category: 'meals',
        before_value: 'Standard pre/post-op nutrition',
        after_value: 'Low-glycemic complex carbohydrate swap',
        factors: [`Elevated blood sugar reading: ${highestSugar} mg/dL exceeds limit ${limits?.sugarMax || 180}`],
        supporting_data: { highestSugar, limit: limits?.sugarMax || 180 },
        source: 'engine',
        reason: 'Automated dietary swap to low-glycemic meals following elevated glucose telemetry.',
        reverted: false,
        created_at: new Date().toISOString(),
      });
    }

    // ADAPTATION C: EXTRA CHECKS (e.g. High BP or High Sugar)
    if (highestSystolic > (limits?.systolicMax || 150) && isTomorrow) {
      const alreadyHasExtra = newContent.checks.some((c) => c.name.includes('Additional Midday BP'));
      if (!alreadyHasExtra) {
        newContent.checks.push({
          id: `c-${plan.day_number}-extra-bp`,
          name: 'Additional Midday Blood Pressure Reading',
          target: '< 135/85 mmHg (Triggered by elevated reading)',
          added_by_engine: true,
        });

        planChanges.push({
          id: `pc-${patient.patient_id}-${plan.day_number}-checks-${Date.now()}`,
          patient_id: patient.patient_id,
          day_offset: plan.day_offset,
          day_number: plan.day_number,
          date: plan.date,
          category: 'checks',
          before_value: 'Standard BP monitoring',
          after_value: 'Added Midday Blood Pressure check',
          factors: [`Systolic BP reached ${highestSystolic} mmHg`],
          supporting_data: { highestSystolic },
          source: 'engine',
          reason: 'Engine scheduled an extra midday blood pressure reading following elevated reading.',
          reverted: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      ...plan,
      version: plan.version + 1,
      content: newContent,
      reasons: changeReasons.length > 0 ? changeReasons : plan.reasons,
    };
  });

  // 5. MEDICINE PROPOSALS (Engine NEVER changes medicine directly)
  if (highestSystolic > (limits?.systolicMax || 150)) {
    proposals.push({
      id: `prop-${patient.patient_id}-bp-review-${Date.now()}`,
      patient_id: patient.patient_id,
      medication_name: 'Anti-hypertensive Regimen',
      current_instruction: 'Standard dosage',
      proposed_instruction: 'Physician Review: Evaluate blood pressure medication adjustments',
      rationale: `Blood pressure reading (${highestSystolic} mmHg) exceeded systolic limit (${limits?.systolicMax || 150} mmHg)`,
      trigger_data: { highestSystolic, systolicMax: limits?.systolicMax || 150 },
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  if (medicineAdherence < 0.6) {
    proposals.push({
      id: `prop-${patient.patient_id}-med-adherence-${Date.now()}`,
      patient_id: patient.patient_id,
      medication_name: 'Prescription Schedule',
      current_instruction: 'Patient missing >40% of scheduled doses',
      proposed_instruction: 'Clinical Review: Evaluate dosage schedule and potential side-effects with patient',
      rationale: `Recorded medication adherence was ${Math.round(medicineAdherence * 100)}%. Requires physician follow-up.`,
      trigger_data: { medicineAdherence },
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  // 6. BUILD DAILY ANALYSIS AND DOCTOR SUMMARY
  const summaryText = isEmergency
    ? `EMERGENCY ALERT: ${emergencyReason}`
    : `Day ${currentDayOffset >= 0 ? `+${currentDayOffset}` : currentDayOffset}: Adherence ${overallAdherence}%. Risk level: ${riskLevel.toUpperCase()}. ${
        riskFactors.length > 0 ? `Factors: ${riskFactors.join(', ')}.` : 'Recovering steadily within limits.'
      }`;

  const dailyAnalysis: DailyAnalysis = {
    id: `da-${patient.patient_id}-day-${currentDayOffset}-${Date.now()}`,
    patient_id: patient.patient_id,
    day_offset: currentDayOffset,
    date: currentDate,
    adherence_by_category: {
      meals: Math.round(mealAdherence * 100),
      workout: Math.round(workoutAdherence * 100),
      medicines: Math.round(medicineAdherence * 100),
      checks: Math.round(checksAdherence * 100),
      overall: overallAdherence,
    },
    risk_level: riskLevel,
    risk_factors: riskFactors,
    readiness_status: readinessStatus,
    recovery_status: recoveryStatus,
    plan_changes_count: planChanges.length,
    summary_text: summaryText,
    created_at: new Date().toISOString(),
  };

  const doctorSummary: DoctorSummary = {
    id: `ds-${patient.patient_id}-${currentDate}`,
    patient_id: patient.patient_id,
    kind: 'daily',
    date: currentDate,
    summary: summaryText,
    key_findings: [
      `Overall adherence: ${overallAdherence}% (Meals: ${Math.round(mealAdherence * 100)}%, Workout: ${Math.round(workoutAdherence * 100)}%, Meds: ${Math.round(medicineAdherence * 100)}%)`,
      `Peak systolic BP: ${highestSystolic || 'Not logged'} mmHg • Peak glucose: ${highestSugar || 'Not logged'} mg/dL • Pain: ${maxPain}/10`,
      readinessStatus ? `Pre-Op Readiness: ${readinessStatus.toUpperCase()}` : `Recovery Trajectory: ${recoveryStatus?.toUpperCase() || 'ON TRACK'}`,
    ],
    recommended_actions: riskFactors.length > 0
      ? riskFactors.map((rf) => `Review ${rf}`)
      : ['Continue current baseline protocol'],
  };

  return {
    isEmergency,
    emergencyReason,
    dailyAnalysis,
    updatedPlans,
    planChanges,
    proposals,
    doctorSummary,
  };
}
