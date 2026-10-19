<script setup lang="ts">
defineProps<{ label: string; name: string; error?: string; hint?: string; required?: boolean }>();
</script>
<template>
  <div class="space-y-1.5">
    <label
      :for="name"
      class="block text-sm font-medium text-foreground"
    >{{ label }} <span
      v-if="required"
      class="text-destructive"
      aria-hidden="true"
    >*</span></label>
    <slot
      :id="name"
      :invalid="Boolean(error)"
    />
    <p
      v-if="error"
      :id="`${name}-error`"
      role="alert"
      class="text-sm text-destructive"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="text-sm text-muted-foreground"
    >
      {{ hint }}
    </p>
  </div>
</template>
