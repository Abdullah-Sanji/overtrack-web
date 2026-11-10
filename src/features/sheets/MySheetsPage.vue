<script setup lang="ts">
import { h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { sheetsApi } from '@/api/sheets.api';
import { useAuthStore } from '@/stores/auth.store';
import type { SheetSummary } from '@/api/types';
import { currentPeriod } from '@/lib/dates';
import { formatHours, formatPeriod, formatDateTime } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Button, DataTable, Pagination, StatusBadge, MonthPicker } from '@/components/ui';

const router = useRouter();
const auth = useAuthStore();
const { toast } = useToast();
const page = ref(1);
const q = useQuery({
  queryKey: ['sheets', 'mine', page],
  queryFn: () => sheetsApi.list({ employeeId: auth.user?.id, page: page.value }),
});
const opening = ref(false);
// Any month up to the current one can be opened, so overtime can be recorded after the fact.
const maxPeriod = currentPeriod();
const month = ref<string | null>(maxPeriod);
async function openMonth() {
  const period = month.value ?? maxPeriod;
  opening.value = true;
  try {
    const s = await sheetsApi.forPeriod(period);
    await router.push({ name: 'sheet', params: { id: s.id } });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    opening.value = false;
  }
}
const columns: ColumnDef<SheetSummary, unknown>[] = [
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
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(StatusBadge, { status: row.original.status }),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) =>
      h('span', { class: 'num' }, row.original.submittedAt ? formatDateTime(row.original.submittedAt) : '—'),
  },
];
</script>
<template>
  <PageHeader
    title="My sheets"
    description="One sheet per month. Pick any month up to the current one to add entries, then submit when it is complete."
  >
    <template #actions>
      <label for="sheet-month" class="sr-only">Month</label>
      <MonthPicker id="sheet-month" v-model="month" :max="maxPeriod" class="w-44" />
      <Button data-testid="open-month" :loading="opening" @click="openMonth">Open month</Button>
    </template>
  </PageHeader>
  <DataTable
    :columns="columns"
    :rows="q.data.value?.data ?? []"
    :row-key="(s) => s.id"
    :loading="q.isPending.value"
    :error="q.isError.value ? messageFor(q.error.value) : null"
    empty-title="No sheets yet"
    empty-description="Pick a month above and open it to add your first entry."
    @retry="q.refetch()"
    @row-click="router.push({ name: 'sheet', params: { id: $event.id } })"
  >
    <template #empty-action><Button @click="openMonth">Open month</Button></template>
  </DataTable>
  <Pagination
    v-if="q.data.value"
    :page="page"
    :page-size="q.data.value.meta.pageSize"
    :total="q.data.value.meta.total"
    @update:page="page = $event"
  />
</template>
