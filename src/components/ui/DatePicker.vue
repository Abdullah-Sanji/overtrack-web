<script setup lang="ts">
defineProps<{
  modelValue: string | null;
  min?: string;
  max?: string;
  invalid?: boolean;
  id?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [v: string | null] }>();
</script>
<template>
  <input
    :id="id"
    type="date"
    :value="modelValue ?? ''"
    :min="min"
    :max="max"
    :disabled="disabled"
    :aria-invalid="invalid ? 'true' : undefined"
    class="num h-11 w-full rounded-control border bg-surface px-3 text-base disabled:opacity-50"
    :class="invalid ? 'border-destructive' : 'border-border'"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value || null)"
  />
</template>
