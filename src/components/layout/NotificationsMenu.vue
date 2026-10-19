<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Bell, CheckCheck } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui';
import { useNotificationsStore } from '@/stores/notifications.store';
import { Button } from '@/components/ui';

const store = useNotificationsStore();
const router = useRouter();

async function open(n: { id: string; link: string | null }) {
  await store.markRead(n.id);
  if (n.link) router.push(n.link);
}
</script>
<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        :aria-label="`Notifications, ${store.unread} unread`"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="store.unread"
          class="num absolute right-1.5 top-1.5 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-medium leading-4 text-on-destructive"
          >{{ store.unread > 9 ? '9+' : store.unread }}</span
        >
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="4"
        class="z-50 w-[calc(100vw-2rem)] max-w-sm rounded-card border bg-surface p-2 shadow-dialog"
      >
        <div class="flex items-center justify-between px-2 py-1">
          <p class="font-medium">Notifications</p>
          <Button variant="ghost" size="sm" :disabled="!store.unread" @click="store.markAllRead()">
            <CheckCheck class="h-4 w-4" />Mark all read
          </Button>
        </div>
        <p v-if="!store.items.length" class="px-2 py-6 text-center text-sm text-muted-foreground">
          You are all caught up.
        </p>
        <DropdownMenuItem
          v-for="n in store.items"
          :key="n.id"
          class="flex cursor-pointer flex-col items-start gap-0.5 rounded-control px-2 py-2 outline-none data-[highlighted]:bg-muted"
          :class="n.readAt ? 'opacity-70' : ''"
          @select="open(n)"
        >
          <p class="text-sm font-medium">{{ n.title }}</p>
          <p class="text-sm text-muted-foreground">{{ n.body }}</p>
          <p class="num text-xs text-muted-foreground">
            {{ formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) }}
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
