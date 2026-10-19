<script setup lang="ts">
defineProps<{ modelValue: string | null; invalid?: boolean; id?: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: string | null] }>();
function normalize(v: string): string | null {
  const m = v.match(/^(\d{1,2}):(\d{1,2})/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2].padStart(2, '0')}`;
}
</script>
<template>
  <input
    :id="id"
    type="time"
    step="900"
    :value="modelValue ?? ''"
    :disabled="disabled"
    :aria-invalid="invalid ? 'true' : undefined"
    class="num h-11 w-full rounded-control border bg-surface px-3 text-base disabled:opacity-50"
    :class="invalid ? 'border-destructive' : 'border-border'"
    @input="emit('update:modelValue', normalize(($event.target as HTMLInputElement).value))"
  />
</template>
