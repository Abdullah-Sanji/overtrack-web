<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <div v-if="$slots.icon" class="text-muted-foreground">
      <slot name="icon" />
    </div>
    <p class="font-medium">
      {{ title }}
    </p>
    <p v-if="description" class="max-w-sm text-sm text-muted-foreground">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
