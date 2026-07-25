import { ofetch } from 'ofetch'
import { useAuthStore } from '@/stores/auth.ts'
import router from '@/router'
import { toast } from 'vue-sonner'

export const http = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL,
  credentials: 'include',
  retry: 1,
  retryStatusCodes: [401],

  onRequest({ options }) {
    const auth = useAuthStore()
    if (auth.token) {
      options.headers = new Headers(options.headers)
      options.headers.set('Authorization', `Bearer ${auth.token}`)
    }
  },

  async onResponseError({ request, response }) {
    const url = typeof request === 'string' ? request : request.url

    if (response.status === 401) {
      if (url.includes('/auth/refresh') || url.includes('/auth/login')) return

      const auth = useAuthStore()
      try {
        await auth.refreshOnce()
      } catch {
        auth.clearToken()
        toast.error('Session expired, please log in again')
        await router.push('/login')
      }
      return
    }

    const message = response._data?.message ?? 'Something went wrong'
    toast.error(message)
  }
})
