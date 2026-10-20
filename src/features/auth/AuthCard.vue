<script setup lang="ts">
import BrandMark from '@/components/layout/BrandMark.vue';
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-soft to-background px-4 py-8"
  >
    <div class="w-full max-w-md rounded-card border bg-surface p-6 shadow-card sm:p-8">
      <div class="mb-6 flex justify-center"><BrandMark :size="48" /></div>
      <h1 class="text-xl font-semibold">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
      <div class="mt-6"><slot /></div>
    </div>
  </div>
</template>
