import { getConditionModules, getSurgeryProtocol } from '@/lib/services/protocols';
import type {
  DayPlanContent,
  MilestonePhase,
  PatientDetails,
  PatientStage,
  PlanRow,
} from '@/lib/types/database';
import {
  DEMO_MAX_PLAN_DAYS,
  DEMO_BASE_DAYS,
  DEMO_EXTENSION_DAYS,
  getProcedureTypeCategory,
} from '@/config/plan-config';

export interface PlanGenerationResult {
  totalDays: number;
  baselineLength: number;
  lengthReason: string;
  plans: PlanRow[];
  demo_shortened?: boolean;
}

export interface PlanLengthBreakdown {
  preDays: number;
  recoveryDays: number;
  conditionExtensions: number;
  totalDays: number;
  reason: string;
  demo_shortened: boolean;
}

export function computePlanLength(
  surgeryType: string,
  conditions: string[],
  options?: {
    doctorOverrideDays?: number;
    forceDemoMode?: boolean;
  }
): PlanLengthBreakdown {
  const protocol = getSurgeryProtocol(surgeryType);
  const conditionMods = getConditionModules(conditions);

  const realPreDays = protocol.pre_op_days || 5;
  const realRecoveryDays = protocol.expected_recovery_days || 28;

  let realConditionExtensions = 0;
  const extensionDetails: string[] = [];

  conditionMods.forEach((c: any) => {
    if (c.extension_days) {
      realConditionExtensions += c.extension_days;
      extensionDetails.push(`+${c.extension_days} days for ${c.name}`);
    }
  });

  const isDemo =
    options?.forceDemoMode !== undefined
      ? options.forceDemoMode
      : false;

  if (isDemo) {
    const procCategory = getProcedureTypeCategory(surgeryType);
    const demoBase = DEMO_BASE_DAYS[procCategory];

    let demoExtensions = 0;
    conditions.forEach((cond) => {
      if (DEMO_EXTENSION_DAYS[cond] !== undefined) {
        demoExtensions += DEMO_EXTENSION_DAYS[cond];
      }
    });

    let targetTotal =
      options?.doctorOverrideDays !== undefined
        ? options.doctorOverrideDays
        : demoBase + demoExtensions;

    // Capped at DEMO_MAX_PLAN_DAYS (20), minimum of 1
    targetTotal = Math.max(1, Math.min(DEMO_MAX_PLAN_DAYS, targetTotal));

    // Keep every phase at least 1 day (before surgery, surgery day, recovery), surgery day is exactly 1 day.
    // For 3 phases, minimum total days is 3.
    const effectiveTotal = Math.max(3, targetTotal);
    const remainingDays = effectiveTotal - 1; // non-surgery days

    // Split remaining days between before surgery and recovery in the same proportion as real config
    const realTotalNonSurgery = realPreDays + realRecoveryDays + realConditionExtensions;
    const preProportion = realTotalNonSurgery > 0 ? realPreDays / realTotalNonSurgery : 0.2;

    let preDays = Math.round(remainingDays * preProportion);
    preDays = Math.max(1, Math.min(remainingDays - 1, preDays));
    const recoveryDays = remainingDays - preDays;
    const totalDays = preDays + 1 + recoveryDays;

    const reason = `Demo mode calculation: ${preDays} pre-op days + 1 surgery day + ${recoveryDays} recovery days = ${totalDays} total days (capped at ${DEMO_MAX_PLAN_DAYS} days). Baseline shortened for demonstration purposes.`;

    return {
      preDays,
      recoveryDays,
      conditionExtensions: demoExtensions,
      totalDays,
      reason,
      demo_shortened: true,
    };
  }

  // When DEMO_MODE is false: original logic runs exactly as before
  let totalDays = realPreDays + 1 + realRecoveryDays + realConditionExtensions;
  if (options?.doctorOverrideDays !== undefined) {
    totalDays = options.doctorOverrideDays;
  }

  const reason = `Baseline calculation: ${realPreDays} pre-op days + 1 surgery day + ${realRecoveryDays} standard ${protocol.name} recovery days${realConditionExtensions > 0 ? ` + ${realConditionExtensions} extension days (${extensionDetails.join(', ')})` : ''
    }. Live recovery pace will adapt this duration.`;

  return {
    preDays: realPreDays,
    recoveryDays: realRecoveryDays,
    conditionExtensions: realConditionExtensions,
    totalDays,
    reason,
    demo_shortened: false,
  };
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getDaysDiff(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateBaselinePlan(
  details: PatientDetails,
  options?: {
    isBaseline?: boolean;
    version?: number;
    forceDemoMode?: boolean;
    doctorOverrideDays?: number;
  }
): PlanGenerationResult {
  const protocol = getSurgeryProtocol(details.surgery_type);
  const conditionMods = getConditionModules(details.conditions);
  const { preDays, totalDays, reason, demo_shortened } = computePlanLength(
    details.surgery_type,
    details.conditions,
    {
      doctorOverrideDays: options?.doctorOverrideDays ?? details.doctor_length_override,
      forceDemoMode: options?.forceDemoMode,
    }
  );

  details.total_plan_days = totalDays;
  details.baseline_plan_days = totalDays;
  details.plan_length_reason = reason;
  details.demo_shortened = demo_shortened;

  const version = options?.version ?? 1;
  const isBaseline = options?.isBaseline ?? true;

  const plans: PlanRow[] = [];
  const surgeryDate = details.surgery_date;

  // Day 1 start date = surgery_date - preDays
  const startDateStr = addDays(surgeryDate, -preDays);

  const prePhases: MilestonePhase[] = protocol.phases.filter((p: any) => p.stage === 'before');
  const postPhases: MilestonePhase[] = protocol.phases.filter((p: any) => p.stage === 'after');

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayOffset = dayNum - preDays - 1; // negative for pre-op, 0 for surgery, positive for post-op
    const dateStr = addDays(surgeryDate, dayOffset);

    let stage: PatientStage = 'before';
    let phaseId = 'pre_op_prep';
    let phaseName = 'Pre-Op Preparation';
    let phaseTemplate = prePhases[0]?.templates;

    if (dayOffset < 0) {
      stage = 'before';
      if (dayOffset >= -2 && prePhases.length > 1) {
        phaseId = prePhases[1].id;
        phaseName = prePhases[1].name;
        phaseTemplate = prePhases[1].templates;
      } else {
        phaseId = prePhases[0]?.id || 'pre_op';
        phaseName = prePhases[0]?.name || 'Pre-Op Prep';
        phaseTemplate = prePhases[0]?.templates;
      }
    } else if (dayOffset === 0) {
      stage = 'surgery';
      phaseId = 'surgery_day';
      phaseName = 'Surgery Day';
    } else {
      stage = 'after';
      // Allocate post-op phases across recovery days
      if (dayOffset <= 7 && postPhases.length > 0) {
        phaseId = postPhases[0].id;
        phaseName = postPhases[0].name;
        phaseTemplate = postPhases[0].templates;
      } else if (dayOffset <= 21 && postPhases.length > 1) {
        phaseId = postPhases[1].id;
        phaseName = postPhases[1].name;
        phaseTemplate = postPhases[1].templates;
      } else {
        const lastPhase = postPhases[postPhases.length - 1];
        phaseId = lastPhase?.id || 'maintenance';
        phaseName = lastPhase?.name || 'Rehab Maintenance';
        phaseTemplate = lastPhase?.templates;
      }
    }

    // Build Meals using doctor-suggested cardiac diets tailored for each specific day & stage
    const doctorMeals = getDoctorSuggestedMeals(
      dayOffset,
      dayNum,
      stage,
      details.diet === 'veg'
    );
    const meals: DayPlanContent['meals'] = [];
    doctorMeals.forEach((m, idx) => {
      meals.push({
        id: `m-${dayNum}-${idx + 1}`,
        name: m.name,
        notes: m.notes,
      });
    });

    // Apply condition notes to meals
    conditionMods.forEach((c: any) => {
      if (c.modifications?.meals_note && meals.length > 0) {
        meals[0].notes += ` • ${c.name}: ${c.modifications.meals_note}`;
      }
    });

    // Build Workout
    let workout: DayPlanContent['workout'] = {
      level: 'light',
      duration_min: 15,
      instructions: ['Walking at comfortable pace', 'Deep breathing exercises']
    };

    if (stage === 'surgery') {
      workout = {
        level: 'minimum',
        duration_min: 0,
        instructions: ['Surgery day: Complete physical rest in hospital care']
      };
    } else if (phaseTemplate?.workout) {
      workout = {
        level: phaseTemplate.workout.level,
        duration_min: phaseTemplate.workout.duration_min,
        instructions: [...phaseTemplate.workout.instructions]
      };
    }

    // Check workout cap from condition modules (e.g. heart disease)
    conditionMods.forEach((c: any) => {
      if (c.modifications?.workout_cap && workout.level === 'normal') {
        workout.level = c.modifications.workout_cap;
      }
      if (c.modifications?.workout_instructions) {
        workout.instructions.push(...c.modifications.workout_instructions);
      }
    });

    // Build Checks
    const checks: DayPlanContent['checks'] = [];
    if (stage === 'surgery') {
      checks.push(
        { id: `c-${dayNum}-1`, name: 'Hospital Arrival & Admission Check', target: 'Check in on schedule with identification' },
        { id: `c-${dayNum}-2`, name: 'Anesthesia Readiness & Vital Signs', target: 'Baseline telemetry documented' }
      );
    } else {
      const templateChecks = phaseTemplate?.checks || [
        { name: 'Resting Blood Pressure', target: '< 140/90 mmHg' }
      ];
      templateChecks.forEach((chk, idx) => {
        checks.push({
          id: `c-${dayNum}-${idx + 1}`,
          name: chk.name,
          target: chk.target
        });
      });

      // Add condition checks
      conditionMods.forEach((c: any) => {
        if (c.modifications?.checks) {
          c.modifications.checks.forEach((chk: any, cidx: number) => {
            checks.push({
              id: `c-${dayNum}-cond-${c.id}-${cidx}`,
              name: chk.name,
              target: chk.target,
              added_by_engine: true
            });
          });
        }
      });
    }

    // Build Medicines
    const medicines: DayPlanContent['medicines'] = [];
    details.current_medicines.forEach((med, medIdx) => {
      let instruction: 'continue' | 'stop' | 'dose_reminder' = 'continue';
      if (stage === 'before') {
        instruction = med.doctor_instruction === 'stop' && dayOffset >= -(med.stop_days_before || 3) ? 'stop' : 'continue';
      } else if (stage === 'surgery') {
        instruction = 'stop';
      } else {
        instruction = 'dose_reminder';
      }

      medicines.push({
        id: `med-${dayNum}-${medIdx}`,
        name: med.name,
        dosage: med.dosage,
        time: med.frequency,
        instruction
      });
    });

    const content: DayPlanContent = {
      stage,
      phase_id: phaseId,
      phase_name: phaseName,
      meals,
      workout,
      medicines,
      checks,
      focus_note: phaseTemplate?.focus_note || (stage === 'surgery' ? 'Surgery Day Protocol' : 'Recovery Focus'),
      advance_progress_note: phaseTemplate ? `Criteria: ${phaseTemplate.focus_note}` : undefined
    };

    plans.push({
      id: `plan-${details.patient_id}-day-${dayNum}-v${version}`,
      patient_id: details.patient_id,
      day_offset: dayOffset,
      day_number: dayNum,
      date: dateStr,
      version,
      is_current: true,
      is_baseline: isBaseline,
      content,
      reasons: [
        `Generated from ${protocol.name} protocol (${phaseName}) with ${conditionMods.length} linked condition modules.`
      ],
      created_at: new Date().toISOString()
    });
  }

  return {
    totalDays,
    baselineLength: totalDays,
    lengthReason: reason,
    plans
  };
}

/**
 * Doctor-Suggested Cardiac Diets
 * Tailored specifically across pre-surgery prep, surgery day, acute post-op healing, and progressive cardiac conditioning.
 * Provides authentic daily variety in plain English so patients never face repetitive diets or fasting errors.
 */
export function getDoctorSuggestedMeals(
  dayOffset: number,
  dayNum: number,
  stage: 'before' | 'surgery' | 'after',
  isVeg: boolean = true
): Array<{ name: string; notes: string }> {
  // Surgery Day
  if (stage === 'surgery' || dayOffset === 0) {
    return [
      {
        name: 'Strict Pre-Op Fasting (Nil by Mouth)',
        notes: 'No solid food or liquids after instructed midnight cutoff as directed by surgery team',
      },
      {
        name: 'Post-Anesthesia Water Sips & Ice Chips',
        notes: 'Small water sips only after surgeon and recovery nurse clinical clearance',
      },
    ];
  }

  // Pre-Op Phase (days before surgery)
  if (stage === 'before' || dayOffset < 0) {
    const preDaysList = [
      {
        b: { name: 'Warm Oatmeal with Fresh Berries & Walnuts', notes: 'Heart-healthy soluble fiber to maintain stable blood lipids and gentle digestion' },
        l: { name: 'Steamed Brown Rice with Yellow Moong Dal & Spinach', notes: 'Easily digestible plant protein and magnesium for arterial wellness' },
        d: { name: 'Clear Vegetable Soup & Soft Whole Wheat Roti', notes: 'Light evening meal with very low sodium (< 400mg) for restful sleep' },
      },
      {
        b: { name: 'Vegetable Daliya Porridge with Mild Herbs', notes: 'Cracked wheat porridge with diced carrots & peas, low glycemic load' },
        l: { name: 'Steamed Rice with Lauki (Bottle Gourd) Dal & Beetroot', notes: 'High hydration and potassium to support stable pre-surgical blood pressure' },
        d: { name: 'Tender Moong Dal Khichdi & Light Steamed Zucchini', notes: 'Gentle, comforting meal that avoids gastrointestinal fullness' },
      },
      {
        b: { name: 'Warm Apple & Cinnamon Rice Porridge', notes: 'Soft cooked rice with stewed apples, provides clean glycogen storage' },
        l: { name: 'Steamed Rice Bowl with Soft Boiled Chickpeas & Carrots', notes: 'Plant protein with gentle dietary fiber, seasoned with mild cumin' },
        d: { name: 'Roasted Pumpkin Soup & Soft Whole Wheat Phulka', notes: 'Rich in beta-carotene and antioxidants, soothing for the stomach' },
      },
      {
        b: { name: 'Soft Vegetable Semolina Upma with Steamed Peas', notes: 'Light warm breakfast cooked in minimal olive oil with ginger' },
        l: { name: 'Steamed White Rice with Masoor Dal & French Beans', notes: 'Low residue, easily absorbed nutrients to ease pre-operative bowel load' },
        d: { name: 'Clear Strained Vegetable Broth & Soft Moong Dal Cheela', notes: 'High hydration broth with a delicate protein crepe, strictly low sodium' },
      },
      {
        b: { name: 'Warm Oats Porridge with Sliced Banana & Almonds', notes: 'Easily digested morning energy, heart-supportive potassium' },
        l: { name: 'Light Steamed White Rice with Clear Moong Dal Broth', notes: 'Simple, delicate pre-surgery lunch; non-acidic and very gentle' },
        d: { name: 'Clear Vegetable Broth & Well-Cooked Soft Rice', notes: 'Clinical directive: finish dinner before 8:00 PM; strict fasting after midnight' },
      },
    ];

    const preIdx = Math.abs(dayOffset) % preDaysList.length;
    const selected = preDaysList[preIdx];
    return [
      { name: selected.b.name, notes: selected.b.notes },
      { name: selected.l.name, notes: selected.l.notes },
      { name: selected.d.name, notes: selected.d.notes },
    ];
  }

  // Acute Post-Op Phase (Day +1 to Day +14)
  // Progressive soft recovery diet designed to promote sternal healing and smooth digestion
  if (dayOffset >= 1 && dayOffset <= 14) {
    const acuteDays: Record<number, { b: { name: string; notes: string }; l: { name: string; notes: string }; d: { name: string; notes: string } }> = {
      1: {
        b: { name: 'Warm Rice Kanji with Cumin Hint', notes: 'Ultra-soft strained rice porridge to settle stomach motility after anesthesia' },
        l: { name: 'Mashed Potatoes with Soft Yellow Lentil Puree', notes: 'Smooth, comforting consistency; zero chewing effort, protects chest precautions' },
        d: { name: 'Clear Strained Carrot & Bottle Gourd Soup', notes: 'Hydrating, light, electrolytes-replenishing evening broth' },
      },
      2: {
        b: { name: 'Warm Stewed Apple & Soft Rice Porridge', notes: 'Gentle fruit pectins to stimulate natural bowel recovery after surgery' },
        l: { name: 'Soft Moong Dal Khichdi with Tender Boiled Carrots', notes: 'Golden standard cardiac recovery meal: balanced protein, low gas' },
        d: { name: 'Warm Clear Vegetable Soup with Soft Bread', notes: 'Light soothing soup; easily digestible carbohydrates for sleep' },
      },
      3: {
        b: { name: isVeg ? 'Soft Scrambled Paneer & Warm Toast' : 'Soft Scrambled Egg Whites & Warm Toast', notes: 'Clean protein building blocks for graft and incision tissue synthesis' },
        l: { name: 'Steamed Rice with Bottle Gourd Dal & Stewed Pumpkin', notes: 'Gentle on digestion, packed with potassium and vitamin A' },
        d: { name: 'Light Spinach & Yellow Moong Soup with Soft Phulka', notes: 'Iron and folate to support hemoglobin recovery without stomach heaviness' },
      },
      4: {
        b: { name: 'Warm Oats Porridge with Mashed Banana', notes: 'Soluble fiber and potassium to support cardiac rhythm and smooth digestion' },
        l: { name: 'Soft Steamed Rice with Mild Toor Dal & Stewed Zucchini', notes: 'Nutritious lunch seasoned with mild turmeric and cumin' },
        d: { name: 'Clear Moong Soup with Soft Rice & Ghee Hint', notes: 'Anti-inflammatory, gut-protective warm dinner' },
      },
      5: {
        b: { name: 'Soft Steamed Idlis with Mild Vegetable Sambar', notes: 'Fermented steamed rice cakes; naturally easy to digest and probiotic-friendly' },
        l: { name: isVeg ? 'Steamed Rice with Soft Paneer in Mild Stew' : 'Steamed Rice with Tender Chicken in Mild Stew', notes: 'High-biological-value protein for sternal wound recovery' },
        d: { name: 'Warm Bottle Gourd & Tomato Soup with Soft Phulka', notes: 'Low sodium, antioxidant lycopene for arterial tissue health' },
      },
      6: {
        b: { name: 'Warm Ragi Porridge with Warm Milk', notes: 'Finger millet porridge rich in calcium and iron for bone healing' },
        l: { name: 'Soft Steamed Rice with Yellow Moong Dal & Stewed Beans', notes: 'Balanced recovery plate; strictly low salt to prevent fluid retention' },
        d: { name: 'Clear Mixed Vegetable Broth & Soft Moong Khichdi', notes: 'Restful, light evening meal for peaceful sleep' },
      },
      7: {
        b: { name: isVeg ? 'Soft Tofu with Warm Whole Wheat Toast' : 'Poached Egg with Warm Whole Wheat Toast', notes: 'High protein for 1-week sternal healing milestone' },
        l: { name: 'Steamed Brown Rice with Spinach Dal & Tender Carrots', notes: 'Dietary fiber supporting gut regularity as patient increases walking' },
        d: { name: 'Roasted Pumpkin & Carrot Soup with Soft Roti', notes: 'Beta-carotene for surgical scar healing and immunity' },
      },
      8: {
        b: { name: 'Warm Oatmeal with Stewed Papaya & Flaxseeds', notes: 'Enzymes and omega-3 alpha-linolenic acid for anti-inflammatory support' },
        l: { name: 'Steamed Rice with Mild Chickpea & Pumpkin Stew', notes: 'Sustained energy and plant protein for rehab conditioning' },
        d: { name: 'Clear Vegetable Soup & Soft Moong Dal Cheela', notes: 'Nutritious lentil crepe; light on the stomach before bedtime' },
      },
      9: {
        b: { name: 'Vegetable Daliya with Tender Carrots & Peas', notes: 'Low glycemic index cracked wheat porridge, diabetic and heart friendly' },
        l: { name: 'Steamed Rice with Lauki Dal & Steamed Beetroot', notes: 'Nitrates in beetroot support healthy blood flow and blood pressure' },
        d: { name: 'Warm Moong Dal Khichdi with Mild Cumin Tempering', notes: 'Gentle, comforting meal that prevents nighttime indigestion' },
      },
      10: {
        b: { name: 'Warm Oats with Sliced Pear & Crushed Almonds', notes: 'Healthy monounsaturated fats and soluble fiber for lipid control' },
        l: { name: isVeg ? 'Steamed Rice with Light Grilled Paneer & Green Beans' : 'Steamed Rice with Light Grilled Fish & Green Beans', notes: 'Lean tissue recovery protein with low sodium seasoning' },
        d: { name: 'Clear Sweet Corn & Vegetable Soup with Soft Roti', notes: 'Hydrating soup, comforting warmth after daytime rehab' },
      },
      11: {
        b: { name: isVeg ? 'Soft Paneer Bhurji with Whole Wheat Toast' : 'Soft Scrambled Eggs with Steamed Spinach & Toast', notes: 'Lutein, protein, and folate for vascular health' },
        l: { name: 'Steamed Brown Rice with Yellow Dal & Tender Cabbage', notes: 'Nutritious cruciferous vegetables cooked soft for easy digestion' },
        d: { name: 'Warm Lentil & Tomato Broth with Soft Whole Wheat Phulka', notes: 'Cardioprotective nutrients in a light, satisfying dinner' },
      },
      12: {
        b: { name: 'Soft Semolina Upma with Mild Ginger & Curry Leaves', notes: 'Curry leaves and ginger aid digestion and blood lipid wellness' },
        l: { name: 'Steamed Rice with Moong Dal & Boiled Sweet Potato', notes: 'Potassium and complex carbs to replenish muscle glycogen after walking' },
        d: { name: 'Soft Vegetable Stew with Warm Whole Wheat Bread', notes: 'Heart-healthy olive oil base, strictly low sodium' },
      },
      13: {
        b: { name: 'Warm Oatmeal with Stewed Berries & Chia Seeds', notes: 'Polyphenols for endothelial healing and arterial recovery' },
        l: { name: 'Steamed Rice with Masoor Dal & Steamed Bottle Gourd', notes: 'Gentle, ultra-low fat, high-fiber luncheon' },
        d: { name: 'Clear Vegetable Soup & Soft Moong Dal Khichdi', notes: 'Soothing dinner as sternal acute healing phase concludes' },
      },
      14: {
        b: { name: 'Soft Steamed Idli with Mild Vegetable Stew', notes: 'Light breakfast supporting gut microbiome and sustained stamina' },
        l: { name: isVeg ? 'Steamed Rice with Tender Paneer & Steamed Broccoli' : 'Steamed Rice with Lean Chicken & Steamed Broccoli', notes: 'Cruciferous sulforaphane and protein for cardiac muscle recovery' },
        d: { name: 'Warm Pumpkin & Ginger Soup with Soft Roti', notes: 'Anti-inflammatory ginger and vitamin-rich pumpkin' },
      },
    };

    const acute = acuteDays[dayOffset] || acuteDays[14];
    return [
      { name: acute.b.name, notes: acute.b.notes },
      { name: acute.l.name, notes: acute.l.notes },
      { name: acute.d.name, notes: acute.d.notes },
    ];
  }

  // Phase II Cardiac Conditioning & Long-Term Maintenance (Day +15 onwards)
  // Rotating 7-day diverse cardioprotective Mediterranean & Heart-Healthy menu
  const cycleMenus = [
    // Menu A (e.g. Day 15, 22, 29, 36, 43, 50, 57, 64, 71)
    {
      b: { name: 'Warm Rolled Oats with Blueberries & Roasted Walnuts', notes: 'Beta-glucan soluble fiber to reduce LDL cholesterol and arterial stiffness' },
      l: { name: 'Steamed Brown Rice with Spinach Dal & Cucumber Raita', notes: 'Magnesium-rich greens with probiotic curd; low sodium seasoning' },
      d: { name: isVeg ? 'Baked Tofu with Steamed Asparagus & Soft Roti' : 'Grilled Salmon with Steamed Asparagus & Soft Roti', notes: 'Cardioprotective EPA/DHA omega-3 fatty acids for vascular elasticity' },
    },
    // Menu B (e.g. Day 16, 23, 30, 37, 44, 51, 58, 65, 72)
    {
      b: { name: isVeg ? 'Multigrain Toast with Avocado & Soft Paneer' : 'Multigrain Toast with Poached Eggs & Avocado', notes: 'Monounsaturated oleic acid to support healthy HDL and arterial endothelium' },
      l: { name: 'Mediterranean Quinoa Bowl with Chickpeas & Zucchini', notes: 'Complete plant protein and complex fiber with extra virgin olive oil dressing' },
      d: { name: 'Clear Vegetable Minestrone Soup & Whole Wheat Bread', notes: 'Lycopene-rich tomato broth, low salt, satisfying yet light for sleep' },
    },
    // Menu C (e.g. Day 17, 24, 31, 38, 45, 52, 59, 66)
    {
      b: { name: 'Warm Apple & Cinnamon Steel-Cut Oats with Almond Milk', notes: 'Polyphenols and cinnamon support glucose stability and vascular health' },
      l: { name: 'Steamed Rice with Yellow Moong Dal, Carrots & French Beans', notes: 'Easily digestible pulse protein, blood-pressure neutral potassium' },
      d: { name: 'Tender Moong Dal Khichdi with Flaxseed Curd', notes: 'Alpha-linolenic acid in flaxseeds; promotes sound restorative sleep' },
    },
    // Menu D (e.g. Day 18, 25, 32, 39, 46, 53, 60, 67)
    {
      b: { name: 'Vegetable Poha with Roasted Peanuts & Fresh Lemon', notes: 'Iron and vitamin C from citrus; light, easily metabolized breakfast' },
      l: { name: 'Soft Whole Wheat Phulkas with Methi Paneer & Sprouted Salad', notes: 'Fenugreek (methi) assists in healthy glycemic and lipid balance' },
      d: { name: 'Roasted Bottle Gourd Soup & Soft Steamed Idlis', notes: 'High hydration, zero saturated fat; deeply resting for the heart' },
    },
    // Menu E (e.g. Day 19, 26, 33, 40, 47, 54, 61, 68)
    {
      b: { name: 'Warm Ragi Porridge with Sliced Almonds & Dates', notes: 'Natural calcium, iron, and fiber; slow-release energy for walking rehab' },
      l: { name: 'Steamed Rice with Rajma (Kidney Beans) & Steamed Beetroot', notes: 'Dietary nitrates promote nitric oxide release and arterial vasodilation' },
      d: { name: 'Clear Lemon Coriander Soup & Soft Whole Wheat Roti', notes: 'Vitamin C rich, gentle digestive broth with soft flatbread' },
    },
    // Menu F (e.g. Day 20, 27, 34, 41, 48, 55, 62, 69)
    {
      b: { name: isVeg ? 'Scrambled Soft Paneer with Sautéed Mushrooms & Toast' : 'Scrambled Egg Whites with Sautéed Mushrooms & Toast', notes: 'Lean protein and selenium; supports cellular repair and immune vigor' },
      l: { name: 'Brown Rice with Green Moong Dal & Stir-Fried Bell Peppers', notes: 'Flavonoid-rich vegetables protect coronary bypass grafts against oxidative stress' },
      d: { name: 'Pumpkin & Light Coconut Milk Soup with Soft Flatbread', notes: 'Potassium and gentle healthy fats; calming evening meal' },
    },
    // Menu G (e.g. Day 21, 28, 35, 42, 49, 56, 63, 70)
    {
      b: { name: 'Chia Seed Oats Pudding with Ripe Papaya Slices', notes: 'Omega-3 fatty acids and papain enzyme for smooth morning digestion' },
      l: { name: 'Steamed Rice with Lentil Sambar & Steamed French Beans', notes: 'Heart-healthy pulse stew seasoned with fenugreek and turmeric' },
      d: { name: isVeg ? 'Tender Tofu & Mixed Vegetable Stew with Soft Roti' : 'Tender Chicken & Mixed Vegetable Stew with Soft Roti', notes: 'Lean restorative amino acids; easily assimilated before bedtime' },
    },
  ];

  const cycleIdx = (dayOffset - 15) % cycleMenus.length;
  const menu = cycleMenus[cycleIdx >= 0 ? cycleIdx : (cycleIdx + cycleMenus.length) % cycleMenus.length];
  return [
    { name: menu.b.name, notes: menu.b.notes },
    { name: menu.l.name, notes: menu.l.notes },
    { name: menu.d.name, notes: menu.d.notes },
  ];
}
