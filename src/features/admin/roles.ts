import type { RoleLevel } from '@/api/types';

export const LEVEL_OPTIONS: Array<{ value: RoleLevel; label: string; description: string }> = [
  {
    value: 'employee',
    label: 'Employee',
    description: 'Own sheets only. Can approve when named on a chain.',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Plus team month view and exports for teams whose chain names them.',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Manager rights for all teams, mark sheets paid, view own audit actions.',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Everything, including users, teams, chains, roles and overtime types.',
  },
];

export const levelLabel = (l: RoleLevel) => LEVEL_OPTIONS.find((o) => o.value === l)?.label ?? l;
