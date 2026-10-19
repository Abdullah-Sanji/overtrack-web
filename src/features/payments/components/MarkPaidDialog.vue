<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SheetSummary } from '@/api/types';
import { formatHours } from '@/lib/format';
import { todayIso } from '@/lib/dates';
import { Dialog, Button, FormField, Input, DatePicker } from '@/components/ui';

const props = defineProps<{ open: boolean; sheets: SheetSummary[]; loading?: boolean }>();
const emit = defineEmits<{
  'update:open': [v: boolean];
  confirm: [p: { paymentReference: string; paidAt?: string }];
}>();

const reference = ref('');
const paidAt = ref<string | null>(todayIso());
const error = ref('');

watch(
  () => props.open,
  (o) => {
    if (o) {
      reference.value = '';
      paidAt.value = todayIso();
      error.value = '';
    }
  },
);

const weighted = computed(() => props.sheets.reduce((a, s) => a + s.totalWeightedHours, 0));
const description = computed(
  () =>
    `${props.sheets.length} ${props.sheets.length === 1 ? 'sheet' : 'sheets'} · ${formatHours(weighted.value)} weighted hours`,
);

function confirm() {
  const r = reference.value.trim();
  if (!r) {
    error.value = 'Enter the payroll batch or payment reference';
    return;
  }
  if (r.length > 60) {
    error.value = 'At most 60 characters';
    return;
  }
  error.value = '';
  emit('confirm', {
    paymentReference: r,
    paidAt: paidAt.value ? new Date(`${paidAt.value}T12:00:00`).toISOString() : undefined,
  });
}
</script>

<template>
  <Dialog
    :open="open"
    title="Mark as paid"
    :description="description"
    size="sm"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormField
        label="Payment reference"
        name="paymentReference"
        :error="error"
        hint="Payroll batch id or transfer reference"
        required
      >
        <template #default="{ id, invalid }">
          <Input :id="id" v-model="reference" name="paymentReference" mono :invalid="invalid" />
        </template>
      </FormField>
      <FormField label="Paid on" name="paidAt">
        <template #default="{ id }">
          <DatePicker :id="id" v-model="paidAt" :max="todayIso()" />
        </template>
      </FormField>
    </div>
    <template #footer>
      <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
      <Button data-confirm :loading="loading" @click="confirm">Mark paid</Button>
    </template>
  </Dialog>
</template>
