<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'indigo';
}>();
const valueTones = {
  neutral: 'text-foreground',
  info: 'text-secondary',
  success: 'text-accent',
  warning: 'text-warning',
  danger: 'text-destructive',
  indigo: 'text-indigo',
};
const valueClass = computed(() => (props.tone ? valueTones[props.tone] : 'text-foreground'));
</script>
<template>
  <div class="rounded-card border bg-surface p-5 shadow-card flex items-start gap-4">
    <div
      v-if="$slots.icon"
      class="rounded-control bg-muted p-2 text-primary"
    >
      <slot name="icon" />
    </div>
    <div class="min-w-0">
      <p class="text-sm text-muted-foreground">
        {{ label }}
      </p>
      <p
        class="num text-2xl font-semibold leading-tight"
        :class="valueClass"
      >
        {{ value }}
      </p>
      <p
        v-if="hint"
        class="text-sm text-muted-foreground mt-1"
      >
        {{ hint }}
      </p>
    </div>
  </div>
</template>
