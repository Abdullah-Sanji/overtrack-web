<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { sheetsApi } from '@/api/sheets.api';
import { teamsApi } from '@/api/teams.api';
import { workflowApi } from '@/api/workflow.api';
import { reportsApi } from '@/api/reports.api';
import type { SheetSummary } from '@/api/types';
import { formatHours, formatPeriod, formatDateTime, fullName } from '@/lib/format';
import { currentPeriod } from '@/lib/dates';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import {
  PageHeader,
  Tabs,
  DataTable,
  Pagination,
  Checkbox,
  Button,
  Select,
  FormField,
  ConfirmDialog,
} from '@/components/ui';
import { useSheetAction } from '@/features/sheets/useSheetAction';
import ExportButton from '@/features/reports/components/ExportButton.vue';
import MarkPaidDialog from './components/MarkPaidDialog.vue';

const router = useRouter();
const qc = useQueryClient();
const { toast } = useToast();

const tab = ref<'approved' | 'paid'>('approved');
const page = ref(1);
const period = ref('');
const teamId = ref<string | null>(null);
const selected = ref<Set<string>>(new Set());
watch([tab, period, teamId], () => {
  page.value = 1;
  selected.value = new Set();
});
watch(page, () => {
  selected.value = new Set();
});

const teams = useQuery({
  queryKey: ['teams', 'all'],
  queryFn: () => teamsApi.list({ isActive: 'true', pageSize: 100 }),
});
const teamOptions = computed(() => [
  { value: 'all', label: 'All teams' },
  ...(teams.data.value?.data ?? []).map((t) => ({ value: t.id, label: t.name })),
]);

const params = computed(() => ({
  status: tab.value,
  period: period.value || undefined,
  teamId: teamId.value && teamId.value !== 'all' ? teamId.value : undefined,
  page: page.value,
  pageSize: 50,
}));
const q = useQuery({
  queryKey: ['sheets', 'payments', params],
  queryFn: () => sheetsApi.list(params.value),
});
const invalidate = () => qc.invalidateQueries({ queryKey: ['sheets'] });
const { run, pending } = useSheetAction(invalidate);

const rows = computed(() => q.data.value?.data ?? []);
const errorMessage = computed(() => (q.isError.value ? messageFor(q.error.value) : null));
const allSelected = computed(
  () => rows.value.length > 0 && rows.value.every((r) => selected.value.has(r.id)),
);
function toggleAll(v: boolean) {
  selected.value = v ? new Set(rows.value.map((r) => r.id)) : new Set();
}
function toggle(id: string, v: boolean) {
  const n = new Set(selected.value);
  if (v) n.add(id);
  else n.delete(id);
  selected.value = n;
}
const selectedSheets = computed(() => rows.value.filter((r) => selected.value.has(r.id)));

const payOpen = ref(false);
const paying = ref(false);
const reverting = ref<SheetSummary | null>(null);

async function pay(p: { paymentReference: string; paidAt?: string }) {
  paying.value = true;
  try {
    const res = await workflowApi.markPaidBulk(
      selectedSheets.value.map((s) => ({ id: s.id, version: s.version })),
      p.paymentReference,
      p.paidAt,
    );
    toast({ title: `Marked ${res.paid.length} paid`, tone: 'success' });
    if (res.failed.length) {
      toast({
        title: `${res.failed.length} could not be paid`,
        description: res.failed.map((f) => f.code).join(', '),
        tone: 'error',
      });
    }
    payOpen.value = false;
    selected.value = new Set();
    await invalidate();
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    paying.value = false;
  }
}

async function revert(reason: string) {
  const s = reverting.value;
  if (!s) return;
  reverting.value = null;
  await run(() => workflowApi.revertPaid(s.id, s.version, reason), 'Payment reverted');
}

