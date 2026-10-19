<script setup lang="ts">
import { XCircle } from 'lucide-vue-next';
import { formatDateTime } from '@/lib/format';
defineProps<{ reason: string; rejectedAt: string | null }>();
</script>
<template>
  <div
    role="alert"
    class="flex items-start gap-3 rounded-card border border-destructive/40 bg-destructive/10 p-4"
  >
    <XCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p class="font-medium text-destructive">
        This sheet was rejected<span v-if="rejectedAt" class="num font-normal text-muted-foreground">
          · {{ formatDateTime(rejectedAt) }}</span
        >
      </p>
      <p class="mt-1 text-sm">{{ reason }}</p>
      <p class="mt-1 text-sm text-muted-foreground">
        Fix the entries and resubmit. Approval starts again from the first step.
      </p>
    </div>
    <slot name="action" />
  </div>
</template>
