<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <h1>Welcome to Dashboard!</h1>
  <Button variant="outline" @click="handleLogout"> Logout </Button>
</template>

<style scoped></style>
