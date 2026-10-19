<script setup lang="ts">
import { EmptyState, Button } from '@/components/ui';
</script>
<template>
  <EmptyState title="Page not found" description="The page you are looking for does not exist.">
    <template #action>
      <Button @click="$router.push({ name: 'dashboard' })">Go to dashboard</Button>
    </template>
  </EmptyState>
</template>
