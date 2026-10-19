<script setup lang="ts">
import { initials } from '@/lib/format';
defineProps<{ person: { firstName: string; lastName: string }; size?: 'sm' | 'md' }>();
</script>
<template>
  <span
    class="inline-flex items-center justify-center rounded-full bg-primary/15 font-medium text-primary"
    :class="size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'"
    :aria-label="`${person.firstName} ${person.lastName}`"
    >{{ initials(person) }}</span
  >
</template>
