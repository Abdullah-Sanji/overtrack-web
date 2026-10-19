<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
defineProps<{ modelValue: boolean; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
</script>
<template>
  <label class="inline-flex min-h-11 cursor-pointer items-center gap-3">
    <SwitchRoot
      :model-value="modelValue"
      class="relative h-6 w-11 cursor-pointer rounded-full bg-muted transition-colors data-[state=checked]:bg-accent"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SwitchThumb
        class="block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-[22px]"
      />
    </SwitchRoot>
    <span class="text-base">{{ label }}</span>
  </label>
</template>
