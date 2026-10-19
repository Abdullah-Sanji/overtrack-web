<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui';
import { useUiStore } from '@/stores/ui.store';
import { useNotificationsStore } from '@/stores/notifications.store';
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
const ui = useUiStore();
const notifications = useNotificationsStore();
onMounted(() => notifications.startPolling());
onUnmounted(() => notifications.stopPolling());
</script>
<template>
  <div class="min-h-dvh lg:flex">
    <a href="#main" class="skip-link">Skip to content</a>
    <aside
      class="hidden flex-col border-r bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh"
      :class="ui.sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <div class="flex h-14 items-center px-4 font-semibold text-primary">
        {{ ui.sidebarCollapsed ? 'OT' : 'OverTrack' }}
      </div>
      <Sidebar :collapsed="ui.sidebarCollapsed" :inbox-count="notifications.waitingCount" />
    </aside>
    <DialogRoot :open="ui.mobileNavOpen" @update:open="ui.mobileNavOpen = $event">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-40 bg-black/50 lg:hidden" />
        <DialogContent class="fixed inset-y-0 left-0 z-50 w-72 bg-surface shadow-dialog lg:hidden">
          <DialogTitle class="flex h-14 items-center px-4 font-semibold text-primary">OverTrack</DialogTitle>
          <DialogDescription class="sr-only">Main navigation</DialogDescription>
          <Sidebar :inbox-count="notifications.waitingCount" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <div class="flex min-w-0 flex-1 flex-col">
      <Topbar />
      <main
        id="main"
        tabindex="-1"
        class="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 outline-none sm:px-6"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
