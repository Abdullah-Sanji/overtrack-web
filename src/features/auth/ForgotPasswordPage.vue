<script setup lang="ts">
import { focusFirstInvalid } from '@/lib/forms';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { authApi } from '@/api/auth.api';
import { messageFor } from '@/api/errors';
import { Button, FormField, Input } from '@/components/ui';
import AuthCard from './AuthCard.vue';

const { handleSubmit, defineField, errors, isSubmitting } = useForm<{ email: string }>({
  validationSchema: toTypedSchema(z.object({ email: z.string().email('Enter a valid email') })),
  initialValues: { email: '' },
});
const [email, emailAttrs] = defineField('email', { validateOnBlur: true, validateOnModelUpdate: false });
const done = ref(false);
const formError = ref('');
const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    await authApi.forgotPassword(v.email);
    done.value = true;
  } catch (e) {
    formError.value = messageFor(e);
  }
}, focusFirstInvalid);
</script>
<template>
  <AuthCard
    title="Reset your password"
    description="We will email you a link if the address belongs to an account."
  >
    <p
      v-if="done"
      role="status"
      class="rounded-control border border-accent/40 bg-accent/10 px-3 py-2 text-sm"
    >
      If that email exists, a reset link is on its way. It is valid for one hour.
    </p>
    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
      <FormField label="Email" name="email" :error="errors.email" required>
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            autocomplete="email"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <Button type="submit" block :loading="isSubmitting">Send reset link</Button>
    </form>
    <p class="mt-4 text-center text-sm">
      <RouterLink class="text-primary hover:underline" :to="{ name: 'login' }">Back to sign in</RouterLink>
    </p>
  </AuthCard>
</template>
