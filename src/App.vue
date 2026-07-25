<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <RouterView />
  <Toaster richColors position="top-right" />
</template>
