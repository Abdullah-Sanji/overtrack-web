import { hasPerm, type Perm } from '@/lib/permissions';
import type { PublicUser } from '@/api/types';

export interface NavTarget {
  meta: { public?: boolean; perm?: Perm };
  fullPath: string;
}
export type NavResult =
  true | { name: 'login'; query: { redirect: string } } | { name: 'dashboard'; toast?: string };

export function resolveNavigation(
  to: NavTarget,
  auth: { isAuthenticated: boolean; user: PublicUser | null },
): NavResult {
  if (to.meta.public) return auth.isAuthenticated ? { name: 'dashboard' } : true;
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.perm && !hasPerm(auth.user, to.meta.perm))
    return { name: 'dashboard', toast: 'You do not have access to that page.' };
  return true;
}
