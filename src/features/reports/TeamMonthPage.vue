<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { useAuthStore } from '@/stores/auth.store';
import { teamsApi } from '@/api/teams.api';
import { reportsApi } from '@/api/reports.api';
import { currentPeriod } from '@/lib/dates';
import { messageFor } from '@/api/errors';
import { PageHeader, Select, FormField, EmptyState, Skeleton, Button } from '@/components/ui';
import TeamMonthTable from './components/TeamMonthTable.vue';
import ExportButton from './components/ExportButton.vue';
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const teamId = ref<string | null>((route.query.teamId as string) || null);
const period = ref((route.query.period as string) || currentPeriod());
const status = ref<string | null>((route.query.status as string) || null);
watch([teamId, period, status], ([t, p, s]) =>
  router.replace({ query: { teamId: t ?? undefined, period: p, status: s ?? undefined } }),
);
const teams = useQuery({
  queryKey: ['teams', 'all'],
  queryFn: () => teamsApi.list({ isActive: 'true', pageSize: 100 }),
});
const teamOptions = computed(() =>
  (teams.data.value?.data ?? []).map((t) => ({ value: t.id, label: t.name })),
);
watch(
  teamOptions,
  (o) => {
    if (!o.length) return;
    if (teamId.value && o.some((x) => x.value === teamId.value)) return;
    const own = auth.user?.teamId;
    teamId.value = o.find((x) => x.value === own)?.value ?? o[0].value;
  },
  { immediate: true },
);
const statusOptions = [
  { value: 'all', label: 'All statuses' },
  ...['draft', 'submitted', 'approved', 'paid', 'rejected'].map((s) => ({
    value: s,
    label: s[0].toUpperCase() + s.slice(1),
  })),
];
const params = computed(() => ({
  teamId: teamId.value!,
  period: period.value,
  status: status.value && status.value !== 'all' ? status.value : undefined,
}));
const report = useQuery({
  queryKey: ['team-month', params],
  queryFn: () => reportsApi.teamMonth(params.value),
  enabled: computed(() => Boolean(teamId.value)),
});
const runExport = (f: 'xlsx' | 'csv') => reportsApi.exportTeamMonth(params.value, f);
</script>
<template>
  <PageHeader
    title="Team month"
    description="Everyone on the team for one month, with hours per overtime type."
  >
    <template #actions><ExportButton :disabled="!teamId" :run="runExport" /></template>
  </PageHeader>
  <div class="mb-6 grid gap-4 sm:grid-cols-3">
    <FormField label="Team" name="teamId"
      ><template #default="{ id }"
        ><Select :id="id" v-model="teamId" :options="teamOptions" placeholder="Pick a team" /></template
    ></FormField>
    <FormField label="Month" name="period"
      ><template #default="{ id }"
        ><input
          :id="id"
          v-model="period"
          type="month"
          class="num h-11 w-full rounded-control border bg-surface px-3 text-base" /></template
    ></FormField>
    <FormField label="Status" name="status"
      ><template #default="{ id }"
        ><Select
          :id="id"
          :model-value="status ?? 'all'"
          :options="statusOptions"
          @update:model-value="status = $event" /></template
    ></FormField>
  </div>
  <Skeleton v-if="report.isPending.value && teamId" :lines="5" />
  <EmptyState
    v-else-if="report.isError.value"
    title="Could not load the report"
    :description="messageFor(report.error.value)"
    ><template #action
      ><Button variant="outline" @click="report.refetch()">Retry</Button></template
    ></EmptyState
  >
  <EmptyState
    v-else-if="!teamId"
    title="Pick a team"
    description="You can see teams where you are the tech lead or on the approval chain."
  />
  <TeamMonthTable
    v-else-if="report.data.value"
    :report="report.data.value"
    :loading="report.isFetching.value"
  />
</template>
