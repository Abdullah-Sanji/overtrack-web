<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{ tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'indigo' }>(),
  { tone: 'neutral' },
);
const tones = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-secondary/15 text-secondary',
  success: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/15 text-destructive',
  indigo: 'bg-indigo/15 text-indigo',
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
