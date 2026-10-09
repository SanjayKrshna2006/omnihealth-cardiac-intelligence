import { describe, it, expect } from 'vitest';
import { canView, canMutateLogs } from './access-control';
import { CareLink } from '../types/database';

describe('RLS & Access Control Policies (Patient & Doctor)', () => {
  const patientA = 'patient-001';
  const patientB = 'patient-002';
  const doctorLinked = 'doctor-linked-user';
  const doctorUnlinked = 'doctor-unlinked-user';

  const testLinks: CareLink[] = [
    {
      id: 'l-1',
      patient_id: patientA,
      user_id: doctorLinked,
      role: 'doctor',
      scope: 'all',
      status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'l-2',
      patient_id: patientA,
      user_id: 'revoked-doc',
      role: 'doctor',
      scope: 'all',
      status: 'revoked',
      expires_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'l-3',
      patient_id: patientA,
      user_id: 'expired-doc',
      role: 'doctor',
      scope: 'all',
      status: 'active',
      expires_at: new Date(Date.now() - 5000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  it('patient sees all of their own data', () => {
    expect(canView(patientA, patientA, 'logs', testLinks)).toBe(true);
    expect(canView(patientA, patientA, 'plan', testLinks)).toBe(true);
    expect(canView(patientA, patientA, 'alerts', testLinks)).toBe(true);
  });

  it('revoked or expired links see nothing', () => {
    expect(canView('revoked-doc', patientA, 'alerts', testLinks)).toBe(false);
    expect(canView('expired-doc', patientA, 'alerts', testLinks)).toBe(false);
  });

  it('doctor sees only linked patients, not unlinked patients', () => {
    expect(canView(doctorLinked, patientA, 'plan', testLinks)).toBe(true);
    expect(canView(doctorLinked, patientB, 'plan', testLinks)).toBe(false);
    expect(canView(doctorUnlinked, patientA, 'plan', testLinks)).toBe(false);
  });

  it('hard rule 5: doctors can NEVER insert, update, or delete raw logs', () => {
    expect(canMutateLogs(doctorLinked, patientA, 'insert')).toBe(false);
    expect(canMutateLogs(doctorLinked, patientA, 'update')).toBe(false);
    expect(canMutateLogs(doctorLinked, patientA, 'delete')).toBe(false);

    // Patient can insert and delete own logs
    expect(canMutateLogs(patientA, patientA, 'insert')).toBe(true);
    expect(canMutateLogs(patientA, patientA, 'delete')).toBe(true);
    expect(canMutateLogs(patientA, patientA, 'update')).toBe(false);
  });
});
