import { describe, it, expect } from 'vitest';
import { resolveNavigation } from './guards';

const auth = (role: string | null) => ({
  isAuthenticated: role !== null,
  user: role ? ({ role } as never) : null,
});

describe('resolveNavigation', () => {
  it('allows public routes', () =>
    expect(resolveNavigation({ meta: { public: true }, fullPath: '/login' }, auth(null))).toBe(true));
  it('redirects anonymous users to login with redirect', () =>
    expect(resolveNavigation({ meta: {}, fullPath: '/sheets/1' }, auth(null))).toEqual({
      name: 'login',
      query: { redirect: '/sheets/1' },
    }));
  it('sends authenticated users away from login', () =>
    expect(resolveNavigation({ meta: { public: true }, fullPath: '/login' }, auth('employee'))).toEqual({
      name: 'dashboard',
    }));
  it('blocks employees from admin routes with a toast', () =>
    expect(
      resolveNavigation({ meta: { perm: 'admin' }, fullPath: '/admin/users' }, auth('employee')),
    ).toEqual({ name: 'dashboard', toast: 'You do not have access to that page.' }));
  it('allows admins', () =>
    expect(resolveNavigation({ meta: { perm: 'admin' }, fullPath: '/admin/users' }, auth('admin'))).toBe(
      true,
    ));
  it('allows authenticated users on routes without meta', () =>
    expect(resolveNavigation({ meta: {}, fullPath: '/sheets' }, auth('employee'))).toBe(true));
});
