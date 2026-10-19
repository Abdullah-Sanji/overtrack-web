import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

export const useUiStore = defineStore('ui', () => {
  const stored = read('ot.theme');
  const prefersDark = stored === null && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = ref<'light' | 'dark'>(stored === 'dark' || prefersDark ? 'dark' : 'light');
  const sidebarCollapsed = ref(read('ot.sidebar') === 'collapsed');
  const mobileNavOpen = ref(false);
  watch(
    theme,
    (t) => {
      document.documentElement.classList.toggle('dark', t === 'dark');
      write('ot.theme', t);
    },
    { immediate: true },
  );
  watch(sidebarCollapsed, (c) => write('ot.sidebar', c ? 'collapsed' : 'open'));
  return {
    theme,
    sidebarCollapsed,
    mobileNavOpen,
    toggleTheme: () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
    },
    toggleSidebar: () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    },
  };
});
