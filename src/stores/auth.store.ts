import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api/auth.api';
import { setTokenProvider } from '@/api/client';
import type { PublicUser } from '@/api/types';
import { queryClient } from '@/app/query';
import { useNotificationsStore } from './notifications.store';
import { hasPerm, type Perm } from '@/lib/permissions';

let sessionLostHandler: (() => void) | null = null;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null);
  const accessToken = ref<string | null>(null);
  const status = ref<'idle' | 'loading' | 'ready'>('idle');

  function wipe() {
    user.value = null;
    accessToken.value = null;
    queryClient.clear();
    const n = useNotificationsStore();
    n.stopPolling();
    n.reset();
  }

  /** Token provider hook: the session was lost mid-use. */
  function clear() {
    const had = Boolean(user.value);
    wipe();
    if (had) sessionLostHandler?.();
  }

  function setSessionLostHandler(h: (() => void) | null) {
    sessionLostHandler = h;
  }

  setTokenProvider({
    get: () => accessToken.value,
    refresh: async () => {
      const t = await authApi.refresh();
      accessToken.value = t;
      return t;
    },
    clear,
  });

  async function bootstrap() {
    if (status.value !== 'idle') return;
    status.value = 'loading';
    try {
      accessToken.value = await authApi.refresh();
      user.value = await authApi.me();
    } catch {
      wipe();
    } finally {
      status.value = 'ready';
    }
  }

  async function login(email: string, password: string) {
    const r = await authApi.login(email, password);
    queryClient.clear();
    useNotificationsStore().reset();
    accessToken.value = r.accessToken;
    user.value = r.user;
    status.value = 'ready';
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      wipe();
    }
  }

  const isAuthenticated = computed(() => Boolean(user.value));
  const role = computed(() => user.value?.role ?? null);
  const level = computed(() => user.value?.role.level ?? null);
  const can = (perm: Perm) => hasPerm(user.value, perm);

  return {
    user,
    accessToken,
    status,
    bootstrap,
    login,
    logout,
    clear,
    setSessionLostHandler,
    isAuthenticated,
    role,
    level,
    can,
    setUser: (u: PublicUser) => {
      user.value = u;
    },
  };
});
