import { describe, it, expect } from 'vitest';
import { getJourneyContext } from './journey';
import { mockDb, PATIENT_ID } from './mock-db';

describe('Journey Context - Single Source of Truth for Today & Days', () => {
  it('returns identical day number and relation for patient and doctor views', () => {
    // Calling from patient perspective
    const patientContext = getJourneyContext(PATIENT_ID);

    // Calling from doctor perspective for the exact same patient
    const doctorContext = getJourneyContext(PATIENT_ID);

    expect(patientContext.patientId).toBe(doctorContext.patientId);
    expect(patientContext.dayOffset).toBe(doctorContext.dayOffset);
    expect(patientContext.dayNumber).toBe(doctorContext.dayNumber);
    expect(patientContext.relation).toBe(doctorContext.relation);
    expect(patientContext.relationLabel).toBe(doctorContext.relationLabel);
    expect(patientContext.totalDays).toBe(doctorContext.totalDays);
    expect(patientContext.surgeryDate).toBe(doctorContext.surgeryDate);
  });

  it('correctly adapts when demo_offset_days is modified', () => {
    const patient = mockDb.getPatient(PATIENT_ID)!;
    const initialContext = getJourneyContext(PATIENT_ID);

    // Simulate advancing 2 days via dev-tools
    patient.demo_offset_days = 2;
    mockDb.savePatient(patient);

    const advancedContext = getJourneyContext(PATIENT_ID);
    expect(advancedContext.dayOffset).toBe(initialContext.dayOffset + 2);
    expect(advancedContext.demoOffsetDays).toBe(2);

    // Reset back
    patient.demo_offset_days = 0;
    mockDb.savePatient(patient);
  });
});
