<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui';
import { Check } from 'lucide-vue-next';
defineProps<{ modelValue: boolean; label?: string; ariaLabel?: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
</script>
<template>
  <label class="inline-flex min-h-11 cursor-pointer items-center gap-2">
    <CheckboxRoot
      :model-value="modelValue"
      :aria-label="ariaLabel"
      class="flex h-5 w-5 cursor-pointer items-center justify-center rounded border bg-surface data-[state=checked]:bg-primary data-[state=checked]:text-on-primary"
      @update:model-value="emit('update:modelValue', $event === true)"
    >
      <CheckboxIndicator><Check class="h-4 w-4" /></CheckboxIndicator>
    </CheckboxRoot>
    <span v-if="label" class="text-base">{{ label }}</span>
  </label>
</template>
