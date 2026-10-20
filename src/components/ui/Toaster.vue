<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
import { useToast } from './useToast';
import Button from './Button.vue';
const { toasts, dismiss } = useToast();
const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones = {
  success: 'border-accent/40',
  error: 'border-destructive/40',
  info: 'border-secondary/40',
};
</script>
<template>
  <div
    aria-live="polite"
    class="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="pointer-events-auto flex items-start gap-3 rounded-card border bg-surface p-4 shadow-dialog"
      :class="tones[t.tone]"
    >
      <component
        :is="icons[t.tone]"
        class="mt-0.5 h-5 w-5 shrink-0"
        :class="
          t.tone === 'success' ? 'text-accent' : t.tone === 'error' ? 'text-destructive' : 'text-secondary'
        "
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p class="font-medium">{{ t.title }}</p>
        <p v-if="t.description" class="text-sm text-muted-foreground">{{ t.description }}</p>
        <Button
          v-if="t.action"
          variant="outline"
          size="sm"
          class="mt-2"
          @click="
            t.action.onClick();
            dismiss(t.id);
          "
          >{{ t.action.label }}</Button
        >
      </div>
      <button
        class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        aria-label="Dismiss"
        @click="dismiss(t.id)"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
