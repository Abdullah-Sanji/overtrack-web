<script setup lang="ts">
import { useRouter } from 'vue-router';
import { User, LogOut } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, DropdownMenu } from '@/components/ui';
const auth = useAuthStore();
const router = useRouter();
const items = [
  { label: 'Profile', icon: User, onSelect: () => router.push({ name: 'profile' }) },
  {
    label: 'Sign out',
    icon: LogOut,
    destructive: true,
    onSelect: async () => {
      await auth.logout();
      router.push({ name: 'login' });
    },
  },
];
</script>
<template>
  <DropdownMenu :items="items">
    <template #trigger>
      <button
        type="button"
        class="flex h-11 cursor-pointer items-center gap-2 rounded-control px-2 hover:bg-muted"
        aria-label="Account menu"
      >
        <Avatar v-if="auth.user" :person="auth.user" size="sm" />
        <span class="hidden text-sm sm:inline">{{ auth.user?.firstName }}</span>
      </button>
    </template>
  </DropdownMenu>
</template>
