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
withDefaults(defineProps<{ open: boolean; title: string; description?: string }>(), {
  description: undefined,
});
const emit = defineEmits<{ 'update:open': [v: boolean]; beforeClose: [e: Event] }>();
function requestClose(next: boolean) {
  if (next) return emit('update:open', true);
  const e = new Event('beforeClose', { cancelable: true });
  emit('beforeClose', e);
  if (!e.defaultPrevented) emit('update:open', false);
}
</script>
<template>
  <DialogRoot :open="open" @update:open="requestClose">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l bg-surface shadow-dialog focus:outline-none"
        @escape-key-down.prevent="requestClose(false)"
        @pointer-down-outside.prevent="requestClose(false)"
      >
        <div class="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <DialogTitle class="text-lg font-semibold">{{ title }}</DialogTitle>
            <DialogDescription :class="description ? 'mt-1 text-sm text-muted-foreground' : 'sr-only'">{{
              description || title
            }}</DialogDescription>
          </div>
          <DialogClose
            class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
            aria-label="Close"
            @click.prevent="requestClose(false)"
            ><X class="h-5 w-5"
          /></DialogClose>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4"><slot /></div>
        <div
          v-if="$slots.footer"
          class="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end"
        >
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
