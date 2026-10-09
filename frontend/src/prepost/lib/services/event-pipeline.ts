import { DOCTOR_ID, mockDb, PATIENT_ID } from '@/lib/services/mock-db';
import type { LogEntry, PlanChangeRecord } from '@/lib/types/database';

export type ItemCategory = 'meal' | 'workout' | 'medicine' | 'check';
export type ItemStatus = 'pending' | 'done' | 'skipped' | 'missed' | 'partial';

export interface PlanItem {
  id: string;
  patient_id: string;
  day_number: number;
  day_offset: number;
  date: string;
  category: ItemCategory;
  title: string;
  details: string;
  scheduled_time?: string;
  dose?: string;
  required: boolean;
  version: number;
  is_current: boolean;
  swapped?: boolean;
  status: ItemStatus;
  skip_reason?: string;
  value?: string | number;
  note?: string;
  last_updated?: string;
}

export interface PlanItemEvent {
  id: string;
  plan_item_id: string;
  patient_id: string;
  status: ItemStatus;
  skip_reason?: string;
  value?: string | number;
  note?: string;
  logged_at: string;
  source: 'tap' | 'checkin' | 'system';
}

export interface NotificationItem {
  id: string;
  user_id: string;
  kind: 'plan_change' | 'alert' | 'proposal' | 'registration';
  title: string;
  body: string;
  link: string;
  read_at?: string;
  created_at: string;
}

