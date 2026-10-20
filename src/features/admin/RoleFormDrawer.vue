<script setup lang="ts">
import { ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import type { RoleLevel, RoleView } from '@/api/types';
import { rolesApi } from '@/api/roles.api';
import { ApiError, messageFor, fieldErrors } from '@/api/errors';
import { focusFirstInvalid } from '@/lib/forms';
import { discardGuard } from '@/composables/useConfirm';
import { useToast } from '@/components/ui/useToast';
import { Drawer, Button, FormField, Input, Select } from '@/components/ui';
import { LEVEL_OPTIONS } from './roles';

const props = defineProps<{ open: boolean; role?: RoleView | null }>();
const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [r: RoleView] }>();
const { toast } = useToast();
const schema = toTypedSchema(
  z.object({
    name: z.string().trim().min(2, 'At least 2 characters').max(40),
    level: z.enum(['employee', 'manager', 'finance', 'admin']),
  }),
);
const initial = (r?: RoleView | null) =>
  r ? { name: r.name, level: r.level } : { name: '', level: 'employee' as RoleLevel };
const { handleSubmit, defineField, errors, setErrors, resetForm, isSubmitting, meta } = useForm({
  validationSchema: schema,
  initialValues: initial(props.role),
});
const [name, nameAttrs] = defineField('name', { validateOnBlur: true, validateOnModelUpdate: false });
const [level] = defineField('level');
const formError = ref('');
const levelOptions = LEVEL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  description: o.description,
}));
watch(
  () => props.open,
  (o) => {
    if (o) {
      formError.value = '';
      resetForm({ values: initial(props.role) });
    }
  },
);
const guard = discardGuard(() => meta.value.dirty);
async function requestClose() {
  if (await guard()) emit('update:open', false);
}
const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    const saved = props.role
      ? await rolesApi.update(props.role.id, props.role.isSystem ? { name: v.name } : v)
      : await rolesApi.create(v);
    toast({ title: props.role ? 'Role updated' : 'Role created', tone: 'success' });
    emit('saved', saved);
    emit('update:open', false);
  } catch (e) {
    if (e instanceof ApiError && e.code === 'ROLE_NAME_TAKEN') setErrors({ name: messageFor(e) });
    else {
      setErrors(fieldErrors(e));
      formError.value = messageFor(e);
    }
  }
}, focusFirstInvalid);
</script>
<template>
  <Drawer
    :open="open"
    :title="role ? 'Edit role' : 'New role'"
    description="The level decides what people with this role can do."
    :before-close="guard"
    @update:open="emit('update:open', $event)"
  >
    <form id="role-form" class="space-y-4" novalidate @submit.prevent="submit">
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
      <FormField
        label="Level"
        name="level"
        :error="errors.level"
        :hint="
          role?.isSystem
            ? 'Built-in roles keep their level.'
            : LEVEL_OPTIONS.find((o) => o.value === level)?.description
        "
        required
      >
        <template #default="{ id, invalid }">
          <Select
            :id="id"
            :model-value="level ?? null"
            :options="levelOptions"
            :invalid="invalid"
            :disabled="role?.isSystem"
            @update:model-value="level = $event as RoleLevel"
          />
        </template>
      </FormField>
    </form>
    <template #footer>
      <Button variant="outline" @click="requestClose">Cancel</Button>
      <Button type="submit" form="role-form" :loading="isSubmitting">{{
        role ? 'Save changes' : 'Create role'
      }}</Button>
    </template>
  </Drawer>
</template>
