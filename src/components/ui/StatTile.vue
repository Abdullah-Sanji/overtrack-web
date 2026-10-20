<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'indigo';
}>();
const iconTones = {
  neutral: 'bg-muted text-foreground',
  info: 'bg-primary-soft text-primary',
  success: 'bg-accent-soft text-accent',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  indigo: 'bg-primary-soft text-indigo',
};
const iconClass = computed(() => iconTones[props.tone ?? 'info']);
</script>
<template>
  <div class="rounded-card border bg-surface p-5 shadow-card flex items-start gap-4">
    <div v-if="$slots.icon" class="rounded-full p-2.5" :class="iconClass">
      <slot name="icon" />
    </div>
    <div class="min-w-0">
      <p class="text-sm text-muted-foreground">
        {{ label }}
      </p>
      <p class="num text-2xl font-bold leading-tight text-foreground">
        {{ value }}
      </p>
      <p v-if="hint" class="text-sm text-muted-foreground mt-1">
        {{ hint }}
      </p>
    </div>
  </div>
</template>
