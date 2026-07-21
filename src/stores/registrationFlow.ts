import { defineStore } from 'pinia'
import { useSessionStorage } from '@vueuse/core'

export const useRegistrationFlowStore = defineStore('registrationFlow', () => {
  const email = useSessionStorage('reg-flow-email', '')
  const otpauthUrl = useSessionStorage('reg-flow-otpauth', '')
  const expiresAt = useSessionStorage('reg-flow-expires', 0)

  function setSetup(newEmail: string, url: string, ttlSeconds = 900) {
    email.value = newEmail
    otpauthUrl.value = url
    expiresAt.value = Date.now() + ttlSeconds * 1000
  }

  function reset() {
    email.value = ''
    otpauthUrl.value = ''
    expiresAt.value = 0
  }

  return {
    email,
    otpauthUrl,
    expiresAt,
    setSetup,
    reset
  }
})
