<script setup lang="ts">
import type { Component } from 'vue';
import { Circle } from 'lucide-vue-next';
defineProps<{
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    at?: string;
    tone?: 'neutral' | 'info' | 'success' | 'danger' | 'indigo';
    icon?: Component;
  }>;
}>();
const tones = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-secondary/15 text-secondary',
  success: 'bg-accent/15 text-accent',
  danger: 'bg-destructive/15 text-destructive',
  indigo: 'bg-indigo/15 text-indigo',
};
</script>
<template>
  <ol class="relative space-y-4 border-l pl-6">
    <li v-for="it in items" :key="it.id" class="relative">
      <span
        class="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full"
        :class="tones[it.tone ?? 'neutral']"
        ><component :is="it.icon ?? Circle" class="h-3 w-3" aria-hidden="true"
      /></span>
      <p class="font-medium leading-5">{{ it.title }}</p>
      <p v-if="it.subtitle" class="text-sm text-muted-foreground">{{ it.subtitle }}</p>
      <p v-if="it.at" class="num text-xs text-muted-foreground">{{ it.at }}</p>
    </li>
  </ol>
</template>
