<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ modelValue: string | null; invalid?: boolean; id?: string; rows?: number }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
<template>
  <textarea
    :id="id"
    :rows="rows ?? 3"
    :value="modelValue ?? ''"
    v-bind="$attrs"
    :aria-invalid="invalid ? 'true' : undefined"
    class="w-full rounded-control border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50"
    :class="invalid ? 'border-destructive' : 'border-border'"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
