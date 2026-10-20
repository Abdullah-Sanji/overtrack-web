import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { queryClient } from '@/app/query';
import { makeUser } from '@/test/fixtures';
import { useAuthStore } from './auth.store';
import { useNotificationsStore } from './notifications.store';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(async () => ({ accessToken: 't', user: makeUser({ id: 'u' }) })),
    logout: vi.fn(async () => {}),
    refresh: vi.fn(async () => 't'),
    me: vi.fn(async () => makeUser({ id: 'u' })),
  },
}));
vi.mock('@/api/notifications.api', () => ({ notificationsApi: { list: vi.fn(async () => ({})) } }));

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('clear() invokes the registered session-lost handler when signed in', async () => {
    const auth = useAuthStore();
    const handler = vi.fn();
    auth.setSessionLostHandler(handler);
    await auth.login('a@b.c', 'x');
    auth.clear();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(auth.user).toBeNull();
    auth.clear();
    expect(handler).toHaveBeenCalledTimes(1);
    auth.setSessionLostHandler(null);
  });

  it('logout clears the query cache and notifications', async () => {
    const spy = vi.spyOn(queryClient, 'clear');
    const auth = useAuthStore();
    const n = useNotificationsStore();
    n.unread = 3;
    await auth.login('a@b.c', 'x');
    spy.mockClear();
    n.unread = 3;
    await auth.logout();
    expect(spy).toHaveBeenCalled();
    expect(n.unread).toBe(0);
  });
});
