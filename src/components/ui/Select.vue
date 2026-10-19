<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from 'reka-ui';
import { ChevronDown, Check } from 'lucide-vue-next';
defineProps<{
  modelValue: string | null;
  options: Array<{ value: string; label: string; description?: string }>;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();
</script>
<template>
  <SelectRoot
    :model-value="modelValue ?? undefined"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event as string)"
  >
    <SelectTrigger
      :id="id"
      :aria-invalid="invalid ? 'true' : undefined"
      class="flex h-11 w-full cursor-pointer items-center justify-between rounded-control border bg-surface px-3 text-left text-base data-[placeholder]:text-muted-foreground disabled:opacity-50"
      :class="invalid ? 'border-destructive' : 'border-border'"
    >
      <SelectValue :placeholder="placeholder ?? 'Select…'" /><ChevronDown
        class="h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-50 min-w-[var(--reka-select-trigger-width)] rounded-control border bg-surface p-1 shadow-dialog"
      >
        <SelectViewport>
          <SelectItem
            v-for="o in options"
            :key="o.value"
            :value="o.value"
            class="relative flex min-h-11 cursor-pointer select-none items-center rounded-control py-2 pl-8 pr-3 text-base outline-none data-[highlighted]:bg-muted"
          >
            <SelectItemIndicator class="absolute left-2"><Check class="h-4 w-4" /></SelectItemIndicator>
            <div>
              <SelectItemText>{{ o.label }}</SelectItemText>
              <p v-if="o.description" class="text-sm text-muted-foreground">{{ o.description }}</p>
            </div>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
