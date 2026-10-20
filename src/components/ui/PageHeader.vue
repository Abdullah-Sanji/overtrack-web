<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; compact?: boolean }>(), {
  description: undefined,
  compact: false,
});
</script>
<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    :class="compact ? '' : 'mb-6'"
  >
    <div>
      <h1 class="text-[28px] font-bold leading-tight">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-1 text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
