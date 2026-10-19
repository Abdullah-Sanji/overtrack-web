import type { PublicUser, UserRole } from '@/api/types';

export type Perm = 'admin' | 'finance' | 'manager' | 'approver';

const MANAGER: UserRole[] = ['tech_lead', 'delivery_manager', 'cto', 'finance', 'admin'];

export function hasPerm(user: Pick<PublicUser, 'role'> | null, perm: Perm): boolean {
  if (!user) return false;
  if (perm === 'admin') return user.role === 'admin';
  if (perm === 'finance') return user.role === 'finance' || user.role === 'admin';
  // 'manager' and 'approver' share the same role set; Inbox visibility is refined by data.
  return MANAGER.includes(user.role);
}
