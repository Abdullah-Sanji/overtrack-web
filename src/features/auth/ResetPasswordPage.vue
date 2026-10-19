<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/components/ui/useToast';
import AuthCard from './AuthCard.vue';
import SetPasswordForm from './SetPasswordForm.vue';

const route = useRoute();
const router = useRouter();
const { toast } = useToast();
const token = String(route.query.token ?? '');

const action = (p: string) => authApi.resetPassword(token, p);

function onDone() {
  toast({ title: 'Password updated. Sign in to continue.', tone: 'success' });
  router.push({ name: 'login' });
}
</script>
<template>
  <AuthCard title="Choose a new password" description="Enter a new password for your account.">
    <p v-if="!token" role="alert" class="text-sm text-destructive">
      This reset link is missing its token. Request a new one from the sign-in page.
    </p>
    <SetPasswordForm v-else submit-label="Update password" :action="action" @done="onDone" />
  </AuthCard>
</template>
