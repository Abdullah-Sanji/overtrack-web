<script setup lang="ts">
import { focusFirstInvalid } from '@/lib/forms';
import { discardGuard } from '@/composables/useConfirm';
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/vue-query';
import type { TeamSummary } from '@/api/types';
import { teamsApi } from '@/api/teams.api';
import { usersApi } from '@/api/users.api';
import { ApiError, messageFor, fieldErrors } from '@/api/errors';
import { fullName } from '@/lib/format';
import { useToast } from '@/components/ui/useToast';
import { Drawer, Button, FormField, Input, Textarea, Combobox, Switch } from '@/components/ui';

const props = defineProps<{ open: boolean; team?: TeamSummary | null }>();
const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [t: TeamSummary] }>();
const { toast } = useToast();
const users = useQuery({
  queryKey: ['users', 'pickers'],
  queryFn: () => usersApi.list({ isActive: 'true', pageSize: 100 }),
});
const people = computed(() =>
  (users.data.value?.data ?? []).map((u) => ({ value: u.id, label: fullName(u) })),
);

const schema = toTypedSchema(
  z.object({
    name: z.string().trim().min(1, 'Enter a team name').max(80),
    description: z.string().trim().max(500).nullable(),
    techLeadId: z.string().nullable(),
    isActive: z.boolean(),
  }),
);
function initialValues(t?: TeamSummary | null) {
  return t
    ? { name: t.name, description: t.description, techLeadId: t.techLead?.id ?? null, isActive: t.isActive }
    : { name: '', description: null, techLeadId: null, isActive: true };
}
const { handleSubmit, defineField, errors, setErrors, resetForm, isSubmitting, meta } = useForm({
  validationSchema: schema,
  initialValues: initialValues(props.team),
});
const blurOnly = { validateOnBlur: true, validateOnModelUpdate: false };
const [name, nameAttrs] = defineField('name', blurOnly);
const [description, descriptionAttrs] = defineField('description', blurOnly);
const [techLeadId] = defineField('techLeadId');
const [isActive] = defineField('isActive');
const formError = ref('');

watch(
  () => props.open,
  (o) => {
    if (!o) return;
    formError.value = '';
    resetForm({ values: initialValues(props.team) });
  },
);

const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    const saved = props.team
      ? await teamsApi.update(props.team.id, v)
      : await teamsApi.create({ name: v.name, description: v.description, techLeadId: v.techLeadId });
    toast({ title: props.team ? 'Team updated' : 'Team created', tone: 'success' });
    emit('saved', saved);
    emit('update:open', false);
  } catch (e) {
    if (e instanceof ApiError && e.code === 'TEAM_NAME_TAKEN') setErrors({ name: messageFor(e) });
    else {
      setErrors(fieldErrors(e));
      formError.value = messageFor(e);
    }
  }
}, focusFirstInvalid);

const guard = discardGuard(() => meta.value.dirty);
async function requestClose() {
  if (await guard()) emit('update:open', false);
}
</script>
<template>
  <Drawer
    :open="open"
    :title="team ? 'Edit team' : 'New team'"
    :before-close="guard"
    @update:open="emit('update:open', $event)"
  >
    <form id="team-form" class="space-y-4" novalidate @submit.prevent="submit">
      <p
        v-if="formError"
        role="alert"
        class="rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {{ formError }}
      </p>
      <FormField label="Name" name="name" :error="errors.name" required>
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            :model-value="name ?? ''"
            v-bind="nameAttrs"
            name="name"
            :invalid="invalid"
            @update:model-value="name = $event"
          />
        </template>
      </FormField>
      <FormField label="Description" name="description" :error="errors.description">
        <template #default="{ id, invalid }">
          <Textarea
            :id="id"
            :model-value="description ?? ''"
            v-bind="descriptionAttrs"
            name="description"
            :invalid="invalid"
            @update:model-value="description = $event || null"
          />
        </template>
      </FormField>
      <FormField label="Tech lead" name="techLeadId" hint="Can see the team month view">
        <template #default="{ id }">
          <Combobox
            :id="id"
            :model-value="techLeadId ?? null"
            :options="people"
            placeholder="Search people"
            @update:model-value="techLeadId = $event"
          />
        </template>
      </FormField>
      <Switch
        v-if="team"
        :model-value="isActive ?? true"
        label="Team is active"
        @update:model-value="isActive = $event"
      />
    </form>
    <template #footer>
      <Button variant="outline" @click="requestClose">Cancel</Button>
      <Button type="submit" form="team-form" :loading="isSubmitting">{{
        team ? 'Save changes' : 'Create team'
      }}</Button>
    </template>
  </Drawer>
</template>
