<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, RouterLink } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-vue-next';
import { chainsApi } from '@/api/chains.api';
import { teamsApi } from '@/api/teams.api';
import { usersApi } from '@/api/users.api';
import type { ChainStepView } from '@/api/types';
import { fullName } from '@/lib/format';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Button, Card, Input, Combobox, FormField, Skeleton } from '@/components/ui';

const props = defineProps<{ id: string }>();
const qc = useQueryClient();
const { toast } = useToast();
const team = useQuery({ queryKey: ['team', props.id], queryFn: () => teamsApi.get(props.id) });
const chain = useQuery({ queryKey: ['chain', props.id], queryFn: () => chainsApi.get(props.id) });
const users = useQuery({
  queryKey: ['users', 'pickers'],
  queryFn: () => usersApi.list({ isActive: 'true', pageSize: 100 }),
});
const people = computed(() =>
  (users.data.value?.data ?? []).map((u) => ({ value: u.id, label: fullName(u) })),
);

interface Step {
  key: number;
  label: string;
  approverId: string | null;
  backupApproverId: string | null;
}
const MAX_STEPS = 10;
let seq = 0;
const steps = ref<Step[]>([]);
const errors = ref<Record<number, string>>({});
const saving = ref(false);

const fromServer = (s: ChainStepView[]): Step[] =>
  s.map((x) => ({
    key: ++seq,
    label: x.label,
    approverId: x.approver.id,
    backupApproverId: x.backupApprover?.id ?? null,
  }));
const plain = (list: Step[]) =>
  JSON.stringify(
    list.map((s) => ({ label: s.label, approverId: s.approverId, backupApproverId: s.backupApproverId })),
  );
watch(
  () => chain.data.value,
  (d) => {
    if (d) steps.value = fromServer(d);
  },
  { immediate: true },
);
const dirty = computed(() => plain(steps.value) !== plain(fromServer(chain.data.value ?? [])));

function add() {
  steps.value.push({
    key: ++seq,
    label: ['Tech Lead', 'Delivery Manager', 'CTO'][steps.value.length] ?? '',
    approverId: null,
    backupApproverId: null,
  });
}
function remove(i: number) {
  steps.value.splice(i, 1);
}
function move(i: number, d: -1 | 1) {
  const j = i + d;
  const a = steps.value;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
}
function validate() {
  errors.value = {};
  steps.value.forEach((s) => {
    if (!s.label.trim()) errors.value[s.key] = 'Give this step a label';
    else if (!s.approverId) errors.value[s.key] = 'Pick an approver';
    else if (s.backupApproverId === s.approverId)
      errors.value[s.key] = 'Backup must differ from the approver';
  });
  return Object.keys(errors.value).length === 0;
}
async function save() {
  if (!validate()) return;
  saving.value = true;
  try {
    const r = await chainsApi.replace(
      props.id,
      steps.value.map((s) => ({
        label: s.label.trim(),
        approverId: s.approverId!,
        backupApproverId: s.backupApproverId,
      })),
    );
    qc.setQueryData(['chain', props.id], r);
    qc.invalidateQueries({ queryKey: ['teams'] });
    toast({ title: 'Chain saved', tone: 'success' });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    saving.value = false;
  }
}
function discard() {
  steps.value = fromServer(chain.data.value ?? []);
  errors.value = {};
}
onBeforeRouteLeave(() => (dirty.value ? confirm('Discard unsaved chain changes?') : true));
defineExpose({ steps });
</script>
<template>
  <PageHeader
    :title="team.data.value ? `${team.data.value.name} · approval chain` : 'Approval chain'"
    description="Sheets go through these steps in order. Each step needs one approver; a backup can act in their place."
  >
    <template #actions>
      <RouterLink :to="{ name: 'admin-teams' }"><Button variant="ghost">Back to teams</Button></RouterLink>
      <Button variant="outline" :disabled="!dirty || saving" @click="discard">Discard</Button>
      <Button data-action="save" :loading="saving" :disabled="!dirty" @click="save">Save chain</Button>
    </template>
  </PageHeader>
  <Skeleton v-if="chain.isPending.value" :lines="4" />
  <p v-else-if="chain.isError.value" role="alert" class="text-sm text-destructive">
    {{ messageFor(chain.error.value) }}
    <Button variant="outline" size="sm" @click="chain.refetch()">Retry</Button>
  </p>
  <template v-else>
    <p
      v-if="steps.length === 0"
      role="alert"
      class="mb-4 flex items-center gap-2 rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
    >
      <AlertTriangle class="h-4 w-4 text-warning" />This team has no approval chain. Members cannot submit
      sheets until at least one step exists.
    </p>
    <div class="space-y-3">
      <Card v-for="(s, i) in steps" :key="s.key">
        <div class="grid gap-3 md:grid-cols-[auto_1fr_1fr_1fr_auto] md:items-end">
          <p class="num text-xl font-semibold text-muted-foreground md:pb-2">{{ i + 1 }}</p>
          <FormField label="Label" :name="`label-${s.key}`" :error="errors[s.key]" required>
            <template #default="{ id: fid, invalid }">
              <Input :id="fid" v-model="s.label" :invalid="invalid" placeholder="Tech Lead" />
            </template>
          </FormField>
          <FormField label="Approver" :name="`approver-${s.key}`" required>
            <template #default="{ id: fid }">
              <Combobox :id="fid" v-model="s.approverId" :options="people" placeholder="Search people" />
            </template>
          </FormField>
          <FormField label="Backup (optional)" :name="`backup-${s.key}`">
            <template #default="{ id: fid }">
              <Combobox
                :id="fid"
                v-model="s.backupApproverId"
                :options="people"
                placeholder="Search people"
              />
            </template>
          </FormField>
          <div class="flex gap-1 md:pb-1">
            <Button
              variant="ghost"
              size="sm"
              data-action="move-up"
              aria-label="Move up"
              :disabled="i === 0"
              @click="move(i, -1)"
              ><ArrowUp class="h-4 w-4"
            /></Button>
            <Button
              variant="ghost"
              size="sm"
              data-action="move-down"
              aria-label="Move down"
              :disabled="i === steps.length - 1"
              @click="move(i, 1)"
              ><ArrowDown class="h-4 w-4"
            /></Button>
            <Button variant="ghost" size="sm" aria-label="Remove step" @click="remove(i)"
              ><Trash2 class="h-4 w-4 text-destructive"
            /></Button>
          </div>
        </div>
      </Card>
      <Button variant="outline" data-action="add-step" :disabled="steps.length >= MAX_STEPS" @click="add"
        ><Plus class="h-4 w-4" />Add step</Button
      >
    </div>
  </template>
</template>
