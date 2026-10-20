import type { PublicUser } from '@/api/types';

export type Perm = 'admin' | 'finance' | 'manager' | 'approver';

export function hasPerm(user: Pick<PublicUser, 'role'> | null, perm: Perm): boolean {
  if (!user) return false;
  const level = user.role.level;
  if (perm === 'admin') return level === 'admin';
  if (perm === 'finance') return level === 'finance' || level === 'admin';
  // 'manager' and 'approver' share the same level set; Inbox visibility is refined by data.
  return level === 'manager' || level === 'finance' || level === 'admin';
}
