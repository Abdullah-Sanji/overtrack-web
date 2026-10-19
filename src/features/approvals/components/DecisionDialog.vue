<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, Button, FormField, Textarea } from '@/components/ui';
const props = defineProps<{
  open: boolean;
  kind: 'approve' | 'reject';
  requireOverrideReason: boolean;
  loading?: boolean;
}>();
const emit = defineEmits<{
  'update:open': [v: boolean];
  confirm: [p: { comment: string; overrideReason?: string }];
}>();
const comment = ref('');
const override = ref('');
const errors = ref<{ comment?: string; override?: string }>({});
watch(
  () => props.open,
  (o) => {
    if (o) {
      comment.value = '';
      override.value = '';
      errors.value = {};
    }
  },
);
function confirm() {
  errors.value = {};
  if (props.kind === 'reject' && comment.value.trim().length < 5)
    errors.value.comment = 'Give the employee a reason (at least 5 characters)';
  if (props.requireOverrideReason && override.value.trim().length < 5)
    errors.value.override = 'Explain why you are acting on behalf of the approver (at least 5 characters)';
  if (Object.keys(errors.value).length) return;
  emit('confirm', {
    comment: comment.value.trim(),
    overrideReason: props.requireOverrideReason ? override.value.trim() : undefined,
  });
}
</script>
<template>
  <Dialog
    :open="open"
    :title="kind === 'approve' ? 'Approve this sheet?' : 'Reject this sheet?'"
    :description="
      kind === 'approve'
        ? 'It moves to the next step, or to finance if this is the last step.'
        : 'It returns to the employee. Approval restarts from the first step after they resubmit.'
    "
    size="sm"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <p
        v-if="requireOverrideReason"
        class="rounded-control border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
      >
        You are not the approver for this step. This will be recorded as an admin override.
      </p>
      <FormField
        :label="kind === 'approve' ? 'Comment (optional)' : 'Reason'"
        name="decision-comment"
        :error="errors.comment"
        :required="kind === 'reject'"
        ><template #default="{ id, invalid }"
          ><Textarea :id="id" v-model="comment" :invalid="invalid" :rows="3" /></template
      ></FormField>
      <FormField
        v-if="requireOverrideReason"
        label="Override reason"
        name="override-reason"
        :error="errors.override"
        required
        ><template #default="{ id, invalid }"
          ><Textarea :id="id" v-model="override" :invalid="invalid" :rows="2" /></template
      ></FormField>
    </div>
    <template #footer>
      <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
      <Button
        data-confirm
        :variant="kind === 'reject' ? 'destructive' : 'primary'"
        :loading="loading"
        @click="confirm"
        >{{ kind === 'approve' ? 'Approve' : 'Reject' }}</Button
      >
    </template>
  </Dialog>
</template>
