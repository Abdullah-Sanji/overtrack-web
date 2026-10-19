<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import Button from './Button.vue';

const props = defineProps<{ page: number; pageSize: number; total: number }>();
const emit = defineEmits<{ 'update:page': [p: number] }>();
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1));
const to = computed(() => Math.min(props.page * props.pageSize, props.total));
const last = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
</script>

<template>
  <nav class="flex items-center justify-between gap-4 py-3" aria-label="Pagination">
    <p class="num text-sm text-muted-foreground">{{ from }}–{{ to }} of {{ total }}</p>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="md"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="emit('update:page', page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="md"
        :disabled="page >= last"
        aria-label="Next page"
        @click="emit('update:page', page + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </nav>
</template>
