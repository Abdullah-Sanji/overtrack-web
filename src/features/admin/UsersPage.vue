<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { useDebounceFn } from '@vueuse/core';
import { MoreHorizontal, Pencil, Mail, UserX, UserCheck } from 'lucide-vue-next';
import { usersApi } from '@/api/users.api';
import { teamsApi } from '@/api/teams.api';
import type { PublicUser } from '@/api/types';
import { fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import {
  PageHeader,
  Button,
  Input,
  Select,
  FormField,
  DataTable,
  Pagination,
  Badge,
  DropdownMenu,
  ConfirmDialog,
} from '@/components/ui';
import { ROLE_OPTIONS, roleLabel } from './roles';
import UserFormDrawer from './UserFormDrawer.vue';

const qc = useQueryClient();
const { toast } = useToast();
const search = ref('');
const debounced = ref('');
const role = ref('all');
const active = ref('true');
const page = ref(1);
const setSearch = useDebounceFn((v: string) => {
  debounced.value = v;
  page.value = 1;
}, 300);
watch(search, setSearch);
watch([role, active], () => {
  page.value = 1;
});
const params = computed(() => ({
  search: debounced.value || undefined,
  role: role.value === 'all' ? undefined : role.value,
  isActive: active.value === 'all' ? undefined : (active.value as 'true' | 'false'),
  page: page.value,
}));
const q = useQuery({ queryKey: ['users', params], queryFn: () => usersApi.list(params.value) });
const teams = useQuery({ queryKey: ['teams', 'all'], queryFn: () => teamsApi.list({ pageSize: 100 }) });
const teamName = (id: string | null) => teams.data.value?.data.find((t) => t.id === id)?.name ?? '—';

const drawerOpen = ref(false);
const editing = ref<PublicUser | null>(null);
const toggling = ref<PublicUser | null>(null);
const toggleLoading = ref(false);
const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

async function resend(u: PublicUser) {
  try {
    await usersApi.resendInvite(u.id);
    toast({ title: `Invite sent to ${u.email}`, tone: 'success' });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  }
}
async function confirmToggle() {
  const u = toggling.value!;
  toggleLoading.value = true;
  try {
    await (u.isActive ? usersApi.deactivate(u.id) : usersApi.reactivate(u.id));
    toast({ title: u.isActive ? 'User deactivated' : 'User reactivated', tone: 'success' });
    toggling.value = null;
    await invalidate();
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    toggleLoading.value = false;
  }
}
function invite() {
  editing.value = null;
  drawerOpen.value = true;
}

const columns: ColumnDef<PublicUser, unknown>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, fullName(row.original)),
        h('p', { class: 'text-sm text-muted-foreground' }, row.original.email),
      ]),
  },
  {
    accessorKey: 'employeeCode',
    header: 'Code',
    cell: ({ row }) => h('span', { class: 'num' }, row.original.employeeCode ?? '—'),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) =>
      h(Badge, { tone: row.original.role === 'admin' ? 'indigo' : 'neutral' }, () =>
        roleLabel(row.original.role),
      ),
  },
  { id: 'team', header: 'Team', cell: ({ row }) => teamName(row.original.teamId) },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { tone: row.original.isActive ? 'success' : 'danger' }, () =>
        row.original.isActive ? 'Active' : 'Inactive',
      ),
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
                drawerOpen.value = true;
              },
            },
            { label: 'Resend invite', icon: Mail, onSelect: () => resend(row.original) },
            row.original.isActive
              ? {
                  label: 'Deactivate',
                  icon: UserX,
                  destructive: true,
                  onSelect: () => {
                    toggling.value = row.original;
                  },
                }
              : {
                  label: 'Reactivate',
                  icon: UserCheck,
                  onSelect: () => {
                    toggling.value = row.original;
                  },
                },
          ],
        },
        {
          trigger: () =>
            h(Button, { variant: 'ghost', size: 'sm', 'aria-label': 'Actions' }, () =>
              h(MoreHorizontal, { class: 'h-4 w-4' }),
            ),
        },
      ),
  },
];
</script>
<template>
  <PageHeader title="Users" description="Invite people, assign roles and teams, deactivate leavers.">
    <template #actions><Button @click="invite">Invite user</Button></template>
  </PageHeader>
  <div class="mb-4 grid gap-4 sm:grid-cols-3">
    <FormField label="Search" name="search">
      <template #default="{ id }">
        <Input :id="id" v-model="search" type="search" placeholder="Name or email" />
      </template>
    </FormField>
    <FormField label="Role" name="role">
      <template #default="{ id }">
        <Select :id="id" v-model="role" :options="[{ value: 'all', label: 'All roles' }, ...ROLE_OPTIONS]" />
      </template>
    </FormField>
    <FormField label="Status" name="active">
      <template #default="{ id }">
        <Select
          :id="id"
          v-model="active"
          :options="[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
            { value: 'all', label: 'All' },
          ]"
        />
      </template>
    </FormField>
  </div>
  <DataTable
    :columns="columns"
    :rows="q.data.value?.data ?? []"
    :row-key="(u) => u.id"
    :loading="q.isPending.value"
    :error="q.isError.value ? messageFor(q.error.value) : null"
    empty-title="No users match"
    @retry="q.refetch()"
  />
  <Pagination
    v-if="q.data.value"
    :page="page"
    :page-size="q.data.value.meta.pageSize"
    :total="q.data.value.meta.total"
    @update:page="page = $event"
  />
  <UserFormDrawer
    v-model:open="drawerOpen"
    :user="editing"
    :teams="teams.data.value?.data ?? []"
    @saved="invalidate()"
  />
  <ConfirmDialog
    :open="Boolean(toggling)"
    :title="toggling?.isActive ? 'Deactivate this user?' : 'Reactivate this user?'"
    :description="
      toggling
        ? `${fullName(toggling)} · ${toggling.email}${toggling.isActive ? '. They will no longer be able to sign in. Sheets and decisions are kept.' : ''}`
        : ''
    "
    :confirm-label="toggling?.isActive ? 'Deactivate' : 'Reactivate'"
    :destructive="toggling?.isActive"
    :loading="toggleLoading"
    @update:open="(v) => !v && (toggling = null)"
    @confirm="confirmToggle"
  />
</template>
