<script setup lang="ts">
import { focusFirstInvalid } from '@/lib/forms';
import { ref } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { messageFor, fieldErrors } from '@/api/errors';
import { Button, FormField, Input, PasswordInput } from '@/components/ui';
import AuthCard from './AuthCard.vue';
import { useGoogleIdentity } from './useGoogleIdentity';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
// With a client id the page is Google-first; without one it is the plain password form (local dev, e2e).
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const showPassword = ref(!googleClientId);
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
const [email, emailAttrs] = defineField('email', { validateOnBlur: true, validateOnModelUpdate: false });
const [password, passwordAttrs] = defineField('password', {
  validateOnBlur: true,
  validateOnModelUpdate: false,
});
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
}, focusFirstInvalid);

const buttonEl = ref<HTMLElement | null>(null);
useGoogleIdentity({
  buttonEl,
  clientId: googleClientId,
  onCredential: async (credential) => {
    formError.value = '';
    try {
      await auth.loginWithGoogle(credential);
      router.push(redirectTarget());
    } catch (e) {
      formError.value = messageFor(e);
    }
  },
  onUnavailable: () => {
    formError.value = 'Google sign-in is unavailable';
    showPassword.value = true;
  },
});
</script>
<template>
  <AuthCard
    title="Sign in"
    :description="
      googleClientId
        ? 'Sign in with your company Google account.'
        : 'Use the email and password your admin gave you.'
    "
  >
    <p
      v-if="formError"
      role="alert"
      class="mb-4 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {{ formError }}
    </p>
    <div v-if="googleClientId" class="space-y-4">
      <div ref="buttonEl" class="flex min-h-11 justify-center"></div>
      <p v-if="!showPassword" class="text-center text-sm">
        <button
          type="button"
          class="text-primary underline-offset-2 hover:underline"
          @click="showPassword = true"
        >
          Sign in with password
        </button>
      </p>
    </div>
    <form
      v-if="showPassword"
      class="space-y-4"
      :class="googleClientId ? 'mt-6' : ''"
      novalidate
      @submit.prevent="submit"
    >
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
      <FormField label="Password" name="password" :error="errors.password" required>
        <template #default="{ id, invalid }">
          <PasswordInput :id="id" v-model="password" v-bind="passwordAttrs" :invalid="invalid" />
        </template>
      </FormField>
      <Button type="submit" block :loading="isSubmitting">Sign in</Button>
      <p class="text-center text-sm">
        <RouterLink class="text-primary underline-offset-2 hover:underline" :to="{ name: 'forgot-password' }"
          >Forgot your password?</RouterLink
        >
      </p>
    </form>
  </AuthCard>
</template>
