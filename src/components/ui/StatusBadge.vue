<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Clock, Check, CheckCircle2, XCircle } from 'lucide-vue-next';
import Badge from './Badge.vue';
import type { SheetStatus } from '@/api/types';
const props = defineProps<{ status: SheetStatus }>();
const map = {
  draft: { tone: 'neutral', label: 'Draft', icon: Pencil },
  submitted: { tone: 'info', label: 'Submitted', icon: Clock },
  approved: { tone: 'success', label: 'Approved', icon: Check },
  paid: { tone: 'paid', label: 'Paid', icon: CheckCircle2 },
  rejected: { tone: 'danger', label: 'Rejected', icon: XCircle },
} as const;
const m = computed(() => map[props.status]);
</script>
<template>
  <Badge :tone="m.tone" :class="`status-${status}`">
    <component :is="m.icon" class="h-4 w-4" aria-hidden="true" />{{ m.label }}
  </Badge>
</template>
