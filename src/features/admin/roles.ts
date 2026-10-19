import type { UserRole } from '@/api/types';

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'employee', label: 'Employee' },
  { value: 'tech_lead', label: 'Tech lead' },
  { value: 'delivery_manager', label: 'Delivery manager' },
  { value: 'cto', label: 'CTO' },
  { value: 'finance', label: 'Finance' },
  { value: 'admin', label: 'Admin' },
];

export const roleLabel = (r: UserRole) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;