type Col = ColumnDef<SheetSummary, unknown>;
const columns = computed<Col[]>(() => {
  const cols: Col[] = [];
  if (tab.value === 'approved') {
    cols.push({
      id: 'select',
      header: () =>
        h(Checkbox, {
          modelValue: allSelected.value,
          ariaLabel: 'Select all on this page',
          'onUpdate:modelValue': toggleAll,
        }),
      cell: ({ row }) =>
        h('div', { onClick: (e: Event) => e.stopPropagation() }, [
          h(Checkbox, {
            modelValue: selected.value.has(row.original.id),
            ariaLabel: `Select ${fullName(row.original.employee)}`,
            'onUpdate:modelValue': (v: boolean) => toggle(row.original.id, v),
          }),
        ]),
    });
  }
  cols.push(
    {
      id: 'employee',
      header: 'Employee',
      cell: ({ row }) =>
        h('div', [
          h('p', { class: 'font-medium' }, fullName(row.original.employee)),
          h('p', { class: 'text-sm text-muted-foreground' }, row.original.employee.teamName ?? ''),
        ]),
    },
    { accessorKey: 'period', header: 'Month', cell: ({ row }) => formatPeriod(row.original.period) },
    {
      accessorKey: 'totalHours',
      header: 'Hours',
      meta: { numeric: true },
      cell: ({ row }) => formatHours(row.original.totalHours),
    },
    {
      accessorKey: 'totalWeightedHours',
      header: 'Weighted',
      meta: { numeric: true },
      cell: ({ row }) => formatHours(row.original.totalWeightedHours),
    },
  );
  if (tab.value === 'approved') {
    cols.push({
      id: 'approvedAt',
      header: 'Approved',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'num text-sm' },
          row.original.approvedAt ? formatDateTime(row.original.approvedAt) : '—',
        ),
    });
  } else {
    cols.push(
      {
        id: 'paidAt',
        header: 'Paid',
        cell: ({ row }) =>
          h(
            'span',
            { class: 'num text-sm' },
            row.original.paidAt ? formatDateTime(row.original.paidAt) : '—',
          ),
      },
      {
        id: 'ref',
        header: 'Reference',
        cell: ({ row }) => h('span', { class: 'num' }, row.original.paymentReference ?? ''),
      },
      {
        id: 'revert',
        header: '',
        cell: ({ row }) =>
          h(
            Button,
            {
              variant: 'ghost',
              size: 'sm',
              onClick: (e: Event) => {
                e.stopPropagation();
                reverting.value = row.original;
              },
            },
            () => 'Revert',
          ),
      },
    );
  }
  return cols;
});

const exportRun = (f: Parameters<typeof reportsApi.exportEmployees>[1]) =>
  reportsApi.exportEmployees(
    { period: period.value || currentPeriod(), teamId: params.value.teamId, status: tab.value },
    f,
  );
const gotoSheet = (s: SheetSummary) => router.push({ name: 'sheet', params: { id: s.id } });
</script>

<template>
  <PageHeader
    title="Payments"
    description="Approved sheets waiting for payroll, and what has already been paid."
  >
    <template #actions><ExportButton :run="exportRun" /></template>
  </PageHeader>
  <div class="mb-4 grid gap-4 sm:grid-cols-3">
    <FormField label="Month" name="period" hint="Leave empty for all months">
      <template #default="{ id }">
        <input
          :id="id"
          v-model="period"
          type="month"
          class="num h-11 w-full rounded-control border bg-surface px-3 text-base"
        />
      </template>
    </FormField>
    <FormField label="Team" name="team">
      <template #default="{ id }">
        <Select
          :id="id"
          :model-value="teamId ?? 'all'"
          :options="teamOptions"
          @update:model-value="teamId = $event"
        />
      </template>
    </FormField>
  </div>
  <Tabs
    v-model="tab"
    :tabs="[
      {
        value: 'approved',
        label: 'Approved, unpaid',
        count: tab === 'approved' ? q.data.value?.meta.total : undefined,
      },
      { value: 'paid', label: 'Paid' },
    ]"
  >
    <template #approved>
      <div
        v-if="selected.size"
        class="mb-3 flex items-center gap-3 rounded-card border bg-primary/5 px-4 py-2"
      >
        <p class="text-sm">{{ selected.size }} selected</p>
        <Button size="sm" @click="payOpen = true">Mark paid ({{ selected.size }})</Button>
        <Button size="sm" variant="ghost" @click="selected = new Set()">Clear</Button>
      </div>
      <DataTable
        :columns="columns"
        :rows="rows"
        :row-key="(s) => s.id"
        :loading="q.isPending.value"
        :error="errorMessage"
        empty-title="Nothing waiting for payment"
        @retry="q.refetch()"
        @row-click="gotoSheet"
      />
      <Pagination
        v-if="q.data.value"
        :page="page"
        :page-size="q.data.value.meta.pageSize"
        :total="q.data.value.meta.total"
        @update:page="page = $event"
      />
    </template>
    <template #paid>
      <DataTable
        :columns="columns"
        :rows="rows"
        :row-key="(s) => s.id"
        :loading="q.isPending.value"
        :error="errorMessage"
        empty-title="No paid sheets"
        @retry="q.refetch()"
        @row-click="gotoSheet"
      />
      <Pagination
        v-if="q.data.value"
        :page="page"
        :page-size="q.data.value.meta.pageSize"
        :total="q.data.value.meta.total"
        @update:page="page = $event"
      />
    </template>
  </Tabs>
  <MarkPaidDialog v-model:open="payOpen" :sheets="selectedSheets" :loading="paying" @confirm="pay" />
  <ConfirmDialog
    :open="Boolean(reverting)"
    title="Revert this payment?"
    :description="
      reverting
        ? `${fullName(reverting.employee)} · ${formatPeriod(reverting.period)} · ${reverting.paymentReference}`
        : ''
    "
    confirm-label="Revert"
    destructive
    require-reason
    :loading="pending"
    @update:open="(v) => !v && (reverting = null)"
    @confirm="revert"
  />
</template>
