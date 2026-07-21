import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { computed } from 'vue';
import { http } from '@/api/http.ts';

export interface LoginRequest {
  email: string
  password: string
}

export interface TotpSetupRequest {
  email: string
}

export interface TotpSetupResponse {
  code: string
  otpauth_url: string
}

export interface TotpVerifyRequest {
  email: string
  code: string
}

export interface TotpVerifyResponse {
  code: string
  status: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  code: string
  status: string
}

export interface ForgotPasswordRequest {
  email: string
  code: string
  new_password: string
}

export interface ForgotPasswordResponse {
  code: string
  status: string
}

export interface AuthResponse {
  code: string
  status: string
  access_token: string
  expires_in: number
}

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage<string | null>('korabo_access_token', null)
  const expiresAt = useStorage<number | null>('korabo_expires_at', null)

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    return !(expiresAt.value && Date.now() > expiresAt.value);
  })

  let refreshPromise: Promise<void> |null = null
  async function login(payload: LoginRequest) {
    const res = await http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    })
    setSession(res)
    return res
  }

  async function totp_setup(payload: TotpSetupRequest) {
    return await http<TotpSetupResponse>('/auth/totp/setup', {
      method: 'POST',
      body: payload,
    })
  }

  async function totp_verify(payload: TotpVerifyRequest) {
    return await http<TotpVerifyResponse>('/auth/totp/verify-setup', {
      method: 'POST',
      body: payload,
    })
  }

  async function register(payload: RegisterRequest) {
    return await http<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    })
  }

  async function forgotPassword(payload: ForgotPasswordRequest) {
    return await http<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: payload,
    })
  }



  function refreshOnce(): Promise<void> {
    if (token.value == null) {
      return Promise.resolve()
    }
    if (!refreshPromise) {
      refreshPromise = http<AuthResponse>('/auth/refresh', { method: 'POST', body: {} })
        .then(setSession)
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  }

  async function trySilentRefresh() {
    try {
      await refreshOnce()
    } catch {
      clearToken()
    }
  }

  async function logout() {
    try {
      await http('/auth/logout', { method: 'POST', body: {} })
    } finally {
      clearToken()
    }
  }

  function clearToken() {
    token.value = null
    expiresAt.value = null
  }

  function setSession(res: AuthResponse) {
    token.value = res.access_token
    expiresAt.value = Date.now() + res.expires_in * 1000
  }

  return {
    token,
    isAuthenticated,
    login,
    totp_setup,
    totp_verify,
    register,
    forgotPassword,
    refreshOnce,
    trySilentRefresh,
    logout,
    clearToken,
  }
})
