import { NavTab } from '../types';

/**
 * CareSync Role-Based Access Control Matrix (RBAC).
 * Enforces role-specific navigation for Doctor, Nurse, Receptionist, Admin, and Patient Family.
 */
export const RBAC_TABS: Record<string, NavTab[]> = {
  patient: ['family-portal'],
  receptionist: ['patient-intake', 'bed-management', 'family-portal'],
  nurse: ['overview', 'ward-dashboard', 'care-tasks', 'patient-360', 'medication-safety', 'bed-management'],
  doctor: ['overview', 'ward-dashboard', 'care-tasks', 'patient-360', 'medication-safety', 'bed-management', 'family-portal', 'analytics'],
  admin: ['overview', 'patient-intake', 'ward-dashboard', 'care-tasks', 'patient-360', 'medication-safety', 'bed-management', 'family-portal', 'analytics', 'administration'],
};

export function tabsForRole(role: string | undefined): NavTab[] {
  if (!role) return RBAC_TABS.nurse;
  return RBAC_TABS[role.toLowerCase()] || RBAC_TABS.nurse;
}
