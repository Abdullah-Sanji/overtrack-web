<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <div class="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
    <div class="w-full max-w-md rounded-card border bg-surface p-6 shadow-card sm:p-8">
      <p class="mb-6 text-center text-lg font-semibold text-primary">OverTrack</p>
      <h1 class="text-xl font-semibold">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
      <div class="mt-6"><slot /></div>
    </div>
  </div>
</template>
