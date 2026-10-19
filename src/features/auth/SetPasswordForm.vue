<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { messageFor, fieldErrors } from '@/api/errors';
import { Button, FormField, PasswordInput } from '@/components/ui';

const props = defineProps<{ submitLabel: string; action: (password: string) => Promise<unknown> }>();
const emit = defineEmits<{ done: [] }>();
const schema = toTypedSchema(
  z
    .object({ password: z.string().min(10, 'At least 10 characters'), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' }),
);
const { handleSubmit, defineField, errors, setErrors, isSubmitting } = useForm<{
  password: string;
  confirm: string;
}>({
  validationSchema: schema,
  initialValues: { password: '', confirm: '' },
});
const opts = { validateOnBlur: true, validateOnModelUpdate: false };
const [password] = defineField('password', opts);
const [confirm] = defineField('confirm', opts);
const formError = ref('');
const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    await props.action(v.password);
    emit('done');
  } catch (e) {
    setErrors(fieldErrors(e));
    formError.value = messageFor(e);
  }
});
</script>
<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
    <FormField
      label="New password"
      name="password"
      :error="errors.password"
      hint="At least 10 characters"
      required
    >
      <template #default="{ id, invalid }">
        <PasswordInput :id="id" v-model="password" autocomplete="new-password" :invalid="invalid" />
      </template>
    </FormField>
    <FormField label="Confirm password" name="confirm" :error="errors.confirm" required>
      <template #default="{ id, invalid }">
        <PasswordInput :id="id" v-model="confirm" autocomplete="new-password" :invalid="invalid" />
      </template>
    </FormField>
    <Button type="submit" block :loading="isSubmitting">{{ submitLabel }}</Button>
  </form>
</template>
