import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import './styles/base.css';
import { queryClient } from './app/query';
import { router } from './app/router';
import { useAuthStore } from './stores/auth.store';

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin, { queryClient });
app.use(router);
useAuthStore().setSessionLostHandler(() => {
  if (router.currentRoute.value.meta.public) return;
  void router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
});
app.mount('#app');
