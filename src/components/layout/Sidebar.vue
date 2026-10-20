<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Users2,
  Wallet,
  UserCog,
  Network,
  Shield,
  Timer,
  ScrollText,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
const props = withDefaults(defineProps<{ inboxCount?: number; collapsed?: boolean }>(), {
  inboxCount: undefined,
  collapsed: false,
});
const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
function activeFor(name: string, isActive: boolean, isExactActive: boolean) {
  if (name === 'dashboard') return isExactActive;
  // `sheet` is a sibling of `my-sheets` in the route tree, so RouterLink alone does not mark it.
  if (name === 'my-sheets') return isActive || route.name === 'sheet';
  return isActive;
}
const items = computed(() =>
  [
    { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { name: 'my-sheets', label: 'My sheets', icon: FileText, show: true },
    { name: 'inbox', label: 'Inbox', icon: Inbox, show: true, badge: props.inboxCount },
    { name: 'team-month', label: 'Team month', icon: Users2, show: auth.can('manager') },
    { name: 'payments', label: 'Payments', icon: Wallet, show: auth.can('finance') },
    { name: 'admin-users', label: 'Users', icon: UserCog, show: auth.can('admin'), group: 'Admin' },
    { name: 'admin-teams', label: 'Teams', icon: Network, show: auth.can('admin'), group: 'Admin' },
    { name: 'admin-roles', label: 'Roles', icon: Shield, show: auth.can('admin'), group: 'Admin' },
    {
      name: 'admin-overtime-types',
      label: 'Overtime types',
      icon: Timer,
      show: auth.can('admin'),
      group: 'Admin',
    },
    { name: 'admin-audit', label: 'Audit log', icon: ScrollText, show: auth.can('admin'), group: 'Admin' },
  ].filter((i) => i.show),
);
</script>
<template>
  <nav aria-label="Main" class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
    <template v-for="(it, idx) in items" :key="it.name">
      <p
        v-if="it.group && items[idx - 1]?.group !== it.group && !props.collapsed"
        class="mt-4 px-3 text-xs font-medium uppercase tracking-wide text-sidebar-muted"
      >
        {{ it.group }}
      </p>
      <RouterLink v-slot="{ href, navigate, isActive, isExactActive }" :to="{ name: it.name }" custom>
        <a
          :href="href"
          class="relative flex h-11 items-center gap-3 rounded-control px-3 text-base transition-colors"
          :class="
            activeFor(it.name, isActive, isExactActive)
              ? 'bg-sidebar-active font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary-soft'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground'
          "
          :aria-current="activeFor(it.name, isActive, isExactActive) ? 'page' : undefined"
          :title="props.collapsed ? it.label : undefined"
          @click="
            navigate($event);
            ui.mobileNavOpen = false;
          "
        >
          <component :is="it.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
          <span v-if="!props.collapsed" class="flex-1 truncate">{{ it.label }}</span>
          <span
            v-if="it.badge && !props.collapsed"
            class="num rounded-full bg-primary-soft px-2 text-xs text-primary"
            >{{ it.badge }}</span
          >
        </a>
      </RouterLink>
    </template>
    <button
      type="button"
      class="mt-auto hidden h-11 cursor-pointer items-center gap-3 rounded-control px-3 text-sidebar-muted hover:bg-sidebar-hover lg:flex"
      :aria-label="props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="ui.toggleSidebar()"
    >
      <ChevronsRight v-if="props.collapsed" class="h-5 w-5" />
      <ChevronsLeft v-else class="h-5 w-5" />
      <span v-if="!props.collapsed">Collapse</span>
    </button>
  </nav>
</template>
