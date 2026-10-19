<script setup lang="ts">
withDefaults(defineProps<{ lines?: number }>(), { lines: 1 });
</script>
<template>
  <div
    aria-hidden="true"
    class="space-y-2"
  >
    <div
      v-for="i in lines"
      :key="i"
      class="h-4 animate-pulse rounded bg-muted"
      :class="i === lines && lines > 1 ? 'w-2/3' : 'w-full'"
    />
  </div>
</template>
