<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRegistrationFlowStore } from '@/stores/registrationFlow.ts'
import { computed, ref } from 'vue'
import { useClipboard, useIntervalFn } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth.ts'
import { Button } from '@/components/ui/button'
import QrcodeVue from 'qrcode.vue'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

const store = useRegistrationFlowStore()
const router = useRouter()
const auth = useAuthStore()

if (!store.email) {
  router.replace('/register')
}

const code = ref<string>('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const expired = ref(false)

const manualSecret = computed(() => {
  try {
    return new URL(store.otpauthUrl).searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
})
const { copy, copied } = useClipboard({ source: manualSecret })

const remaining = ref(Math.max(0, store.expiresAt - Date.now()))
const remainingLabel = computed(() => {
  const s = Math.ceil(remaining.value / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

const { pause } = useIntervalFn(() => {
  remaining.value = Math.max(0, store.expiresAt - Date.now())
  if (remaining.value === 0) {
    expired.value = true
    pause()
  }
}, 1000)

async function regenerate() {
  loading.value = true
  error.value = ''
  try {
    const data = await auth.totp_setup({ email: store.email })
    store.setSetup(store.email, data.otpauth_url)
    remaining.value = Math.max(0, store.expiresAt - Date.now())
    expired.value = false
    code.value = ''
  } catch {
    error.value = 'could not refresh code, try again'
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (expired.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.totp_verify({
      email: store.email,
      code: code.value,
    })
    await auth.register({
      email: store.email,
      password: password.value,
    })
    store.reset()
    router.push('/login?registered=1')
  } catch (e: any) {
    error.value = e?.response?.data?.status ?? 'invalid code, try again'
    code.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm space-y-6 py-10">
    <div class="space-y-2 text-center">
      <h1 class="text-xl font-semibold">Set up your authenticator</h1>
      <p class="text-sm text-muted-foreground">
        Scan this, then enter the code and your password below.
      </p>
    </div>

    <div v-if="!expired" class="flex justify-center">
      <QrcodeVue :value="store.otpauthUrl" :size="200" level="M" />
    </div>
    <div
      v-else
      class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
    >
      This code expired.
      <button class="ml-1 underline" :disabled="loading" @click="regenerate">
        Generate a new one
      </button>
    </div>

    <div class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span v-if="!expired">expires in {{ remainingLabel }}</span>
      <button class="underline" @click="copy()">
        {{ copied ? 'copied' : "can't scan? copy secret" }}
      </button>
    </div>

    <div class="space-y-3">
      <InputOTP v-model="code" :maxlength="6" placeholder="○" :disabled="expired">
        <InputOTPGroup class="justify-center">
          <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" />
        </InputOTPGroup>
      </InputOTP>
      <Input
        v-model="password"
        type="password"
        placeholder="password"
        :disabled="expired"
        aria-label="password"
      />
      <p v-if="error" class="text-center text-sm text-destructive">{{ error }}</p>
    </div>

    <Button
      :disabled="expired || loading || code.length < 6 || !password"
      class="w-full disabled:opacity-60"
      @click="onSubmit"
    >
      <Spinner v-if="loading" class="animate-spin" />
      {{ loading ? 'Verifying…' : 'Verify & finish registration' }}
    </Button>
  </div>
</template>

<style scoped></style>
