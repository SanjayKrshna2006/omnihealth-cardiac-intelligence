/**
 * Patient-Friendly Helpers for Senior & Everyday Patients
 * - Evaluates vital readings against normal target ranges and returns clear red/green alert statuses.
 * - Translates clinical diet & protocol names into simple, plain English real foods.
 */

export interface VitalEvaluation {
  status: 'normal' | 'high' | 'low' | 'pending';
  normalRangeText: string;
  badgeLabel: string;
  badgeClass: string;
  alertMessage?: string;
  adviceText: string;
  isAlert: boolean;
}

/**
 * Evaluate any vital or health check against clinical normal ranges
 */
export function evaluateVitalCheck(title: string, valueStr?: string | number): VitalEvaluation {
  const t = title.toLowerCase();
  const val = valueStr !== undefined && valueStr !== null ? String(valueStr).trim() : '';

  // 1. BLOOD PRESSURE CHECKS
  if (t.includes('pressure') || t.includes('bp')) {
    const normalRangeText = 'Normal: 110–135 / 70–85 mmHg';

    if (!val) {
      return {
        status: 'pending',
        normalRangeText,
        badgeLabel: 'Pending Reading',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        adviceText: 'Check resting blood pressure while seated comfortably.',
        isAlert: false,
      };
    }

    // Try parsing "120/80" or "120 / 80"
    const match = val.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      const sys = parseInt(match[1], 10);
      const dia = parseInt(match[2], 10);

      // HIGH ALERT: Systolic >= 140 OR Diastolic >= 90
      if (sys >= 140 || dia >= 90) {
        return {
          status: 'high',
          normalRangeText,
          badgeLabel: `🚨 HIGH BP ALERT: ${sys}/${dia} mmHg`,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
          alertMessage: `Blood pressure reading (${sys}/${dia} mmHg) is above the safe target range (110–135 / 70–85 mmHg).`,
          adviceText:
            'Please sit down and rest quietly for 15 minutes. Avoid salty snacks, tea, or stress. If your reading stays above 140/90, alert your doctor or family member.',
          isAlert: true,
        };
      }

      // LOW ALERT: Systolic < 95 OR Diastolic < 60
      if (sys < 95 || dia < 60) {
        return {
          status: 'low',
          normalRangeText,
          badgeLabel: `⚠️ LOW BP ALERT: ${sys}/${dia} mmHg`,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          alertMessage: `Blood pressure reading (${sys}/${dia} mmHg) is below normal range.`,
          adviceText:
            'Drink a glass of water and sit or lie down comfortably. Stand up slowly to avoid dizziness. If you feel faint, alert your caregiver.',
          isAlert: true,
        };
      }

      // NORMAL:
      return {
        status: 'normal',
        normalRangeText,
        badgeLabel: `✓ Normal & Safe: ${sys}/${dia} mmHg`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        adviceText: 'Excellent! Your blood pressure is within the safe and healthy recovery range.',
        isAlert: false,
      };
    }

    // Fallback if user typed just one number
    const num = parseInt(val.replace(/[^\d]/g, ''), 10);
    if (!isNaN(num)) {
      if (num >= 140) {
        return {
          status: 'high',
          normalRangeText,
          badgeLabel: `🚨 High Reading: ${num} mmHg`,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
          alertMessage: 'Reading is higher than safe recovery target.',
          adviceText: 'Rest for 15 minutes and retake reading.',
          isAlert: true,
        };
      }
      return {
        status: 'normal',
        normalRangeText,
        badgeLabel: `✓ Recorded: ${num} mmHg`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        adviceText: 'Reading recorded.',
        isAlert: false,
      };
    }
  }

  // 2. BLOOD GLUCOSE / SUGAR CHECKS
  if (t.includes('glucose') || t.includes('sugar')) {
    const isBedtime = t.includes('bedtime') || t.includes('night');
    const normalRangeText = isBedtime ? 'Normal: 100–140 mg/dL' : 'Normal: 80–130 mg/dL';
    const highCeiling = isBedtime ? 145 : 135;
    const lowFloor = 70;

    if (!val) {
      return {
        status: 'pending',
        normalRangeText,
        badgeLabel: 'Pending Reading',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        adviceText: isBedtime ? 'Check before sleep.' : 'Check first thing in the morning before breakfast.',
        isAlert: false,
      };
    }

    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) {
      if (num > highCeiling) {
        return {
          status: 'high',
          normalRangeText,
          badgeLabel: `🚨 HIGH SUGAR ALERT: ${num} mg/dL`,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
          alertMessage: `Blood sugar is elevated (${num} mg/dL, normal is ${normalRangeText.replace('Normal: ', '')}).`,
          adviceText:
            'Drink plenty of plain water, avoid sweets and white bread/rice, and take your diabetic medicine on schedule.',
          isAlert: true,
        };
      }

      if (num < lowFloor) {
        return {
          status: 'low',
          normalRangeText,
          badgeLabel: `⚠️ LOW SUGAR ALERT: ${num} mg/dL`,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          alertMessage: `Blood sugar is low (${num} mg/dL). Immediate attention needed.`,
          adviceText:
            'Drink half a glass of fruit juice or have 3 glucose biscuits immediately. Re-test in 15 minutes.',
          isAlert: true,
        };
      }

      return {
        status: 'normal',
        normalRangeText,
        badgeLabel: `✓ Normal Sugar: ${num} mg/dL`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        adviceText: 'Good job! Your blood sugar is well-balanced within the normal target range.',
        isAlert: false,
      };
    }
  }

  // 3. MORNING WEIGHT CHECK
  if (t.includes('weight')) {
    const normalRangeText = 'Normal: Baseline weight ± 1.5 kg';

    if (!val) {
      return {
        status: 'pending',
        normalRangeText,
        badgeLabel: 'Pending Weight',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        adviceText: 'Weigh yourself in the morning after using the restroom and before eating.',
        isAlert: false,
      };
    }

    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) {
      const baseline = 81.0;
      const diff = num - baseline;

      if (diff >= 2.0) {
        return {
          status: 'high',
          normalRangeText,
          badgeLabel: `⚠️ FLUID ALERT: ${num} kg (+${diff.toFixed(1)} kg gain)`,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
          alertMessage: 'Sudden weight gain detected (more than 2 kg above baseline weight).',
          adviceText:
            'Rapid weight gain often signals water retention. Check your legs and ankles for swelling and inform your doctor.',
          isAlert: true,
        };
      }

      return {
        status: 'normal',
        normalRangeText,
        badgeLabel: `✓ Weight in Range: ${num} kg`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        adviceText: 'Your body weight is steady with no signs of fluid retention.',
        isAlert: false,
      };
    }
  }

  // 4. HEART RATE / PULSE
  if (t.includes('pulse') || t.includes('heart rate')) {
    const normalRangeText = 'Normal: 60–90 beats per minute (bpm)';

    if (!val) {
      return {
        status: 'pending',
        normalRangeText,
        badgeLabel: 'Pending Pulse',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        adviceText: 'Count pulse while resting quietly.',
        isAlert: false,
      };
    }

    const num = parseInt(val.replace(/[^\d]/g, ''), 10);
    if (!isNaN(num)) {
      if (num >= 100) {
        return {
          status: 'high',
          normalRangeText,
          badgeLabel: `⚠️ HIGH PULSE ALERT: ${num} bpm`,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
          alertMessage: 'Heart rate is faster than usual recovery pace.',
          adviceText: 'Sit down, take slow deep breaths, and relax for 10 minutes.',
          isAlert: true,
        };
      }
      if (num < 55) {
        return {
          status: 'low',
          normalRangeText,
          badgeLabel: `⚠️ LOW PULSE: ${num} bpm`,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          alertMessage: 'Heart rate is lower than 55 bpm.',
          adviceText: 'If you feel dizzy or lightheaded, notify your care team.',
          isAlert: true,
        };
      }
      return {
        status: 'normal',
        normalRangeText,
        badgeLabel: `✓ Normal Pulse: ${num} bpm`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        adviceText: 'Heart rate is smooth and steady.',
        isAlert: false,
      };
    }
  }

  // Fallback for general checks
  return {
    status: val ? 'normal' : 'pending',
    normalRangeText: 'Target: Stable health range',
    badgeLabel: val ? `✓ Recorded: ${val}` : 'Pending Check',
    badgeClass: val ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700',
    adviceText: val ? 'Check confirmed.' : 'Record your daily health check.',
    isAlert: false,
  };
}

