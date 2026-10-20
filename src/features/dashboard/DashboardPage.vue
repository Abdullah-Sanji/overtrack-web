<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { Clock, Scale, Inbox, Wallet, FileText } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationsStore } from '@/stores/notifications.store';
import { sheetsApi } from '@/api/sheets.api';
import { inboxApi } from '@/api/inbox.api';
import { currentPeriod } from '@/lib/dates';
import { formatHours, formatPeriod } from '@/lib/format';
import { PageHeader, StatTile, StatusBadge, Card, Skeleton, Button } from '@/components/ui';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const router = useRouter();
const period = currentPeriod();

const month = useQuery({
  queryKey: ['sheets', 'for-period', period],
  queryFn: () => sheetsApi.forPeriod(period),
});
const waiting = useQuery({
  queryKey: ['inbox', 'waiting', 'count'],
  queryFn: () => inboxApi.list('waiting', 1, 1),
});
const unpaid = useQuery({
  queryKey: ['sheets', 'approved-count'],
  queryFn: () => sheetsApi.list({ status: 'approved', pageSize: 1 }),
  enabled: computed(() => auth.can('finance')),
});
const recent = useQuery({
  queryKey: ['sheets', 'mine', 'recent'],
  queryFn: () => sheetsApi.list({ employeeId: auth.user?.id, pageSize: 5 }),
});

function addOvertime() {
  router.push(
    month.data.value ? { name: 'sheet', params: { id: month.data.value.id } } : { name: 'my-sheets' },
  );
}
</script>
<template>
  <div class="mb-6 rounded-card bg-gradient-to-r from-primary-soft to-surface p-5 shadow-card">
    <PageHeader compact :title="`Hello, ${auth.user?.firstName ?? ''}`" :description="formatPeriod(period)">
      <template #actions><Button @click="addOvertime">Add overtime</Button></template>
    </PageHeader>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <template v-if="month.isPending.value">
      <Skeleton v-for="i in 2" :key="i" :lines="2" />
    </template>
    <template v-else-if="month.data.value">
      <StatTile
        label="This month"
        :value="`${formatHours(month.data.value.totalHours)} h`"
        hint="Overtime hours"
      >
        <template #icon><Clock class="h-5 w-5" /></template>
      </StatTile>
      <StatTile
        label="Weighted"
        :value="`${formatHours(month.data.value.totalWeightedHours)} h`"
        hint="After multipliers"
      >
        <template #icon><Scale class="h-5 w-5" /></template>
      </StatTile>
      <RouterLink
        :to="{ name: 'sheet', params: { id: month.data.value.id } }"
        class="rounded-card border bg-surface p-5 shadow-card hover:bg-muted/40"
      >
        <p class="text-sm text-muted-foreground">Sheet status</p>
        <div class="mt-2"><StatusBadge :status="month.data.value.status" /></div>
      </RouterLink>
    </template>
    <RouterLink :to="{ name: 'inbox' }">
      <StatTile label="Waiting for you" :value="waiting.data.value?.meta.total ?? '–'" hint="Approvals">
        <template #icon><Inbox class="h-5 w-5" /></template>
      </StatTile>
    </RouterLink>
    <RouterLink v-if="auth.can('finance')" :to="{ name: 'payments' }">
      <StatTile
        label="Ready for payment"
        :value="unpaid.data.value?.meta.total ?? '–'"
        hint="Approved, unpaid"
      >
        <template #icon><Wallet class="h-5 w-5" /></template>
      </StatTile>
    </RouterLink>
  </div>
  <div class="mt-6 grid gap-6 lg:grid-cols-2">
    <Card>
      <template #header><h2 class="font-semibold">Recent activity</h2></template>
      <p v-if="!notifications.items.length" class="text-sm text-muted-foreground">No activity yet</p>
      <ul v-else class="divide-y">
        <li v-for="n in notifications.items.slice(0, 5)" :key="n.id">
          <component
            :is="n.link ? RouterLink : 'div'"
            :to="n.link ?? undefined"
            class="block min-h-11 py-2"
            :class="n.link ? 'hover:text-primary' : ''"
          >
            <p class="text-sm font-medium">{{ n.title }}</p>
            <p class="text-sm text-muted-foreground">{{ n.body }}</p>
            <p class="num text-xs text-muted-foreground">
              {{ formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) }}
            </p>
          </component>
        </li>
      </ul>
    </Card>
    <Card>
      <template #header><h2 class="font-semibold">My recent sheets</h2></template>
      <Skeleton v-if="recent.isPending.value" :lines="3" />
      <p v-else-if="!recent.data.value?.data.length" class="text-sm text-muted-foreground">
        No sheets yet. Add your first overtime entry.
      </p>
      <ul v-else class="divide-y">
        <li v-for="s in recent.data.value.data" :key="s.id">
          <RouterLink
            :to="{ name: 'sheet', params: { id: s.id } }"
            class="flex min-h-11 items-center justify-between gap-3 py-2 hover:text-primary"
          >
            <span class="flex items-center gap-2">
              <FileText class="h-4 w-4 text-muted-foreground" />{{ formatPeriod(s.period) }}
            </span>
            <span class="flex items-center gap-3">
              <span class="num text-sm">{{ formatHours(s.totalHours) }} h</span>
              <StatusBadge :status="s.status" />
            </span>
          </RouterLink>
        </li>
      </ul>
    </Card>
  </div>
</template>
