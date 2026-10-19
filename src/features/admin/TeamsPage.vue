<script setup lang="ts">
import { h, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { AlertTriangle, Pencil, Network } from 'lucide-vue-next';
import { teamsApi } from '@/api/teams.api';
import type { TeamSummary } from '@/api/types';
import { fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { PageHeader, Button, DataTable, Pagination, Badge } from '@/components/ui';
import TeamFormDrawer from './TeamFormDrawer.vue';

const qc = useQueryClient();
const page = ref(1);
const q = useQuery({ queryKey: ['teams', page], queryFn: () => teamsApi.list({ page: page.value }) });
const open = ref(false);
const editing = ref<TeamSummary | null>(null);
function create() {
  editing.value = null;
  open.value = true;
}

const columns: ColumnDef<TeamSummary, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Team',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, row.original.name),
        h('p', { class: 'text-sm text-muted-foreground' }, row.original.description ?? ''),
      ]),
  },
  {
    id: 'lead',
    header: 'Tech lead',
    cell: ({ row }) => (row.original.techLead ? fullName(row.original.techLead) : '—'),
  },
  { accessorKey: 'memberCount', header: 'Members', meta: { numeric: true } },
  {
    id: 'chain',
    header: 'Chain',
    cell: ({ row }) =>
      row.original.chainStepCount === 0
        ? h(Badge, { tone: 'warning' }, () => [h(AlertTriangle, { class: 'h-4 w-4' }), 'No chain'])
        : h('span', { class: 'num' }, `${row.original.chainStepCount} steps`),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { tone: row.original.isActive ? 'success' : 'neutral' }, () =>
        row.original.isActive ? 'Active' : 'Inactive',
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-1' }, [
        h(RouterLink, { to: { name: 'admin-chain', params: { id: row.original.id } } }, () =>
          h(Button, { variant: 'ghost', size: 'sm' }, () => [h(Network, { class: 'h-4 w-4' }), 'Chain']),
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            'aria-label': 'Edit team',
            onClick: () => {
              editing.value = row.original;
              open.value = true;
            },
          },
          () => h(Pencil, { class: 'h-4 w-4' }),
        ),
      ]),
  },
];
</script>
<template>
  <PageHeader title="Teams" description="Each team has a tech lead and its own approval chain.">
    <template #actions><Button @click="create">New team</Button></template>
  </PageHeader>
  <DataTable
    :columns="columns"
    :rows="q.data.value?.data ?? []"
    :row-key="(t) => t.id"
    :loading="q.isPending.value"
    :error="q.isError.value ? messageFor(q.error.value) : null"
    empty-title="No teams yet"
    @retry="q.refetch()"
  />
  <Pagination
    v-if="q.data.value"
    :page="page"
    :page-size="q.data.value.meta.pageSize"
    :total="q.data.value.meta.total"
    @update:page="page = $event"
  />
  <TeamFormDrawer
    v-model:open="open"
    :team="editing"
    @saved="qc.invalidateQueries({ queryKey: ['teams'] })"
  />
</template>
