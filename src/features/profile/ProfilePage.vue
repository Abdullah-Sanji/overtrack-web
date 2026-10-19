<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { authApi } from '@/api/auth.api';
import { ApiError, messageFor, fieldErrors } from '@/api/errors';
import { roleLabel } from '@/features/admin/roles';
import { useToast } from '@/components/ui/useToast';
import { PageHeader, Card, Button, FormField, Input, PasswordInput, Switch } from '@/components/ui';

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();
const { toast } = useToast();

const profile = useForm({
  validationSchema: toTypedSchema(
    z.object({
      firstName: z.string().trim().min(1, 'Enter your first name').max(60),
      lastName: z.string().trim().min(1, 'Enter your last name').max(60),
      timezone: z.string().trim().min(1, 'Enter a timezone').max(64),
    }),
  ),
  initialValues: {
    firstName: auth.user?.firstName ?? '',
    lastName: auth.user?.lastName ?? '',
    timezone: auth.user?.timezone ?? '',
  },
});
const blur = { validateOnBlur: true, validateOnModelUpdate: false };
const [firstName, firstNameAttrs] = profile.defineField('firstName', blur);
const [lastName, lastNameAttrs] = profile.defineField('lastName', blur);
const [timezone, timezoneAttrs] = profile.defineField('timezone', blur);
const saveProfile = profile.handleSubmit(async (v) => {
  try {
    auth.setUser(await authApi.updateMe(v));
    toast({ title: 'Profile saved', tone: 'success' });
  } catch (e) {
    profile.setErrors(fieldErrors(e));
    toast({ title: messageFor(e), tone: 'error' });
  }
});

const pw = useForm({
  validationSchema: toTypedSchema(
    z
      .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(10, 'At least 10 characters'),
        confirm: z.string(),
      })
      .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' }),
  ),
  initialValues: { currentPassword: '', newPassword: '', confirm: '' },
});
const [currentPassword, currentPasswordAttrs] = pw.defineField('currentPassword', blur);
const [newPassword, newPasswordAttrs] = pw.defineField('newPassword', {
  validateOnBlur: true,
  validateOnModelUpdate: true,
});
const [confirm, confirmAttrs] = pw.defineField('confirm', {
  validateOnBlur: true,
  validateOnModelUpdate: true,
});
const pwError = ref('');
const savePassword = pw.handleSubmit(async (v) => {
  pwError.value = '';
  try {
    await authApi.changePassword(v.currentPassword, v.newPassword);
  } catch (e) {
    if (e instanceof ApiError && e.code === 'INVALID_CREDENTIALS') {
      pw.setErrors({ currentPassword: 'Current password is incorrect' });
    } else {
      pwError.value = messageFor(e);
    }
    return;
  }
  // The API revokes every refresh session on a password change, so sign out.
  toast({ title: 'Password changed. Please sign in again.', tone: 'success' });
  await auth.logout();
  router.push({ name: 'login' });
});
</script>

<template>
  <PageHeader title="Profile" />
  <div class="grid gap-6 lg:grid-cols-2">
    <Card>
      <template #header><h2 class="font-semibold">Your details</h2></template>
      <dl class="mb-4 grid grid-cols-2 gap-2 text-sm">
        <dt class="text-muted-foreground">Email</dt>
        <dd>{{ auth.user?.email }}</dd>
        <dt class="text-muted-foreground">Role</dt>
        <dd>{{ auth.user ? roleLabel(auth.user.role) : '' }}</dd>
        <dt class="text-muted-foreground">Employee code</dt>
        <dd class="num">{{ auth.user?.employeeCode ?? '—' }}</dd>
      </dl>
      <form class="space-y-4" novalidate @submit.prevent="saveProfile">
        <div class="grid grid-cols-2 gap-3">
          <FormField label="First name" name="firstName" :error="profile.errors.value.firstName" required>
            <template #default="{ id, invalid }">
              <Input
                :id="id"
                v-bind="firstNameAttrs"
                :model-value="firstName ?? ''"
                :invalid="invalid"
                @update:model-value="firstName = $event"
              />
            </template>
          </FormField>
          <FormField label="Last name" name="lastName" :error="profile.errors.value.lastName" required>
            <template #default="{ id, invalid }">
              <Input
                :id="id"
                v-bind="lastNameAttrs"
                :model-value="lastName ?? ''"
                :invalid="invalid"
                @update:model-value="lastName = $event"
              />
            </template>
          </FormField>
        </div>
        <FormField
          label="Timezone"
          name="timezone"
          :error="profile.errors.value.timezone"
          hint="Used to decide which dates count as 'today' for your entries"
          required
        >
          <template #default="{ id, invalid }">
            <Input
              :id="id"
              v-bind="timezoneAttrs"
              :model-value="timezone ?? ''"
              :invalid="invalid"
              @update:model-value="timezone = $event"
            />
          </template>
        </FormField>
        <Switch :model-value="ui.theme === 'dark'" label="Dark mode" @update:model-value="ui.toggleTheme()" />
        <Button type="submit" :loading="profile.isSubmitting.value">Save profile</Button>
      </form>
    </Card>
    <Card>
      <template #header><h2 class="font-semibold">Change password</h2></template>
      <form class="space-y-4" novalidate @submit.prevent="savePassword">
        <p v-if="pwError" role="alert" class="text-sm text-destructive">{{ pwError }}</p>
        <FormField
          label="Current password"
          name="currentPassword"
          :error="pw.errors.value.currentPassword"
          required
        >
          <template #default="{ id, invalid }">
            <PasswordInput
              :id="id"
              v-bind="currentPasswordAttrs"
              :model-value="currentPassword ?? ''"
              autocomplete="current-password"
              :invalid="invalid"
              @update:model-value="currentPassword = $event"
            />
          </template>
        </FormField>
        <FormField
          label="New password"
          name="newPassword"
          :error="pw.errors.value.newPassword"
          hint="At least 10 characters"
          required
        >
          <template #default="{ id, invalid }">
            <PasswordInput
              :id="id"
              v-bind="newPasswordAttrs"
              :model-value="newPassword ?? ''"
              autocomplete="new-password"
              :invalid="invalid"
              @update:model-value="newPassword = $event"
            />
          </template>
        </FormField>
        <FormField label="Confirm new password" name="confirm" :error="pw.errors.value.confirm" required>
          <template #default="{ id, invalid }">
            <PasswordInput
              :id="id"
              v-bind="confirmAttrs"
              :model-value="confirm ?? ''"
              autocomplete="new-password"
              :invalid="invalid"
              @update:model-value="confirm = $event"
            />
          </template>
        </FormField>
        <Button type="submit" :loading="pw.isSubmitting.value">Change password</Button>
      </form>
    </Card>
  </div>
</template>
