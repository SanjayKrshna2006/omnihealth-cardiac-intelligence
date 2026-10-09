import type { CareLink } from '../types/database';

export type AccessNeed = 'logs' | 'plan' | 'alerts';

export function canView(
  currentUserId: string,
  targetPatientId: string,
  _need: AccessNeed,
  links: CareLink[],
  now: Date = new Date(),
): boolean {
  // 1. Patient themselves always has view access to their own data
  if (currentUserId === targetPatientId) {
    return true;
  }

  // 2. Doctor: access granted only if active, unexpired care_link exists
  return links.some((link) => {
    if (link.patient_id !== targetPatientId || link.user_id !== currentUserId) {
      return false;
    }

    if (link.status !== 'active') {
      return false;
    }

    if (link.expires_at && new Date(link.expires_at) <= now) {
      return false;
    }

    return link.role === 'doctor';
  });
}

// Table mutation access check (verifies doctors can NEVER edit or delete raw logs)
export function canMutateLogs(
  currentUserId: string,
  targetPatientId: string,
  action: 'insert' | 'update' | 'delete',
): boolean {
  // Hard Rule 5: Doctors can never edit raw logs. Only patient can insert/delete own logs.
  if (action === 'insert' || action === 'delete') {
    return currentUserId === targetPatientId;
  }
  return false;
}
