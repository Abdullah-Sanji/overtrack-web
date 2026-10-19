<script setup lang="ts">
import { useOpenAttachment } from '@/features/sheets/useOpenAttachment';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Check, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { workflowApi } from '@/api/workflow.api';
import { formatPeriod, fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { PageHeader, Button, StatusBadge, Skeleton, EmptyState } from '@/components/ui';
import { useSheet } from '@/features/sheets/useSheet';
import { useSheetAction } from '@/features/sheets/useSheetAction';
import SheetTotals from '@/features/sheets/components/SheetTotals.vue';
import EntriesTable from '@/features/sheets/components/EntriesTable.vue';
import ApprovalTimeline from '@/features/sheets/components/ApprovalTimeline.vue';
import DecisionDialog from './components/DecisionDialog.vue';
const openAttachment = useOpenAttachment();
const props = defineProps<{ id: string }>();
const auth = useAuthStore();
const router = useRouter();
const qc = useQueryClient();
const { sheet, invalidate } = useSheet(props.id);
const timeline = useQuery({
  queryKey: ['timeline', props.id],
  queryFn: () => workflowApi.timeline(props.id),
});
const invalidateAll = () => Promise.all([invalidate(), qc.invalidateQueries({ queryKey: ['inbox'] })]);
const { run, pending } = useSheetAction(invalidateAll);
const current = computed(
  () =>
    sheet.data.value?.steps.find(
      (s) => s.position === sheet.data.value?.currentStepPosition && s.status === 'pending',
    ) ?? null,
);
const named = computed(() =>
  Boolean(
    current.value && [current.value.approver.id, current.value.backupApprover?.id].includes(auth.user?.id),
  ),
);
const canAct = computed(
  () =>
    sheet.data.value?.status === 'submitted' && current.value && (named.value || auth.user?.role === 'admin'),
);
const dialog = ref<null | 'approve' | 'reject'>(null);
async function decide(p: { comment: string; overrideReason?: string }) {
  const s = sheet.data.value!;
  const kind = dialog.value!;
  dialog.value = null;
  const ok = await run(
    () =>
      kind === 'approve'
        ? workflowApi.approve(s.id, s.version, p.comment || undefined, p.overrideReason)
        : workflowApi.reject(s.id, s.version, p.comment, p.overrideReason),
    kind === 'approve' ? 'Sheet approved' : 'Sheet rejected',
  );
  if (ok) router.push({ name: 'inbox' });
}
</script>
<template>
  <Skeleton v-if="sheet.isPending.value" :lines="4" />
  <EmptyState
    v-else-if="sheet.isError.value"
    title="Could not load this sheet"
    :description="messageFor(sheet.error.value)"
    ><template #action
      ><Button variant="outline" @click="sheet.refetch()">Retry</Button></template
    ></EmptyState
  >
  <template v-else-if="sheet.data.value">
    <PageHeader
      :title="`${fullName(sheet.data.value.employee)} · ${formatPeriod(sheet.data.value.period)}`"
      :description="`${sheet.data.value.employee.teamName ?? 'No team'}${current ? ` · Step ${current.position}: ${current.label}` : ''}`"
      ><template #actions><StatusBadge :status="sheet.data.value.status" /></template
    ></PageHeader>
    <div class="space-y-6">
      <SheetTotals :sheet="sheet.data.value" />
      <EntriesTable :entries="sheet.data.value.entries" :editable="false" @open-attachment="openAttachment" />
      <ApprovalTimeline v-if="timeline.data.value" :timeline="timeline.data.value" />
    </div>
    <div
      v-if="canAct"
      class="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-2 border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 shadow-lg rounded-lg mt-6"
    >
      <p v-if="!named" class="mr-auto text-sm text-warning">
        Acting as admin on behalf of {{ fullName(current!.approver) }}
      </p>
      <Button variant="destructive" data-action="reject" :loading="pending" @click="dialog = 'reject'"
        ><X class="h-4 w-4" />Reject</Button
      >
      <Button data-action="approve" :loading="pending" @click="dialog = 'approve'"
        ><Check class="h-4 w-4" />Approve</Button
      >
    </div>
    <DecisionDialog
      :open="dialog !== null"
      :kind="dialog ?? 'approve'"
      :require-override-reason="!named"
      :loading="pending"
      @update:open="(v) => !v && (dialog = null)"
      @confirm="decide"
    />
  </template>
</template>
