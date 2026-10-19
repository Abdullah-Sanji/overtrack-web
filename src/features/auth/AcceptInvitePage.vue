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

const action = (p: string) => authApi.acceptInvite(token, p);

function onDone() {
  toast({ title: 'Account activated. Sign in to continue.', tone: 'success' });
  router.push({ name: 'login' });
}
</script>
<template>
  <AuthCard title="Welcome to OverTrack" description="Set a password to activate your account.">
    <p v-if="!token" role="alert" class="text-sm text-destructive">
      This invite link is missing its token. Ask your admin to resend the invite.
    </p>
    <SetPasswordForm v-else submit-label="Activate account" :action="action" @done="onDone" />
  </AuthCard>
</template>
