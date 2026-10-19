<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{
  modelValue: string | number | null;
  type?: string;
  invalid?: boolean;
  id?: string;
  mono?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
<template>
  <input
    :id="id"
    :type="type ?? 'text'"
    :value="modelValue ?? ''"
    v-bind="$attrs"
    :aria-invalid="invalid ? 'true' : undefined"
    class="h-11 w-full rounded-control border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-150 disabled:opacity-50 read-only:bg-muted"
    :class="[invalid ? 'border-destructive' : 'border-border', mono ? 'num' : '']"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
