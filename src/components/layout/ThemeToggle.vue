<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';
import { useUiStore } from '@/stores/ui.store';
const ui = useUiStore();
</script>
<template>
  <button
    type="button"
    class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
    :aria-label="ui.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="ui.toggleTheme()"
  >
    <Sun v-if="ui.theme === 'dark'" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </button>
</template>
