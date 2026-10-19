<script setup lang="ts">
import { ref } from 'vue';
import { Download } from 'lucide-vue-next';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
import { Button, DropdownMenu } from '@/components/ui';
const props = defineProps<{ run: (format: 'xlsx' | 'csv') => Promise<void>; disabled?: boolean }>();
const { toast } = useToast();
const loading = ref(false);
async function go(format: 'xlsx' | 'csv') {
  loading.value = true;
  try {
    await props.run(format);
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    loading.value = false;
  }
}
const items = [
  { label: 'Excel (.xlsx)', onSelect: () => go('xlsx') },
  { label: 'CSV', onSelect: () => go('csv') },
];
</script>
<template>
  <DropdownMenu :items="items"
    ><template #trigger
      ><Button variant="outline" :loading="loading" :disabled="disabled"
        ><Download class="h-4 w-4" />Export</Button
      ></template
    ></DropdownMenu
  >
</template>
