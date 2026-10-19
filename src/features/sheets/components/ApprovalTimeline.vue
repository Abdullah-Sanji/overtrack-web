<script setup lang="ts">
import { computed } from 'vue';
import { Check, X, Clock, SkipForward, Wallet, RotateCcw, Undo2, Send } from 'lucide-vue-next';
import type { Timeline as TimelineT, StepView, AuditRow } from '@/api/types';
import { formatDateTime, fullName } from '@/lib/format';
import { Timeline, Card } from '@/components/ui';
const props = defineProps<{ timeline: TimelineT }>();
function stepItem(s: StepView) {
  const who = s.decidedBy ? ` by ${fullName(s.decidedBy)}` : '';
  const approver = fullName(s.approver) + (s.backupApprover ? ` (backup ${fullName(s.backupApprover)})` : '');
  const override = s.overrideReason ? ` · admin override: ${s.overrideReason}` : '';
  const map = {
    pending: { tone: 'info' as const, icon: Clock, title: `${s.label}: waiting for ${approver}` },
    approved: {
      tone: 'success' as const,
      icon: Check,
      title: `${s.label}: approved${who}${s.comment ? ` — “${s.comment}”` : ''}${override}`,
    },
    rejected: {
      tone: 'danger' as const,
      icon: X,
      title: `${s.label}: rejected${who} — “${s.comment ?? ''}”${override}`,
    },
    skipped: {
      tone: 'neutral' as const,
      icon: SkipForward,
      title: `${s.label}: skipped (${s.comment === 'self' ? 'approver is the sheet owner' : (s.comment ?? '')})`,
    },
  }[s.status];
  return {
    id: `r${s.round}-${s.position}`,
    title: map.title,
    tone: map.tone,
    icon: map.icon,
    at: s.decidedAt ? formatDateTime(s.decidedAt) : undefined,
  };
}
function auditItem(a: AuditRow) {
  const who = a.actor ? ` by ${fullName(a.actor)}` : '';
  const map: Record<
    string,
    { title: string; tone: 'neutral' | 'info' | 'success' | 'danger' | 'indigo'; icon: typeof Check }
  > = {
    'sheet.submitted': { title: `Submitted${who}`, tone: 'info', icon: Send },
    'sheet.withdrawn': { title: `Withdrawn${who}`, tone: 'neutral', icon: Undo2 },
    'sheet.reopened': {
      title: `Reopened${who}${a.reason ? ` — ${a.reason}` : ''}`,
      tone: 'neutral',
      icon: RotateCcw,
    },
    'sheet.paid': { title: `Marked paid${who}`, tone: 'success', icon: Wallet },
    'sheet.payment_reverted': {
      title: `Payment reverted${who}${a.reason ? ` — ${a.reason}` : ''}`,
      tone: 'danger',
      icon: Undo2,
    },
  };
  const m = map[a.action];
  return m ? { id: a.id, title: m.title, tone: m.tone, icon: m.icon, at: formatDateTime(a.createdAt) } : null;
}
const rounds = computed(() =>
  [...props.timeline.rounds]
    .sort((a, b) => b.round - a.round)
    .map((r) => ({ round: r.round, items: r.steps.map(stepItem) })),
);
const events = computed(() =>
  props.timeline.audit
    .map(auditItem)
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .reverse(),
);
</script>
<template>
  <Card
    ><template #header><h2 class="font-semibold">Approval history</h2></template>
    <div class="space-y-6">
      <div v-if="events.length">
        <p class="mb-2 text-sm font-medium text-muted-foreground">Events</p>
        <Timeline :items="events" />
      </div>
      <div v-for="r in rounds" :key="r.round">
        <p class="mb-2 text-sm font-medium text-muted-foreground">Round {{ r.round }}</p>
        <Timeline :items="r.items" />
      </div>
      <p v-if="!rounds.length && !events.length" class="text-sm text-muted-foreground">Not submitted yet.</p>
    </div>
  </Card>
</template>
