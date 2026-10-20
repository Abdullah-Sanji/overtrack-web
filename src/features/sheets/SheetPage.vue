<script setup lang="ts">
import { useOpenAttachment } from './useOpenAttachment';
import { computed, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import type { EntryView } from '@/api/types';
import { useQuery } from '@tanstack/vue-query';
import { sheetsApi } from '@/api/sheets.api';
import { workflowApi } from '@/api/workflow.api';
import { useAuthStore } from '@/stores/auth.store';
import { formatPeriod, fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Button, StatusBadge, Skeleton, ConfirmDialog, EmptyState } from '@/components/ui';
import { useSheet } from './useSheet';
import SheetTotals from './components/SheetTotals.vue';
import EntriesTable from './components/EntriesTable.vue';
import EntryForm from './components/EntryForm.vue';
import SheetActions from './components/SheetActions.vue';
import RejectionBanner from './components/RejectionBanner.vue';
import ApprovalTimeline from './components/ApprovalTimeline.vue';

const openAttachment = useOpenAttachment();
const props = defineProps<{ id: string }>();
const auth = useAuthStore();
const { toast } = useToast();
const { sheet, invalidate } = useSheet(props.id);
const timeline = useQuery({
  queryKey: ['timeline', props.id],
  queryFn: () => workflowApi.timeline(props.id),
});
const isOwner = computed(() => sheet.data.value?.employee.id === auth.user?.id);
const editable = computed(
  () => isOwner.value && (sheet.data.value?.status === 'draft' || sheet.data.value?.status === 'rejected'),
);
const formOpen = ref(false);
const editing = ref<EntryView | null>(null);
const removing = ref<EntryView | null>(null);
const removeLoading = ref(false);
function add() {
  editing.value = null;
  formOpen.value = true;
}
function edit(e: EntryView) {
  editing.value = e;
  formOpen.value = true;
}
async function saved(e: EntryView) {
  editing.value = e;
  await invalidate();
}
async function confirmRemove() {
  if (!removing.value) return;
  removeLoading.value = true;
  try {
    await sheetsApi.deleteEntry(props.id, removing.value.id);
    toast({ title: 'Entry deleted', tone: 'success' });
    removing.value = null;
    await invalidate();
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    removeLoading.value = false;
  }
}
</script>
<template>
  <Skeleton v-if="sheet.isPending.value" :lines="4" />
  <EmptyState
    v-else-if="sheet.isError.value"
    title="Could not load this sheet"
    :description="messageFor(sheet.error.value)"
  >
    <template #action><Button variant="outline" @click="sheet.refetch()">Retry</Button></template>
  </EmptyState>
  <template v-else-if="sheet.data.value">
    <PageHeader
      :title="formatPeriod(sheet.data.value.period)"
      :description="
        isOwner
          ? 'Your overtime sheet'
          : `${fullName(sheet.data.value.employee)} · ${sheet.data.value.employee.teamName ?? 'No team'}`
      "
    >
      <template #actions>
        <StatusBadge :status="sheet.data.value.status" />
        <Button v-if="editable" @click="add"><Plus class="h-4 w-4" />Add entry</Button>
      </template>
    </PageHeader>
    <div class="space-y-6">
      <RejectionBanner
        v-if="sheet.data.value.status === 'rejected' && sheet.data.value.rejectionReason"
        :reason="sheet.data.value.rejectionReason"
        :rejected-at="sheet.data.value.rejectedAt"
      />
      <SheetTotals :sheet="sheet.data.value" />
      <EntriesTable
        :entries="sheet.data.value.entries"
        :editable="editable"
        @edit="edit"
        @remove="removing = $event"
        @open-attachment="openAttachment"
      >
        <template #empty-action><Button v-if="editable" @click="add">Add entry</Button></template>
      </EntriesTable>
      <ApprovalTimeline v-if="timeline.data.value" :timeline="timeline.data.value" />
      <SheetActions
        :sheet="sheet.data.value"
        :is-owner="isOwner"
        :level="auth.user?.role.level ?? 'employee'"
        :invalidate="invalidate"
      />
    </div>
    <EntryForm
      v-model:open="formOpen"
      :sheet-id="id"
      :period="sheet.data.value.period"
      :entry="editing"
      @saved="saved"
    />
    <ConfirmDialog
      :open="Boolean(removing)"
      title="Delete this entry?"
      :description="
        removing ? `${removing.date} ${removing.startTime}–${removing.endTime}, ${removing.workItem}` : ''
      "
      confirm-label="Delete"
      destructive
      :loading="removeLoading"
      @update:open="(v) => !v && (removing = null)"
      @confirm="confirmRemove"
    />
  </template>
</template>
