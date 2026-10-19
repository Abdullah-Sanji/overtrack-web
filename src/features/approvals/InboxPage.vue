<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import type { ColumnDef } from '@tanstack/vue-table';
import { formatDistanceToNow } from 'date-fns';
import { inboxApi, type InboxScope } from '@/api/inbox.api';
import type { InboxRow } from '@/api/types';
import { formatHours, formatPeriod, fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { PageHeader, Tabs, DataTable, Pagination, Badge, StatusBadge } from '@/components/ui';
const route = useRoute();
const router = useRouter();
const scope = ref<InboxScope>((route.query.scope as InboxScope) || 'waiting');
const page = ref(1);
watch(scope, (s) => {
  page.value = 1;
  router.replace({ query: { ...route.query, scope: s } });
});
const q = useQuery({
  queryKey: ['inbox', scope, page],
  queryFn: () => inboxApi.list(scope.value, page.value),
});
const counts = {
  waiting: useQuery({
    queryKey: ['inbox', 'waiting', 'count'],
    queryFn: () => inboxApi.list('waiting', 1, 1),
  }),
  upcoming: useQuery({
    queryKey: ['inbox', 'upcoming', 'count'],
    queryFn: () => inboxApi.list('upcoming', 1, 1),
  }),
};
const tabs = computed(() => [
  { value: 'waiting', label: 'Waiting for me', count: counts.waiting.data.value?.meta.total },
  { value: 'upcoming', label: 'Coming to me', count: counts.upcoming.data.value?.meta.total },
  { value: 'decided', label: 'Decided by me' },
]);
const columns = computed<ColumnDef<InboxRow, unknown>[]>(() => [
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
    id: 'step',
    header: 'Step',
    cell: ({ row }) =>
      h(
        Badge,
        {
          tone:
            scope.value === 'decided'
              ? row.original.step.status === 'approved'
                ? 'success'
                : 'danger'
              : 'info',
        },
        () =>
          `${row.original.step.position}. ${row.original.step.label}${scope.value === 'decided' ? ` · ${row.original.step.status}` : ''}`,
      ),
  },
  { id: 'status', header: 'Sheet', cell: ({ row }) => h(StatusBadge, { status: row.original.status }) },
  {
    id: 'age',
    header: scope.value === 'decided' ? 'Decided' : 'Waiting since',
    cell: ({ row }) => {
      const d = scope.value === 'decided' ? row.original.step.decidedAt : row.original.submittedAt;
      return d
        ? h(
            'span',
            { class: 'num text-sm text-muted-foreground' },
            formatDistanceToNow(new Date(d), { addSuffix: true }),
          )
        : '—';
    },
  },
]);
</script>
<template>
  <PageHeader title="Inbox" description="Sheets that need your decision, and the ones on their way to you." />
  <Tabs v-model="scope" :tabs="tabs">
    <template v-for="t in tabs" :key="t.value" #[t.value]>
      <DataTable
        :columns="columns"
        :rows="q.data.value?.data ?? []"
        :row-key="(r) => `${r.id}-${r.step.position}`"
        :loading="q.isPending.value"
        :error="q.isError.value ? messageFor(q.error.value) : null"
        :empty-title="
          scope === 'waiting'
            ? 'Nothing waiting for you'
            : scope === 'upcoming'
              ? 'Nothing on its way'
              : 'No decisions yet'
        "
        @retry="q.refetch()"
        @row-click="router.push({ name: 'review', params: { id: $event.id } })"
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
</template>
