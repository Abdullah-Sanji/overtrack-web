<script setup lang="ts">
import { Menu } from 'lucide-vue-next';
import { useUiStore } from '@/stores/ui.store';
import BrandMark from './BrandMark.vue';
import NotificationsMenu from './NotificationsMenu.vue';
import ThemeToggle from './ThemeToggle.vue';
import UserMenu from './UserMenu.vue';
const ui = useUiStore();
</script>
<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-surface/90 px-4 backdrop-blur">
    <button
      type="button"
      class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-control hover:bg-muted lg:hidden"
      aria-label="Open navigation"
      @click="ui.mobileNavOpen = true"
    >
      <Menu class="h-5 w-5" />
    </button>
    <BrandMark :size="28" class="lg:hidden" />
    <div class="ml-auto flex items-center gap-1">
      <slot name="right" />
      <NotificationsMenu />
      <ThemeToggle />
      <UserMenu />
    </div>
  </header>
</template>
