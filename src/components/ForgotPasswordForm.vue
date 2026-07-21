<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.ts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

const router = useRouter()
const auth = useAuthStore()

const step = ref<'email' | 'reset'>('email')
const email = ref('')
const code = ref<string[]>([])
const newPassword = ref('')
const error = ref('')
const loading = ref(false)

function goToReset() {
  if (!email.value) return
  step.value = 'reset'
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.forgotPassword({
      email: email.value,
      code: code.value.join(''),
      new_password: newPassword.value,
    })
    router.push('/login?reset=1')
  } catch (e: any) {
    error.value = e?.response?.data?.status ?? 'invalid code or request'
    code.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm space-y-6 py-10">
    <template v-if="step === 'email'">
      <h1 class="text-xl font-semibold">Reset your password</h1>
      <Input v-model="email" type="email" placeholder="you@example.com" aria-label="Email" />
      <Button class="w-full" @click="goToReset">Continue</Button>
    </template>

    <template v-else>
      <p class="text-sm text-muted-foreground">
        Enter the code from your authenticator app for {{ email }}
      </p>
      <InputOTP v-model="code" :maxlength="6" placeholder="○">
        <InputOTPGroup class="justify-center">
          <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" />
        </InputOTPGroup>
      </InputOTP>
      <Input
        v-model="newPassword"
        type="password"
        placeholder="new password"
        aria-label="New password"
      />
      <p v-if="error" class="text-center text-sm text-destructive">{{ error }}</p>
      <Button class="w-full" :disabled="loading" @click="onSubmit">
        {{ loading ? 'Updating…' : 'Update password' }}
      </Button>
    </template>
  </div>
</template>

<style scoped></style>