/**
 * Plain English Meal Simplifier
 */
export function simplifyMealName(originalName: string, mealSlot?: 'breakfast' | 'lunch' | 'dinner' | number): {
  icon: string;
  slotLabel: string;
  simpleName: string;
  easyDescription: string;
} {
  const s = originalName.toLowerCase();


  // 1. Fasting (Strictly match fasting / nil by mouth, NEVER 'breakfast')
  if (s.includes('fasting') || /\bfast\b/i.test(s) || s.includes('nil by mouth')) {
    return {
      icon: '🛑',
      slotLabel: 'Pre-Surgery',
      simpleName: 'Water & Food Rest (Fasting)',
      easyDescription: 'No solid food or liquids after the instructed midnight cutoff as directed by your surgeon.',
    };
  }

  // 2. Anesthesia Water Sips / Ice Chips
  if (s.includes('ice chip') || s.includes('sips') || s.includes('anesthesia')) {
    return {
      icon: '💧',
      slotLabel: 'Hospital Care',
      simpleName: 'Small Water Sips & Ice Chips',
      easyDescription: 'Take tiny sips of clean water only after the recovery nurse checks and confirms it is safe.',
    };
  }

  // Determine slot
  let slot = 'Meal';
  let icon = '🍽️';
  if (
    s.includes('breakfast') ||
    mealSlot === 0 ||
    mealSlot === 'breakfast' ||
    s.includes('porridge') ||
    s.includes('oat') ||
    s.includes('toast') ||
    s.includes('idli') ||
    s.includes('upma') ||
    s.includes('poha') ||
    s.includes('daliya') ||
    s.includes('kanji') ||
    s.includes('pudding') ||
    s.includes('egg')
  ) {
    slot = 'Breakfast';
    icon = '🥣';
  } else if (
    s.includes('lunch') ||
    mealSlot === 1 ||
    mealSlot === 'lunch' ||
    s.includes('rice') ||
    s.includes('dal') ||
    s.includes('quinoa') ||
    s.includes('bowl')
  ) {
    slot = 'Lunch';
    icon = '🥗';
  } else if (
    s.includes('dinner') ||
    mealSlot === 2 ||
    mealSlot === 'dinner' ||
    s.includes('soup') ||
    s.includes('broth') ||
    s.includes('khichdi') ||
    s.includes('roti') ||
    s.includes('phulka') ||
    s.includes('stew')
  ) {
    slot = 'Dinner';
    icon = '🍲';
  }

  // Clean clinical protocol tokens
  let cleaned = originalName
    .replace(/Cardiac|DASH|Protocol|Strict|Controlled|Hypoallergenic|Prescribed/gi, '')
    .trim();

  // Specific Description tailored to dishes
  let easyDesc = 'Cooked fresh, strictly low in salt, and gentle on the heart.';
  if (s.includes('kanji') || s.includes('broth') || s.includes('strained')) {
    easyDesc = 'Ultra-soft, soothing liquid nourishment to settle digestion after surgery.';
  } else if (s.includes('khichdi') || s.includes('daliya') || s.includes('porridge') || s.includes('oat')) {
    easyDesc = 'Warm, tender meal rich in soluble fiber. Very gentle on the heart and gut.';
  } else if (s.includes('soup')) {
    easyDesc = 'Warm comforting vegetable soup, strictly low sodium (< 400mg) for peaceful sleep.';
  } else if (s.includes('rice') && s.includes('dal')) {
    easyDesc = 'Soft steamed rice with mild yellow lentils and tender vegetables. Easy to chew.';
  } else if (s.includes('egg') || s.includes('paneer') || s.includes('tofu') || s.includes('salmon') || s.includes('chicken')) {
    easyDesc = 'High quality clean protein to support sternal incision and wound healing.';
  } else if (slot === 'Breakfast') {
    easyDesc = 'Gentle morning energy, low in sodium and easy to digest.';
  } else if (slot === 'Lunch') {
    easyDesc = 'Nutritious balanced luncheon plate with tender vegetables and mild lentils.';
  } else if (slot === 'Dinner') {
    easyDesc = 'Light, soothing warm dinner for easy digestion and sound, restful sleep.';
  }

  return {
    icon,
    slotLabel: slot,
    simpleName: cleaned || (slot === 'Breakfast' ? 'Warm Breakfast Porridge' : slot === 'Lunch' ? 'Steamed Rice & Lentil Dal' : 'Clear Vegetable Soup & Soft Roti'),
    easyDescription: easyDesc,
  };
}

