<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus } from 'lucide-vue-next';
import { overtimeTypesApi } from '@/api/overtime-types.api';
import type { OvertimeType } from '@/api/types';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Card, Button, Input, Switch, Skeleton } from '@/components/ui';

const qc = useQueryClient();
const { toast } = useToast();
const q = useQuery({
  queryKey: ['overtime-types', 'all'],
  queryFn: () => overtimeTypesApi.list(true),
});

type Row = OvertimeType & { saving?: boolean };
const rows = ref<Row[]>([]);
const original = ref<Record<string, OvertimeType>>({});
watch(
  () => q.data.value,
  (d) => {
    if (d) {
      rows.value = d.map((t) => ({ ...t }));
      original.value = Object.fromEntries(d.map((t) => [t.id, t]));
    }
  },
  { immediate: true },
);

const dirty = (r: Row) => {
  const o = original.value[r.id];
  return (
    !o ||
    o.name !== r.name ||
    o.multiplier !== r.multiplier ||
    o.color !== r.color ||
    o.isActive !== r.isActive
  );
};
const multiplierChanged = (r: Row) => {
  const o = original.value[r.id];
  return Boolean(o) && o!.multiplier !== r.multiplier;
};
const valid = (r: Row) => r.name.trim().length > 0 && r.multiplier > 0 && /^#[0-9A-Fa-f]{6}$/.test(r.color);

async function save(r: Row) {
  r.saving = true;
  try {
    await overtimeTypesApi.update(r.id, {
      name: r.name.trim(),
      multiplier: r.multiplier,
      color: r.color,
      isActive: r.isActive,
    });
    toast({ title: 'Overtime type saved', tone: 'success' });
    await qc.invalidateQueries({ queryKey: ['overtime-types'] });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    r.saving = false;
  }
}

const draft = ref<{ name: string; multiplier: number; color: string } | null>(null);
const creating = ref(false);
const draftValid = () =>
  Boolean(draft.value) &&
  draft.value!.name.trim().length > 0 &&
  draft.value!.multiplier > 0 &&
  /^#[0-9A-Fa-f]{6}$/.test(draft.value!.color);
async function create() {
  if (!draft.value || !draftValid()) return;
  creating.value = true;
  try {
    await overtimeTypesApi.create({
      name: draft.value.name.trim(),
      multiplier: draft.value.multiplier,
      color: draft.value.color,
      sortOrder: rows.value.length + 1,
    });
    draft.value = null;
    toast({ title: 'Overtime type added', tone: 'success' });
    await qc.invalidateQueries({ queryKey: ['overtime-types'] });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <PageHeader
    title="Overtime types"
    description="Each type has a multiplier. Changing a multiplier affects future submissions only; submitted sheets keep their snapshot."
  >
    <template #actions>
      <Button :disabled="Boolean(draft)" @click="draft = { name: '', multiplier: 1.5, color: '#2563EB' }">
        <Plus class="h-4 w-4" />Add type
      </Button>
    </template>
  </PageHeader>
  <Skeleton v-if="q.isPending.value" :lines="4" />
  <p v-else-if="q.isError.value" role="alert" class="text-sm text-danger">
    {{ messageFor(q.error.value) }}
    <Button variant="outline" size="sm" @click="q.refetch()">Retry</Button>
  </p>
  <div v-else class="space-y-3">
    <p v-if="!rows.length && !draft" class="text-sm text-muted-foreground">No overtime types yet.</p>
    <Card v-for="r in rows" :key="r.id">
      <div class="grid gap-3 md:grid-cols-[1fr_140px_120px_auto_auto] md:items-center">
        <Input v-model="r.name" :aria-label="`Name of ${r.name}`" />
        <div>
          <Input
            :model-value="r.multiplier"
            :name="`multiplier-${r.id}`"
            type="number"
            step="0.01"
            min="0.01"
            mono
            aria-label="Multiplier"
            @update:model-value="r.multiplier = Number($event)"
          />
          <p v-if="multiplierChanged(r)" class="mt-1 text-xs text-muted-foreground">
            Applies to future submissions only
          </p>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="r.color"
            type="color"
            class="h-11 w-11 cursor-pointer rounded-control border bg-surface"
            aria-label="Color"
          /><span class="num">{{ r.color }}</span>
        </label>
        <Switch v-model="r.isActive" label="Active" />
        <Button
          :data-action="`save-${r.id}`"
          size="sm"
          :disabled="!dirty(r) || !valid(r)"
          :loading="r.saving"
          @click="save(r)"
          >Save</Button
        >
      </div>
    </Card>
    <Card v-if="draft">
      <div class="grid gap-3 md:grid-cols-[1fr_140px_120px_auto_auto] md:items-center">
        <Input v-model="draft.name" placeholder="Night shift" aria-label="New type name" />
        <Input
          :model-value="draft.multiplier"
          type="number"
          step="0.01"
          min="0.01"
          mono
          aria-label="New multiplier"
          @update:model-value="draft.multiplier = Number($event)"
        />
        <input
          v-model="draft.color"
          type="color"
          class="h-11 w-11 cursor-pointer rounded-control border bg-surface"
          aria-label="New color"
        />
        <Button variant="outline" size="sm" @click="draft = null">Cancel</Button>
        <Button size="sm" :loading="creating" :disabled="!draftValid()" @click="create">Add</Button>
      </div>
    </Card>
  </div>
</template>
