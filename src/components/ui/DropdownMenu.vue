<script setup lang="ts">
import type { Component } from 'vue';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui';
defineProps<{
  items: Array<{
    label: string;
    icon?: Component;
    destructive?: boolean;
    disabled?: boolean;
    hint?: string;
    onSelect: () => void;
  }>;
}>();
</script>
<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child><slot name="trigger" /></DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="4"
        class="z-50 min-w-44 rounded-control border bg-surface p-1 shadow-dialog"
      >
        <DropdownMenuItem
          v-for="it in items"
          :key="it.label"
          class="flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-base outline-none data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
          :disabled="it.disabled"
          :title="it.hint"
          :class="it.destructive ? 'text-destructive' : ''"
          @select="it.onSelect"
        >
          <component :is="it.icon" v-if="it.icon" class="h-4 w-4" aria-hidden="true" />{{ it.label }}
          <span v-if="it.hint" class="ml-auto text-xs text-muted-foreground">{{ it.hint }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
