import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsApi } from '@/api/notifications.api';
import type { Notification } from '@/api/types';

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([]);
  const unread = ref(0);
  const loaded = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function load() {
    try {
      const r = await notificationsApi.list(false, 1, 10);
      items.value = r.data;
      unread.value = r.meta.unread;
      loaded.value = true;
    } catch {
      /* keep last state */
    }
  }

  async function markRead(id: string) {
    const n = items.value.find((i) => i.id === id);
    if (!n || n.readAt) return;
    n.readAt = new Date().toISOString();
    unread.value = Math.max(0, unread.value - 1);
    try {
      await notificationsApi.markRead(id);
    } catch {
      await load();
    }
  }

  async function markAllRead() {
    items.value.forEach((i) => {
      i.readAt ??= new Date().toISOString();
    });
    unread.value = 0;
    try {
      await notificationsApi.markAllRead();
    } catch {
      await load();
    }
  }

  function startPolling(ms = 60_000) {
    stopPolling();
    void load();
    timer = setInterval(load, ms);
  }
  function stopPolling() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function reset() {
    stopPolling();
    items.value = [];
    unread.value = 0;
    loaded.value = false;
  }

  return {
    items,
    unread,
    loaded,
    load,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    reset,
  };
});
