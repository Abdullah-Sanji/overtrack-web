<script setup lang="ts">
import { h, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { AlertTriangle, Pencil, Network, Trash2 } from 'lucide-vue-next';
import { teamsApi } from '@/api/teams.api';
import type { TeamSummary } from '@/api/types';
import { fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Button, DataTable, Pagination, Badge } from '@/components/ui';
import TeamFormDrawer from './TeamFormDrawer.vue';

const qc = useQueryClient();
const { confirm } = useConfirm();
const { toast } = useToast();
const page = ref(1);
const q = useQuery({ queryKey: ['teams', page], queryFn: () => teamsApi.list({ page: page.value }) });
const open = ref(false);
const editing = ref<TeamSummary | null>(null);
function create() {
  editing.value = null;
  open.value = true;
}

async function remove(t: TeamSummary) {
  const ok = await confirm({
    title: `Delete ${t.name}?`,
    description: 'Its approval chain is removed too. Teams with members or sheets cannot be deleted.',
    confirmLabel: 'Delete',
    tone: 'destructive',
  });
  if (!ok) return;
  try {
    await teamsApi.remove(t.id);
    toast({ title: 'Team deleted', tone: 'success' });
    await qc.invalidateQueries({ queryKey: ['teams'] });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  }
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
        : h(
            'span',
            { class: 'num' },
            `${row.original.chainStepCount} ${row.original.chainStepCount === 1 ? 'step' : 'steps'}`,
          ),
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
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            'aria-label': `Delete team ${row.original.name}`,
            onClick: () => remove(row.original),
          },
          () => h(Trash2, { class: 'h-4 w-4 text-destructive' }),
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
