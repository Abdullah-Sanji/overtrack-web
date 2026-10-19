import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api/auth.api';
import { setTokenProvider } from '@/api/client';
import type { PublicUser } from '@/api/types';
import { hasPerm, type Perm } from '@/lib/permissions';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null);
  const accessToken = ref<string | null>(null);
  const status = ref<'idle' | 'loading' | 'ready'>('idle');

  function clear() {
    user.value = null;
    accessToken.value = null;
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
      clear();
    } finally {
      status.value = 'ready';
    }
  }

  async function login(email: string, password: string) {
    const r = await authApi.login(email, password);
    accessToken.value = r.accessToken;
    user.value = r.user;
    status.value = 'ready';
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }

  const isAuthenticated = computed(() => Boolean(user.value));
  const role = computed(() => user.value?.role ?? null);
  const can = (perm: Perm) => hasPerm(user.value, perm);

  return {
    user,
    accessToken,
    status,
    bootstrap,
    login,
    logout,
    isAuthenticated,
    role,
    can,
    setUser: (u: PublicUser) => {
      user.value = u;
    },
  };
});