/**
 * Plain English Rehab / Activity Simplifier
 */
export function simplifyRehab(durationMin: number, level: string, instructions: string[] = []): {
  walkText: string;
  breathingText: string;
} {
  if (durationMin === 0) {
    return {
      walkText: 'Complete Rest (Hospital Care)',
      breathingText: 'Gentle assisted breathing as directed by nurse',
    };
  }

  const instStr = instructions.join(' ').toLowerCase();
  const breathing = instStr.includes('breath')
    ? '10 slow deep breaths (expands lungs)'
    : 'Gentle sitting stretches & deep breaths';

  return {
    walkText: `${durationMin} mins gentle hallway walking`,
    breathingText: breathing,
  };
}

/**
 * Plain English Medicine Simplifier
 */
export function simplifyMedicine(name: string, instruction: string): {
  icon: string;
  badge: string;
  action: string;
  isPaused: boolean;
} {
  const inst = (instruction || '').toLowerCase();
  if (inst.includes('stop') || inst.includes('hold') || inst.includes('pause')) {
    return {
      icon: '🛑',
      badge: 'Stop Before Surgery',
      action: 'Do not take today (Doctor hold order)',
      isPaused: true,
    };
  }
  return {
    icon: '💊',
    badge: 'Take on Schedule',
    action: 'Take on time with water',
    isPaused: false,
  };
}

/**
 * Plain English Vitals & Health Checks Simplifier
 */
export function simplifyCheck(name: string, target?: string): {
  icon: string;
  friendlyName: string;
  normalRange: string;
} {
  const n = name.toLowerCase();
  if (n.includes('pressure') || n.includes('bp')) {
    return {
      icon: '🩺',
      friendlyName: 'Blood Pressure & Heart Rate',
      normalRange: '110–135 / 70–85 mmHg (Pulse 60–90 bpm)',
    };
  }
  if (n.includes('glucose') || n.includes('sugar')) {
    const isBedtime = n.includes('bedtime') || n.includes('night');
    return {
      icon: '🩸',
      friendlyName: isBedtime ? 'Bedtime Blood Sugar' : 'Morning Fasting Blood Sugar',
      normalRange: isBedtime ? '100–140 mg/dL' : '80–130 mg/dL',
    };
  }
  if (n.includes('weight')) {
    return {
      icon: '⚖️',
      friendlyName: 'Morning Body Weight',
      normalRange: 'Within 1.5 kg of your starting weight',
    };
  }
  return {
    icon: '❤️',
    friendlyName: name,
    normalRange: target || 'Normal stable range',
  };
}
