<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { auditApi } from '@/api/audit.api';
import type { AuditRow } from '@/api/types';
import { formatDateTime, fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import {
  PageHeader,
  DataTable,
  Pagination,
  Select,
  Input,
  DatePicker,
  FormField,
  Badge,
} from '@/components/ui';

const entityType = ref('all');
const entityId = ref('');
const from = ref<string | null>(null);
const to = ref<string | null>(null);
const page = ref(1);
watch([entityType, entityId, from, to], () => {
  page.value = 1;
});
const params = computed(() => ({
  entityType: entityType.value === 'all' ? undefined : entityType.value,
  entityId: entityId.value.trim() || undefined,
  from: from.value ? `${from.value}T00:00:00.000Z` : undefined,
  to: to.value ? `${to.value}T23:59:59.999Z` : undefined,
  page: page.value,
}));
const q = useQuery({ queryKey: ['audit', params], queryFn: () => auditApi.list(params.value) });
const typeOptions = [
  { value: 'all', label: 'All entities' },
  { value: 'sheet', label: 'Sheets' },
  { value: 'user', label: 'Users' },
  { value: 'team', label: 'Teams' },
  { value: 'role', label: 'Roles' },
  { value: 'chain', label: 'Chains' },
  { value: 'overtime_type', label: 'Overtime types' },
];
const tone = (a: string) =>
  a.includes('reject') || a.includes('deactivat') || a.includes('deleted')
    ? 'danger'
    : a.includes('paid') || a.includes('approved')
      ? 'success'
      : 'neutral';
const columns: ColumnDef<AuditRow, unknown>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => h('span', { class: 'num text-sm' }, formatDateTime(row.original.createdAt)),
  },
  {
    id: 'actor',
    header: 'Actor',
    cell: ({ row }) =>
      row.original.actor
        ? fullName(row.original.actor)
        : h('span', { class: 'text-muted-foreground' }, 'System'),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => h(Badge, { tone: tone(row.original.action) }, () => row.original.action),
  },
  {
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'num text-sm' },
        `${row.original.entityType} · ${row.original.entityId.slice(0, 8)}`,
      ),
  },
  { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => row.original.reason ?? '' },
];
const pretty = (v: unknown) => (v === null || v === undefined ? '—' : JSON.stringify(v, null, 2));
</script>

<template>
  <PageHeader title="Audit log" description="Every sheet transition and admin configuration change." />
  <div class="mb-4 grid gap-4 sm:grid-cols-4">
    <FormField label="Entity" name="entityType"
      ><template #default="{ id }"><Select :id="id" v-model="entityType" :options="typeOptions" /></template
    ></FormField>
    <FormField label="Entity id" name="entityId"
      ><template #default="{ id }"><Input :id="id" v-model="entityId" mono placeholder="uuid" /></template
    ></FormField>
    <FormField label="From" name="from"
      ><template #default="{ id }"><DatePicker :id="id" v-model="from" /></template
    ></FormField>
    <FormField label="To" name="to"
      ><template #default="{ id }"><DatePicker :id="id" v-model="to" /></template
    ></FormField>
  </div>
  <DataTable
    :columns="columns"
    :rows="q.data.value?.data ?? []"
    :row-key="(r) => r.id"
    :loading="q.isPending.value"
    :error="q.isError.value ? messageFor(q.error.value) : null"
    empty-title="No audit entries"
    expandable
    @retry="q.refetch()"
  >
    <template #expanded="{ row }">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="mb-1 text-xs font-medium uppercase text-muted-foreground">Before</p>
          <pre class="num overflow-x-auto rounded-control bg-surface p-3 text-xs">{{
            pretty(row.before)
          }}</pre>
        </div>
        <div>
          <p class="mb-1 text-xs font-medium uppercase text-muted-foreground">After</p>
          <pre class="num overflow-x-auto rounded-control bg-surface p-3 text-xs">{{
            pretty(row.after)
          }}</pre>
        </div>
      </div>
    </template>
  </DataTable>
  <Pagination
    v-if="q.data.value"
    :page="page"
    :page-size="q.data.value.meta.pageSize"
    :total="q.data.value.meta.total"
    @update:page="page = $event"
  />
</template>
