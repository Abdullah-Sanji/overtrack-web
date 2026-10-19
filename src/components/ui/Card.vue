<script setup lang="ts">
withDefaults(defineProps<{ padded?: boolean }>(), { padded: true });
</script>
<template>
  <section class="rounded-card border bg-surface shadow-card">
    <header
      v-if="$slots.header"
      class="border-b px-5 py-4"
    >
      <slot name="header" />
    </header>
    <div :class="padded ? 'p-5' : ''">
      <slot />
    </div>
    <footer
      v-if="$slots.footer"
      class="border-t px-5 py-4"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
