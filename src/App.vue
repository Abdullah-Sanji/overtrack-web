<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from '@/components/ui';
import ConfirmHost from '@/components/layout/ConfirmHost.vue';
</script>
<template>
  <RouterView />
  <Toaster />
  <ConfirmHost />
</template>
