<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from './Dialog.vue';
import Button from './Button.vue';
import FormField from './FormField.vue';
import Textarea from './Textarea.vue';
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    requireReason?: boolean;
    reasonLabel?: string;
  }>(),
  { description: undefined, confirmLabel: 'Confirm', reasonLabel: 'Reason' },
);
const emit = defineEmits<{ 'update:open': [v: boolean]; confirm: [reason: string] }>();
const reason = ref('');
const error = ref('');
watch(
  () => props.open,
  (o) => {
    if (o) {
      reason.value = '';
      error.value = '';
    }
  },
);
function confirm() {
  if (props.requireReason && reason.value.trim().length < 5) {
    error.value = 'Please give a reason (at least 5 characters)';
    return;
  }
  emit('confirm', reason.value.trim());
}
</script>
<template>
  <Dialog
    :open="open"
    :title="title"
    :description="description"
    size="sm"
    @update:open="emit('update:open', $event)"
  >
    <FormField v-if="requireReason" :label="reasonLabel" name="confirm-reason" :error="error" required>
      <template #default="{ id, invalid }"
        ><Textarea :id="id" v-model="reason" :invalid="invalid" :rows="3"
      /></template>
    </FormField>
    <template #footer>
      <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
      <Button
        data-confirm
        :variant="destructive ? 'destructive' : 'primary'"
        :loading="loading"
        @click="confirm"
        >{{ confirmLabel }}</Button
      >
    </template>
  </Dialog>
</template>
