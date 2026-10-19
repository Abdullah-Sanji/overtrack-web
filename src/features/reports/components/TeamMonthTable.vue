<script setup lang="ts">
import { useOpenAttachment } from '@/features/sheets/useOpenAttachment';
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';
import type { ColumnDef } from '@tanstack/vue-table';
import type { TeamMonthReport, TeamMonthRow } from '@/api/types';
import { formatHours, formatDate, fullName } from '@/lib/format';
import { DataTable, StatusBadge } from '@/components/ui';
import EntriesTable from '@/features/sheets/components/EntriesTable.vue';
const openAttachment = useOpenAttachment();
const props = defineProps<{ report: TeamMonthReport; loading?: boolean }>();
const router = useRouter();
const columns = computed<ColumnDef<TeamMonthRow, unknown>[]>(() => [
  {
    id: 'employee',
    header: 'Employee',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, fullName(row.original.employee)),
        h('p', { class: 'num text-sm text-muted-foreground' }, row.original.employee.employeeCode ?? ''),
      ]),
  },
  ...props.report.types.map<ColumnDef<TeamMonthRow, unknown>>((t) => ({
    id: `type-${t.id}`,
    header: `${t.name} (h)`,
    meta: { numeric: true },
    cell: ({ row }) => formatHours(row.original.hoursByType[t.id] ?? 0),
  })),
  {
    accessorKey: 'totalHours',
    header: 'Total',
    meta: { numeric: true },
    cell: ({ row }) => h('span', { class: 'font-medium' }, formatHours(row.original.totalHours)),
  },
  {
    accessorKey: 'totalWeightedHours',
    header: 'Weighted',
    meta: { numeric: true },
    cell: ({ row }) => h('span', { class: 'font-medium' }, formatHours(row.original.totalWeightedHours)),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.sheet
        ? h(StatusBadge, { status: row.original.sheet.status })
        : h('span', { class: 'text-sm text-muted-foreground' }, 'No sheet'),
  },
  {
    id: 'paid',
    header: 'Paid',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'num text-sm' },
        row.original.sheet?.paidAt ? formatDate(row.original.sheet.paidAt.slice(0, 10)) : '—',
      ),
  },
]);
</script>
<template>
  <div>
    <DataTable
      :columns="columns"
      :rows="report.rows"
      :row-key="(r) => r.employee.id"
      :loading="loading"
      expandable
      empty-title="No team members"
      @row-click="$event.sheet && router.push({ name: 'sheet', params: { id: $event.sheet.id } })"
    >
      <template #expanded="{ row }"
        ><EntriesTable :entries="row.entries" :editable="false" @open-attachment="openAttachment"
      /></template>
      <template #footer>
        <td />
        <td class="px-4 py-3 font-medium">Team totals</td>
        <td v-for="t in report.types" :key="t.id" class="num px-4 py-3 text-right">
          {{ formatHours(report.totals.hoursByType[t.id] ?? 0) }}
        </td>
        <td class="num px-4 py-3 text-right font-semibold">{{ formatHours(report.totals.totalHours) }}</td>
        <td class="num px-4 py-3 text-right font-semibold">
          {{ formatHours(report.totals.totalWeightedHours) }}
        </td>
        <td colspan="2" />
      </template>
    </DataTable>
  </div>
</template>
