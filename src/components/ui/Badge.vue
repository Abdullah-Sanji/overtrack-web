<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{ tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'indigo' | 'paid' }>(),
  { tone: 'neutral' },
);
const tones = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-primary-soft text-primary',
  success: 'bg-accent-soft text-accent',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  indigo: 'bg-primary-soft text-indigo',
  paid: 'bg-paid-soft text-paid',
};
const cls = computed(() => tones[props.tone]);
</script>
<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap"
    :class="cls"
    ><slot
  /></span>
</template>
