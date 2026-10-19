<script setup lang="ts">
import { computed, ref } from 'vue';
import { Send, Undo2, RotateCcw } from 'lucide-vue-next';
import type { SheetDetail, UserRole } from '@/api/types';
import { workflowApi } from '@/api/workflow.api';
import { Button, ConfirmDialog } from '@/components/ui';
import { useSheetAction } from '../useSheetAction';
const props = defineProps<{
  sheet: SheetDetail;
  isOwner: boolean;
  role: UserRole;
  invalidate: () => Promise<unknown>;
}>();
const { run, pending } = useSheetAction(props.invalidate);
const canSubmit = computed(
  () => props.isOwner && (props.sheet.status === 'draft' || props.sheet.status === 'rejected'),
);
const canWithdraw = computed(
  () =>
    props.isOwner &&
    props.sheet.status === 'submitted' &&
    !props.sheet.steps.some((s) => s.status === 'approved'),
);
const canReopen = computed(() => props.role === 'admin' && props.sheet.status === 'approved');
const dialog = ref<null | 'submit' | 'withdraw' | 'reopen'>(null);
const chainText = computed(() =>
  props.sheet.steps.length
    ? `Approval chain: ${props.sheet.steps.map((s) => s.label).join(' → ')}.`
    : 'It will go through your team’s approval chain.',
);
async function go(reason: string) {
  const s = props.sheet;
  const d = dialog.value;
  dialog.value = null;
  if (d === 'submit') await run(() => workflowApi.submit(s.id, s.version), 'Sheet submitted');
  if (d === 'withdraw') await run(() => workflowApi.withdraw(s.id, s.version), 'Sheet withdrawn');
  if (d === 'reopen') await run(() => workflowApi.reopen(s.id, s.version, reason), 'Sheet reopened');
}
</script>
<template>
  <div
    v-if="canSubmit || canWithdraw || canReopen"
    class="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
  >
    <p v-if="canSubmit && sheet.entries.length === 0" class="mr-auto text-sm text-muted-foreground">
      Add at least one entry to submit.
    </p>
    <Button
      v-if="canWithdraw"
      variant="outline"
      data-action="withdraw"
      :loading="pending"
      @click="dialog = 'withdraw'"
      ><Undo2 class="h-4 w-4" />Withdraw</Button
    >
    <Button
      v-if="canReopen"
      variant="outline"
      data-action="reopen"
      :loading="pending"
      @click="dialog = 'reopen'"
      ><RotateCcw class="h-4 w-4" />Reopen</Button
    >
    <Button
      v-if="canSubmit"
      data-action="submit"
      :loading="pending"
      :disabled="sheet.entries.length === 0"
      @click="dialog = 'submit'"
      ><Send class="h-4 w-4" />{{ sheet.status === 'rejected' ? 'Resubmit' : 'Submit for approval' }}</Button
    >
    <ConfirmDialog
      :open="dialog === 'submit'"
      title="Submit this sheet?"
      :description="`Entries lock after submission. ${chainText}`"
      confirm-label="Submit"
      @update:open="(v) => !v && (dialog = null)"
      @confirm="go"
    />
    <ConfirmDialog
      :open="dialog === 'withdraw'"
      title="Withdraw this sheet?"
      description="It returns to draft so you can edit it. Approvers will be notified."
      confirm-label="Withdraw"
      @update:open="(v) => !v && (dialog = null)"
      @confirm="go"
    />
    <ConfirmDialog
      :open="dialog === 'reopen'"
      title="Reopen this approved sheet?"
      description="The employee can edit it again and must resubmit through the whole chain."
      confirm-label="Reopen"
      destructive
      require-reason
      @update:open="(v) => !v && (dialog = null)"
      @confirm="go"
    />
  </div>
</template>
