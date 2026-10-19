<script setup lang="ts">
import { computed } from 'vue';
import Spinner from './Spinner.vue';
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md';
    loading?: boolean;
    type?: 'button' | 'submit';
    block?: boolean;
    disabled?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);
const variants = {
  primary: 'bg-primary text-on-primary hover:brightness-110',
  secondary: 'bg-secondary text-on-secondary hover:brightness-110',
  outline: 'border bg-surface text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-on-destructive hover:brightness-110',
};
const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-150 cursor-pointer select-none',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  props.size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-base',
  variants[props.variant],
  props.block ? 'w-full' : '',
]);
</script>
<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
  >
    <Spinner
      v-if="loading"
      size="sm"
    />
    <slot />
  </button>
</template>
