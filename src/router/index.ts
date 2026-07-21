import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/index.vue'
import Login from '@/pages/login/index.vue'
import SignUp from '@/pages/signup/index.vue'
import Dashboard from '@/pages/dashboard/index.vue'
import SignUpVerify from '@/pages/totp/index.vue'
import ForgotPassword from '@/pages/forgotpassword/index.vue'
import { useAuthStore } from '@/stores/auth.ts'
import { useRegistrationFlowStore } from '@/stores/registrationFlow.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login, meta: { requiresGuest: true } },
    { path: '/signup', name: 'signup', component: SignUp },
    { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    {
      path: '/signup/verify',
      name: 'signup-verify',
      component: SignUpVerify,
      beforeEnter: () => {
        const store = useRegistrationFlowStore()
        if (!store.email) return { path: '/signup' }
      },
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: { requiresGuest: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { path: '/dashboard' }
  }

  return true
})

export default router
