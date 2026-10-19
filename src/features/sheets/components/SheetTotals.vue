<script setup lang="ts">
import type { SheetSummary } from '@/api/types';
import { formatHours } from '@/lib/format';
defineProps<{ sheet: SheetSummary }>();
</script>
<template>
  <dl class="grid grid-cols-2 gap-4 rounded-card border bg-surface p-4 shadow-card sm:grid-cols-4">
    <div>
      <dt class="text-sm text-muted-foreground">Total hours</dt>
      <dd class="num text-xl font-semibold">{{ formatHours(sheet.totalHours) }}</dd>
    </div>
    <div>
      <dt class="text-sm text-muted-foreground">Weighted hours</dt>
      <dd class="num text-xl font-semibold">{{ formatHours(sheet.totalWeightedHours) }}</dd>
    </div>
    <div>
      <dt class="text-sm text-muted-foreground">Round</dt>
      <dd class="num text-xl font-semibold">{{ sheet.round }}</dd>
    </div>
    <div>
      <dt class="text-sm text-muted-foreground">Payment</dt>
      <dd class="num text-base">{{ sheet.paymentReference ?? '—' }}</dd>
    </div>
  </dl>
</template>
