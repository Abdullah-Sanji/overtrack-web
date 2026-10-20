<script setup lang="ts">
import { h, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next';
import { rolesApi } from '@/api/roles.api';
import type { RoleView } from '@/api/types';
import { messageFor } from '@/api/errors';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Button, DataTable, Badge, DropdownMenu } from '@/components/ui';
import { levelLabel } from './roles';
import RoleFormDrawer from './RoleFormDrawer.vue';

const qc = useQueryClient();
const { toast } = useToast();
const { confirm } = useConfirm();
const q = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list() });
const open = ref(false);
const editing = ref<RoleView | null>(null);
const invalidate = () => qc.invalidateQueries({ queryKey: ['roles'] });
function create() {
  editing.value = null;
  open.value = true;
}
async function remove(r: RoleView) {
  const ok = await confirm({
    title: `Delete ${r.name}?`,
    description: 'People cannot be assigned this role any more. Roles with users cannot be deleted.',
    confirmLabel: 'Delete',
    tone: 'destructive',
  });
  if (!ok) return;
  try {
    await rolesApi.remove(r.id);
    toast({ title: 'Role deleted', tone: 'success' });
    await invalidate();
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  }
}
const levelTone = { employee: 'neutral', manager: 'info', finance: 'success', admin: 'indigo' } as const;
const columns: ColumnDef<RoleView, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }) =>
      h(Badge, { tone: levelTone[row.original.level] }, () => levelLabel(row.original.level)),
  },
  { accessorKey: 'userCount', header: 'Users', meta: { numeric: true } },
  {
    id: 'system',
    header: '',
    cell: ({ row }) => (row.original.isSystem ? h(Badge, { tone: 'neutral' }, () => 'Built-in') : null),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        DropdownMenu,
        {
          items: [
            {
              label: 'Edit',
              icon: Pencil,
              onSelect: () => {
                editing.value = row.original;
                open.value = true;
              },
            },
            ...(row.original.isSystem
              ? []
              : [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    ...(row.original.userCount > 0 ? { disabled: true, hint: 'In use' } : {}),
                    onSelect: () => remove(row.original),
                  },
                ]),
          ],
        },
        {
          trigger: () =>
            h(
              Button,
              { variant: 'ghost', size: 'sm', 'aria-label': `Actions for ${row.original.name}` },
              () => h(MoreHorizontal, { class: 'h-4 w-4' }),
            ),
        },
      ),
  },
];
</script>
<template>
  <PageHeader title="Roles" description="Name the roles your company uses. The level decides permissions.">
    <template #actions><Button @click="create">New role</Button></template>
  </PageHeader>
  <DataTable
    :columns="columns"
    :rows="q.data.value ?? []"
    :row-key="(r) => r.id"
    :loading="q.isPending.value"
    :error="q.isError.value ? messageFor(q.error.value) : null"
    empty-title="No roles"
    @retry="q.refetch()"
  />
  <RoleFormDrawer v-model:open="open" :role="editing" @saved="invalidate()" />
</template>
