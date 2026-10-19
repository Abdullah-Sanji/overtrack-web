<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { messageFor, fieldErrors } from '@/api/errors';
import { Button, FormField, Input, PasswordInput } from '@/components/ui';
import AuthCard from './AuthCard.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const schema = toTypedSchema(
  z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Enter your password'),
  }),
);
const { handleSubmit, defineField, errors, setErrors, isSubmitting } = useForm<{
  email: string;
  password: string;
}>({
  validationSchema: schema,
  initialValues: { email: '', password: '' },
});
const [email] = defineField('email', { validateOnBlur: true, validateOnModelUpdate: false });
const [password] = defineField('password', { validateOnBlur: true, validateOnModelUpdate: false });
const formError = ref('');

function redirectTarget() {
  const r = route.query.redirect;
  return typeof r === 'string' && /^\/(?!\/)/.test(r) ? r : { name: 'dashboard' };
}

const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    await auth.login(v.email, v.password);
    router.push(redirectTarget());
  } catch (e) {
    setErrors(fieldErrors(e));
    formError.value = messageFor(e);
  }
});
</script>
<template>
  <AuthCard title="Sign in" description="Use the email and password your admin gave you.">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <p
        v-if="formError"
        role="alert"
        class="rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {{ formError }}
      </p>
      <FormField label="Email" name="email" :error="errors.email" required>
        <template #default="{ id, invalid }">
          <Input :id="id" v-model="email" type="email" autocomplete="email" :invalid="invalid" />
        </template>
      </FormField>
      <FormField label="Password" name="password" :error="errors.password" required>
        <template #default="{ id, invalid }">
          <PasswordInput :id="id" v-model="password" :invalid="invalid" />
        </template>
      </FormField>
      <Button type="submit" block :loading="isSubmitting">Sign in</Button>
      <p class="text-center text-sm">
        <RouterLink
          class="text-secondary underline-offset-2 hover:underline"
          :to="{ name: 'forgot-password' }"
          >Forgot your password?</RouterLink
        >
      </p>
    </form>
  </AuthCard>
</template>
