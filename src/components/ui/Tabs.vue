<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';
defineProps<{
  modelValue: string;
  tabs: Array<{ value: string; label: string; count?: number }>;
}>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();
</script>
<template>
  <TabsRoot :model-value="modelValue" @update:model-value="emit('update:modelValue', $event as string)">
    <TabsList class="mb-4 flex gap-1 overflow-x-auto border-b" aria-label="Tabs">
      <TabsTrigger
        v-for="t in tabs"
        :key="t.value"
        :value="t.value"
        class="-mb-px flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-base text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
      >
        {{ t.label
        }}<span v-if="t.count !== undefined" class="num rounded-full bg-muted px-2 text-sm">{{
          t.count
        }}</span>
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="t in tabs" :key="t.value" :value="t.value"><slot :name="t.value" /></TabsContent>
  </TabsRoot>
</template>