class EventPipelineService {
  private itemsMap: Map<string, PlanItem[]> = new Map(); // patient_id -> PlanItem[]
  private events: PlanItemEvent[] = [];
  private notifications: NotificationItem[] = [
    {
      id: 'notif-seed-1',
      user_id: PATIENT_ID,
      kind: 'plan_change',
      title: 'Diet Protocol Active',
      body: 'Your personalized cardiac nutrition protocol is initialized.',
      link: '/patient/planner',
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-seed-2',
      user_id: DOCTOR_ID,
      kind: 'registration',
      title: 'Active Cardiac Patients',
      body: 'Rajesh Sharma scheduled for CABG.',
      link: '/doctor/dashboard',
      created_at: new Date().toISOString(),
    },
  ];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initializeItemsForPatient(PATIENT_ID);
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in pipeline listener:', err);
      }
    });
  }

  public initializeItemsForPatient(patientId: string): PlanItem[] {
    if (this.itemsMap.has(patientId)) {
      return this.itemsMap.get(patientId)!;
    }

    const plans = mockDb.getPlans(patientId);
    const items: PlanItem[] = [];

    plans.forEach((plan) => {
      // 1. Meals
      plan.content.meals.forEach((m, idx) => {
        const mealTime = idx === 0 ? '08:00 AM' : idx === 1 ? '01:00 PM' : '07:30 PM';
        items.push({
          id: `item-${plan.id}-meal-${m.id || idx}`,
          patient_id: patientId,
          day_number: plan.day_number,
          day_offset: plan.day_offset,
          date: plan.date,
          category: 'meal',
          title: m.name,
          details: m.notes,
          scheduled_time: mealTime,
          required: true,
          version: plan.version || 1,
          is_current: true,
          swapped: m.swapped || false,
          status: 'pending',
        });
      });

      // 2. Workout
      items.push({
        id: `item-${plan.id}-workout`,
        patient_id: patientId,
        day_number: plan.day_number,
        day_offset: plan.day_offset,
        date: plan.date,
        category: 'workout',
        title: `Target: ${plan.content.workout.duration_min} Mins Activity (${plan.content.workout.level.toUpperCase()})`,
        details: plan.content.workout.instructions.join('; '),
        scheduled_time: '10:30 AM',
        required: true,
        version: plan.version || 1,
        is_current: true,
        status: 'pending',
      });

      // 3. Medicines
      plan.content.medicines.forEach((med, idx) => {
        items.push({
          id: `item-${plan.id}-med-${idx}`,
          patient_id: patientId,
          day_number: plan.day_number,
          day_offset: plan.day_offset,
          date: plan.date,
          category: 'medicine',
          title: med.name,
          details: `Doctor Directive: ${(med.instruction || 'continue').toUpperCase()}`,
          dose: med.dosage,
          scheduled_time: med.time || '09:00 AM',
          required: med.instruction === 'continue',
          version: plan.version || 1,
          is_current: true,
          status: 'pending',
        });
      });

      // 4. Checks
      plan.content.checks.forEach((chk, idx) => {
        items.push({
          id: `item-${plan.id}-check-${idx}`,
          patient_id: patientId,
          day_number: plan.day_number,
          day_offset: plan.day_offset,
          date: plan.date,
          category: 'check',
          title: chk.name,
          details: `Target: ${chk.target}`,
          scheduled_time: '08:30 AM',
          required: true,
          version: plan.version || 1,
          is_current: true,
          status: 'pending',
        });
      });
    });

    this.itemsMap.set(patientId, items);
    return items;
  }

  public getItems(patientId: string): PlanItem[] {
    if (!this.itemsMap.has(patientId)) {
      this.initializeItemsForPatient(patientId);
    }
    return this.itemsMap.get(patientId) || [];
  }

  public getTodayItems(patientId: string, dayOffset: number): PlanItem[] {
    const items = this.getItems(patientId);
    return items.filter((it) => it.day_offset === dayOffset);
  }

  public getNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter((n) => n.user_id === userId);
  }

  /**
   * Unified Single Pipeline Function: recordEvent()
   * Atomically logs event, updates item, adapts plan/diet if skipped, writes change log & notifications.
   */
  public recordEvent(params: {
    patientId: string;
    planItemId: string;
    status: ItemStatus;
    skipReason?: string;
    value?: string | number;
    note?: string;
    source?: 'tap' | 'checkin' | 'system';
  }): { success: boolean; adaptedCategory?: string; changeNote?: string } {
    const { patientId, planItemId, status, skipReason, value, note, source = 'tap' } = params;

    const items = this.getItems(patientId);
    const item = items.find((it) => it.id === planItemId);
    if (!item) {
      console.warn(`Plan item ${planItemId} not found`);
      return { success: false };
    }

    const timestamp = new Date().toISOString();

    // 1. Record event row
    const eventRecord: PlanItemEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      plan_item_id: planItemId,
      patient_id: patientId,
      status,
      skip_reason: skipReason,
      value,
      note,
      logged_at: timestamp,
      source,
    };
    this.events.push(eventRecord);

    // 2. Update item state
    item.status = status;
    item.skip_reason = skipReason;
    item.value = value;
    item.note = note;
    item.last_updated = timestamp;

    // 3. Mirror into mockDb logs so dynamicEngine reads it
    const logKind = item.category === 'meal' ? 'meal' : item.category === 'workout' ? 'workout' : item.category === 'medicine' ? 'medicine' : 'vital';
    const logPayload: Record<string, unknown> = {
      item_id: item.id,
      title: item.title,
      status: status === 'done' ? (item.category === 'meal' ? 'eaten' : item.category === 'medicine' ? 'taken' : 'done') : 'skipped',
      reason: skipReason,
      value,
      note,
    };

    if (item.category === 'check' && value) {
      const parts = String(value).split('/');
      if (parts.length === 2) {
        logPayload.systolic = Number(parts[0].trim());
        logPayload.diastolic = Number(parts[1].trim());
      } else {
        const num = Number(value);
        if (item.title.toLowerCase().includes('sugar') || item.title.toLowerCase().includes('glucose')) {
          logPayload.sugar = num;
        } else if (item.title.toLowerCase().includes('weight')) {
          logPayload.weight = num;
        } else {
          logPayload.value = num;
        }
      }
    }

    const newLogEntry: LogEntry = {
      id: `log-${Date.now()}`,
      patient_id: patientId,
      day_offset: item.day_offset,
      date: item.date,
      kind: logKind,
      payload: logPayload,
      data: logPayload,
      source: 'quick_log',
      logged_at: timestamp,
      created_at: timestamp,
    };
    mockDb.addLog(newLogEntry);

    let adaptedCategory: string | undefined;
    let changeNote: string | undefined;

    // 4. CLOSED-LOOP DIET ADAPTATION: IF MEAL WAS SKIPPED
    if (item.category === 'meal' && status === 'skipped') {
      adaptedCategory = 'meals';
      const reasonLabel = skipReason || 'Skipped meal / Appetite loss';

      // Adapt remaining meals of today & tomorrow to gentle hydration/BRAT recovery diet
      const futureMeals = items.filter(
        (it) => it.category === 'meal' && (it.day_offset > item.day_offset || (it.day_offset === item.day_offset && it.id !== item.id && it.status === 'pending'))
      );

      const gentleMealNames = [
        'Gentle Stewed Apples & Hydrating Porridge',
        'Soothing Moong Dal Khichdi & Warm Vegetable Broth',
        'Bland Steamed Carrots, Boiled Potato & Clear Broth',
      ];

      futureMeals.slice(0, 3).forEach((m, idx) => {
        m.swapped = true;
        m.title = gentleMealNames[idx % gentleMealNames.length];
        m.details = `Gentle, digestible recovery meal (adapted because previous meal was skipped due to: ${reasonLabel}).`;
      });

      // Also update mockDb plans content
      const plans = mockDb.getPlans(patientId);
      const tomorrowPlan = plans.find((p) => p.day_offset === item.day_offset + 1);
      if (tomorrowPlan) {
        tomorrowPlan.content.meals = tomorrowPlan.content.meals.map((m, idx) => ({
          ...m,
          name: gentleMealNames[idx % gentleMealNames.length],
          notes: `Soft, easily digestible texture adapted for ${reasonLabel}.`,
          swapped: true,
        }));
      }

      // Record PlanChangeRecord in mockDb
      const changeRecord: PlanChangeRecord = {
        id: `chg-${Date.now()}`,
        patient_id: patientId,
        day_offset: item.day_offset + 1,
        day_number: item.day_number + 1,
        date: item.date,
        category: 'meals',
        before_value: 'Standard recovery meal',
        after_value: 'Soothing Khichdi & Hydrating Porridge',
        factors: [`Meal skipped: ${reasonLabel}`],
        supporting_data: { skipped_meal: item.title, reason: reasonLabel },
        source: 'engine',
        reason: `Engine adapted upcoming meals to soothing, easy-to-digest cardiac recovery diet because meal was skipped (${reasonLabel}).`,
        reverted: false,
        created_at: timestamp,
      };
      mockDb.addChange(changeRecord);

      changeNote = `Diet adapted: upcoming meals swapped to gentle soothing recovery dishes (${reasonLabel}).`;

      // Patient Notification
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: patientId,
        kind: 'plan_change',
        title: 'Diet Protocol Adapted',
        body: `Your meals were adapted to gentle soothing recovery foods because you skipped ${item.title} (${reasonLabel}).`,
        link: '/patient/planner',
        created_at: timestamp,
      });

      // Doctor Notification
      this.notifications.unshift({
        id: `notif-doc-${Date.now()}`,
        user_id: DOCTOR_ID,
        kind: 'plan_change',
        title: 'Patient Diet Adapted',
        body: `Rajesh Sharma skipped meal (${reasonLabel}). Diet adapted to gentle digestive protocol.`,
        link: '/doctor/dashboard',
        created_at: timestamp,
      });
    }

    // 5. WORKOUT STEP-DOWN IF WORKOUT SKIPPED
    if (item.category === 'workout' && status === 'skipped') {
      adaptedCategory = 'workout';
      const reasonLabel = skipReason || 'Fatigue / pain';

      const futureWorkouts = items.filter((it) => it.category === 'workout' && it.day_offset > item.day_offset);
      futureWorkouts.slice(0, 2).forEach((w) => {
        w.title = 'Target: 5 Mins Gentle Pacing (MINIMUM)';
        w.details = 'Eased to light hallway pacing only. Duration reduced because previous session was skipped.';
      });

      const changeRecord: PlanChangeRecord = {
        id: `chg-${Date.now()}`,
        patient_id: patientId,
        day_offset: item.day_offset + 1,
        day_number: item.day_number + 1,
        date: item.date,
        category: 'workout',
        before_value: '15 Minutes Activity (LIGHT)',
        after_value: '5 Minutes Hallway Pacing (MINIMUM)',
        factors: [`Workout skipped: ${reasonLabel}`],
        supporting_data: { skipped_item: item.title, reason: reasonLabel },
        source: 'engine',
        reason: `Engine eased workout duration to minimum pacing to avoid cardiovascular fatigue (${reasonLabel}).`,
        reverted: false,
        created_at: timestamp,
      };
      mockDb.addChange(changeRecord);
      changeNote = `Workout stepped down: activity eased to gentle 5-minute pacing.`;

      this.notifications.unshift({
        id: `notif-w-${Date.now()}`,
        user_id: patientId,
        kind: 'plan_change',
        title: 'Workout Duration Eased',
        body: `Physical rehabilitation stepped down to 5 mins following skipped session.`,
        link: '/patient/planner',
        created_at: timestamp,
      });
    }

    // 6. HEALTH CHECK HIGH BP TRIGGER
    if (item.category === 'check' && item.title.toLowerCase().includes('blood pressure') && value) {
      const sys = Number(String(value).split('/')[0]);
      if (sys >= 145) {
        adaptedCategory = 'checks';
        changeNote = `Systolic BP elevated (${sys} mmHg). Sodium restriction & monitoring increased.`;

        this.notifications.unshift({
          id: `notif-bp-${Date.now()}`,
          user_id: DOCTOR_ID,
          kind: 'alert',
          title: 'Elevated BP Reading',
          body: `Rajesh Sharma logged BP ${value} mmHg (exceeds 140 ceiling).`,
          link: '/doctor/dashboard',
          created_at: timestamp,
        });
      }
    }

    // 7. Run engine to synchronize daily adherence & analysis
    mockDb.runEngineForPatient(patientId);

    // Notify UI components
    this.notifyListeners();

    return {
      success: true,
      adaptedCategory,
      changeNote,
    };
  }

  /**
   * Complete All Pending Items For Today, Run Real-Time Dynamic Engine & Advance to Next Day
   */
  public completeDayAndAdvance(
    patientId: string,
    currentDayOffset: number
  ): {
    success: boolean;
    completedCount: number;
    nextDayOffset: number;
    engineResult: any;
  } {
    const items = this.getItems(patientId);
    const todayItems = items.filter((it) => it.day_offset === currentDayOffset);
    const timestamp = new Date().toISOString();
    let completedCount = 0;

    // 1. Mark all pending items for today as done
    todayItems.forEach((item) => {
      if (item.status === 'pending') {
        item.status = 'done';
        item.last_updated = timestamp;
        completedCount++;

        // Record event
        this.events.push({
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          plan_item_id: item.id,
          patient_id: patientId,
          status: 'done',
          logged_at: timestamp,
          source: 'system',
        });

        const logKind = item.category === 'meal'
          ? 'meal'
          : item.category === 'workout'
            ? 'workout'
            : item.category === 'medicine'
              ? 'medicine'
              : 'vital';

        const payload: Record<string, unknown> = {
          item_id: item.id,
          title: item.title,
          status: 'done',
          completed: true,
        };

        if (item.category === 'check') {
          if (item.title.toLowerCase().includes('pressure')) {
            payload.systolic = 124;
            payload.diastolic = 78;
          } else if (item.title.toLowerCase().includes('sugar') || item.title.toLowerCase().includes('glucose')) {
            payload.sugar = 108;
          }
        }

        mockDb.addLog({
          id: `log-adv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          patient_id: patientId,
          day_offset: item.day_offset,
          date: item.date,
          kind: logKind,
          payload,
          data: payload,
          source: 'quick_log',
          logged_at: timestamp,
          created_at: timestamp,
        });
      }
    });

    // 2. Run Dynamic Engine in real time for this patient
    const engineResult = mockDb.runEngineForPatient(patientId);

    // 3. Advance to the next day
    const patient = mockDb.getPatient(patientId);
    if (patient) {
      patient.demo_offset_days = (patient.demo_offset_days || 0) + 1;
      mockDb.savePatient(patient);
    }

    // 4. Record patient notification
    this.notifications.unshift({
      id: `notif-adv-${Date.now()}`,
      user_id: patientId,
      kind: 'plan_change',
      title: 'Day Completed & Advanced',
      body: `All daily tasks marked complete. Real-time dynamic engine evaluated recovery metrics and prepared tomorrow's protocol.`,
      link: '/patient/today',
      created_at: timestamp,
    });

    // 5. Notify all subscribing components
    this.notifyListeners();

    return {
      success: true,
      completedCount,
      nextDayOffset: currentDayOffset + 1,
      engineResult,
    };
  }
}

export const eventPipeline = new EventPipelineService();
