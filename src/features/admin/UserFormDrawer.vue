<script setup lang="ts">
import { focusFirstInvalid } from '@/lib/forms';
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import type { PublicUser, TeamSummary, UserRole } from '@/api/types';
import { usersApi } from '@/api/users.api';
import { messageFor, fieldErrors, ApiError } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { Drawer, Button, FormField, Input, Select } from '@/components/ui';
import { ROLE_OPTIONS } from './roles';

const props = defineProps<{ open: boolean; user?: PublicUser | null; teams: TeamSummary[] }>();
const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [u: PublicUser] }>();
const { toast } = useToast();

const schema = toTypedSchema(
  z.object({
    firstName: z.string().trim().min(1, 'Enter a first name').max(60),
    lastName: z.string().trim().min(1, 'Enter a last name').max(60),
    email: z.string().trim().email('Enter a valid email'),
    role: z.enum(['employee', 'tech_lead', 'delivery_manager', 'cto', 'finance', 'admin']),
    teamId: z.string().nullable(),
    employeeCode: z.string().trim().max(20).nullable(),
    timezone: z.string().trim().min(1, 'Enter a timezone').max(64),
  }),
);
function initialValues(u?: PublicUser | null) {
  return u
    ? {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        teamId: u.teamId,
        employeeCode: u.employeeCode,
        timezone: u.timezone,
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        role: 'employee' as UserRole,
        teamId: null,
        employeeCode: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
}
const { handleSubmit, defineField, errors, setErrors, resetForm, isSubmitting, meta } = useForm({
  validationSchema: schema,
  initialValues: initialValues(props.user),
});
const blurOnly = { validateOnBlur: true, validateOnModelUpdate: false };
const [firstName, firstNameAttrs] = defineField('firstName', blurOnly);
const [lastName, lastNameAttrs] = defineField('lastName', blurOnly);
const [email, emailAttrs] = defineField('email', blurOnly);
const [role] = defineField('role');
const [teamId] = defineField('teamId');
const [employeeCode, employeeCodeAttrs] = defineField('employeeCode', blurOnly);
const [timezone, timezoneAttrs] = defineField('timezone', blurOnly);
const formError = ref('');
const teamOptions = computed(() => [
  { value: 'none', label: 'No team' },
  ...props.teams.map((t) => ({ value: t.id, label: t.name })),
]);

watch(
  () => props.open,
  (o) => {
    if (!o) return;
    formError.value = '';
    resetForm({ values: initialValues(props.user) });
  },
);

const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    const body = { ...v, employeeCode: v.employeeCode || null };
    const saved = props.user
      ? await usersApi.update(props.user.id, {
          firstName: body.firstName,
          lastName: body.lastName,
          role: body.role,
          teamId: body.teamId,
          employeeCode: body.employeeCode,
          timezone: body.timezone,
        })
      : await usersApi.create(body);
    toast({ title: props.user ? 'User updated' : 'Invite sent', tone: 'success' });
    emit('saved', saved);
    emit('update:open', false);
  } catch (e) {
    if (e instanceof ApiError && e.code === 'EMAIL_TAKEN') setErrors({ email: messageFor(e) });
    else if (e instanceof ApiError && e.code === 'EMPLOYEE_CODE_TAKEN')
      setErrors({ employeeCode: messageFor(e) });
    else {
      setErrors(fieldErrors(e));
      formError.value = messageFor(e);
    }
  }
}, focusFirstInvalid);

function beforeClose(e: Event) {
  if (meta.value.dirty && !confirm('Discard unsaved changes?')) e.preventDefault();
}
function requestClose() {
  if (meta.value.dirty && !confirm('Discard unsaved changes?')) return;
  emit('update:open', false);
}
</script>
<template>
  <Drawer
    :open="open"
    :title="user ? 'Edit user' : 'Invite user'"
    :description="user ? undefined : 'They receive an email with a link to set their password.'"
    @update:open="emit('update:open', $event)"
    @before-close="beforeClose"
  >
    <form id="user-form" class="space-y-4" novalidate @submit.prevent="submit">
      <p
        v-if="formError"
        role="alert"
        class="rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {{ formError }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <FormField label="First name" name="firstName" :error="errors.firstName" required>
          <template #default="{ id, invalid }">
            <Input
              :id="id"
              :model-value="firstName ?? ''"
              v-bind="firstNameAttrs"
              name="firstName"
              :invalid="invalid"
              @update:model-value="firstName = $event"
            />
          </template>
        </FormField>
        <FormField label="Last name" name="lastName" :error="errors.lastName" required>
          <template #default="{ id, invalid }">
            <Input
              :id="id"
              :model-value="lastName ?? ''"
              v-bind="lastNameAttrs"
              name="lastName"
              :invalid="invalid"
              @update:model-value="lastName = $event"
            />
          </template>
        </FormField>
      </div>
      <FormField label="Email" name="email" :error="errors.email" required>
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            :model-value="email ?? ''"
            v-bind="emailAttrs"
            name="email"
            type="email"
            :readonly="Boolean(user)"
            :invalid="invalid"
            @update:model-value="email = $event"
          />
        </template>
      </FormField>
      <FormField label="Role" name="role" :error="errors.role" required>
        <template #default="{ id, invalid }">
          <Select
            :id="id"
            :model-value="role ?? null"
            :options="ROLE_OPTIONS"
            :invalid="invalid"
            @update:model-value="role = $event as UserRole"
          />
        </template>
      </FormField>
      <FormField
        label="Team"
        name="teamId"
        :error="errors.teamId"
        hint="Admins, finance and the CTO usually have no team"
      >
        <template #default="{ id }">
          <Select
            :id="id"
            :model-value="teamId ?? 'none'"
            :options="teamOptions"
            @update:model-value="teamId = $event === 'none' ? null : $event"
          />
        </template>
      </FormField>
      <FormField label="Employee code" name="employeeCode" :error="errors.employeeCode">
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            :model-value="employeeCode ?? ''"
            v-bind="employeeCodeAttrs"
            name="employeeCode"
            mono
            :invalid="invalid"
            @update:model-value="employeeCode = $event"
          />
        </template>
      </FormField>
      <FormField
        label="Timezone"
        name="timezone"
        :error="errors.timezone"
        hint="IANA name, e.g. Asia/Riyadh"
        required
      >
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            :model-value="timezone ?? ''"
            v-bind="timezoneAttrs"
            name="timezone"
            :invalid="invalid"
            @update:model-value="timezone = $event"
          />
        </template>
      </FormField>
    </form>
    <template #footer>
      <Button variant="outline" @click="requestClose">Cancel</Button>
      <Button type="submit" form="user-form" :loading="isSubmitting">{{
        user ? 'Save changes' : 'Send invite'
      }}</Button>
    </template>
  </Drawer>
</template>
