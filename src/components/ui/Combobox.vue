<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ComboboxRoot,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxPortal,
  ComboboxContent,
  ComboboxViewport,
  ComboboxItem,
  ComboboxEmpty,
} from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
const props = defineProps<{
  modelValue: string | null;
  options: Array<{ value: string; label: string; description?: string }>;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [v: string | null] }>();
const term = ref('');
const filtered = computed(() =>
  props.options.filter((o) => o.label.toLowerCase().includes(term.value.toLowerCase())),
);
const display = (v: string | null) => props.options.find((o) => o.value === v)?.label ?? '';
</script>
<template>
  <ComboboxRoot
    :model-value="modelValue ?? undefined"
    :disabled="disabled"
    ignore-filter
    @update:model-value="emit('update:modelValue', ($event as string) ?? null)"
  >
    <ComboboxAnchor
      class="flex h-11 w-full items-center rounded-control border bg-surface pr-2"
      :class="invalid ? 'border-destructive' : 'border-border'"
    >
      <ComboboxInput
        :id="id"
        :display-value="display"
        :placeholder="placeholder ?? 'Search…'"
        class="h-full w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
        @input="term = ($event.target as HTMLInputElement).value"
      />
      <ComboboxTrigger
        class="flex h-9 w-9 cursor-pointer items-center justify-center text-muted-foreground"
        aria-label="Open options"
        ><ChevronDown class="h-4 w-4"
      /></ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        class="z-50 w-[var(--reka-combobox-trigger-width)] rounded-control border bg-surface p-1 shadow-dialog"
      >
        <ComboboxViewport class="max-h-64">
          <ComboboxEmpty class="px-3 py-2 text-sm text-muted-foreground">No matches</ComboboxEmpty>
          <ComboboxItem
            v-for="o in filtered"
            :key="o.value"
            :value="o.value"
            class="min-h-11 cursor-pointer rounded-control px-3 py-2 text-base outline-none data-[highlighted]:bg-muted"
          >
            <div>
              {{ o.label }}
              <p v-if="o.description" class="text-sm text-muted-foreground">{{ o.description }}</p>
            </div>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
