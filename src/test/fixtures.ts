import type { PublicUser, RoleLevel, RoleRef } from '@/api/types';

export const ROLES: Record<RoleLevel, RoleRef> = {
  employee: { id: 'r-emp', name: 'Employee', level: 'employee' },
  manager: { id: 'r-mgr', name: 'Tech Lead', level: 'manager' },
  finance: { id: 'r-fin', name: 'Finance', level: 'finance' },
  admin: { id: 'r-adm', name: 'Admin', level: 'admin' },
};

export function makeUser(o: Partial<Omit<PublicUser, 'role'>> & { level?: RoleLevel } = {}): PublicUser {
  const { level = 'employee', ...rest } = o;
  return {
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Admin',
    email: 'ada@t.local',
    employeeCode: 'E1',
    department: null,
    teamId: null,
    timezone: 'UTC',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    role: ROLES[level],
    ...rest,
  };
}
