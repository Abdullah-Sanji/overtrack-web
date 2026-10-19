<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';
defineProps<{ modelValue: string; invalid?: boolean; id?: string; autocomplete?: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();
const show = ref(false);
</script>
<template>
  <div class="relative">
    <input
      :id="id"
      :type="show ? 'text' : 'password'"
      :value="modelValue"
      :autocomplete="autocomplete ?? 'current-password'"
      :aria-invalid="invalid ? 'true' : undefined"
      class="h-11 w-full rounded-control border bg-surface pl-3 pr-12 text-base"
      :class="invalid ? 'border-destructive' : 'border-border'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
      :aria-label="show ? 'Hide password' : 'Show password'"
      @click="show = !show"
    >
      <EyeOff v-if="show" class="h-4 w-4" />
      <Eye v-else class="h-4 w-4" />
    </button>
  </div>
</template>
