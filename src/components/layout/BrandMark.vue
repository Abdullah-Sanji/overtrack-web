<script setup lang="ts">
import logoUrl from '@/assets/logo.svg';
withDefaults(defineProps<{ size?: number; wordmark?: boolean; light?: boolean }>(), {
  size: 32,
  wordmark: true,
  light: false,
});
</script>
<template>
  <span class="inline-flex items-center gap-2.5">
    <img :src="logoUrl" alt="" :width="size" :height="size" class="shrink-0 rounded-[25%]" />
    <span
      v-if="wordmark"
      class="text-lg font-bold tracking-tight"
      :class="light ? 'text-sidebar-foreground' : 'text-foreground'"
      >OverTrack</span
    >
  </span>
</template>
