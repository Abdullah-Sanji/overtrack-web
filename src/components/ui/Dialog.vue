<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui';
import { X } from 'lucide-vue-next';
withDefaults(
  defineProps<{ open: boolean; title: string; description?: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md', description: undefined },
);
const emit = defineEmits<{ 'update:open': [v: boolean] }>();
const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };
</script>
<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-card border bg-surface p-6 shadow-dialog focus:outline-none"
        :class="widths[size]"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="text-lg font-semibold">{{ title }}</DialogTitle>
            <DialogDescription :class="description ? 'mt-1 text-sm text-muted-foreground' : 'sr-only'">{{
              description || title
            }}</DialogDescription>
          </div>
          <DialogClose
            data-dialog-close
            class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
            aria-label="Close"
            ><X class="h-5 w-5"
          /></DialogClose>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
