<script setup lang="ts">
import { ConfirmDialog } from '@/components/ui';
import { useConfirmStore } from '@/composables/useConfirm';
const store = useConfirmStore();
</script>
<template>
  <ConfirmDialog
    :open="store.open"
    :title="store.options.title"
    :description="store.options.description"
    :confirm-label="store.options.confirmLabel ?? 'Confirm'"
    :cancel-label="store.options.cancelLabel ?? 'Cancel'"
    :destructive="store.options.tone === 'destructive'"
    @update:open="(v) => !v && store.settle(false)"
    @confirm="store.settle(true)"
  />
</template>
