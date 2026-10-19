<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' }>();
</script>
<template>
  <span
    data-spinner
    role="status"
    aria-label="Loading"
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    :class="size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'"
  />
</template>
