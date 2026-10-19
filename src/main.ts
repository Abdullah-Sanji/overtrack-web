import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import './styles/base.css';
import { queryClient } from './app/query';

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin, { queryClient });
app.mount('#app');
