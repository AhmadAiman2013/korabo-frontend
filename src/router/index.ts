import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Home from '@/pages/index.vue'
import Login from '@/pages/login/index.vue'
import SignUp from '@/pages/signup/index.vue'
import Dashboard from '@/pages/dashboard/index.vue'
import SignUpVerify from '@/pages/totp/index.vue'
import ForgotPassword from '@/pages/forgotpassword/index.vue'
import DashboardHome from '@/views/dashboard/home.vue'
import Groups from '@/views/dashboard/groups.vue'
import GroupDetails from '@/views/dashboard/group_details.vue'
import Profile from '@/views/dashboard/profile.vue'
import Chat from '@/views/dashboard/chat.vue'
import { useAuthStore } from '@/stores/auth.ts'
import { useRegistrationFlowStore } from '@/stores/registrationFlow.ts'
import { useGroupStore } from '@/stores/group.ts'
import { useProfileStore } from '@/stores/profile.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login, meta: { requiresGuest: true } },
    { path: '/signup', name: 'signup', component: SignUp },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'dashboard-home',
          component: DashboardHome,
          meta: {
            breads: 'My Dashboard',
          },
        },
        {
          path: 'profile',
          name: 'dashboard-profile',
          component: Profile,
          meta: {
            breads: 'My Profile',
          },
        },
        {
          path: 'groups',
          name: 'dashboard-groups-root',
          component: RouterView,
          meta: {
            breads: 'Groups',
          },
          children: [
            {
              path: '',
              name: 'dashboard-groups',
              component: Groups,
            },
            {
              path: ':groupId',
              name: 'dashboard-group-detail',
              component: GroupDetails,
              meta: {
                breads: () => useGroupStore().currentGroup?.name ?? 'Group',
              },
            },
            {
              path: ':groupId/profile/:userId',
              name: 'dashboard-group-member-profile',
              component: Profile,
              meta: {
                // returns an array: injects the missing "group" crumb manually
                breads: (route: { params: { groupId: any } }) => [
                  {
                    title: useGroupStore().currentGroup?.name ?? 'Group',
                    to: {
                      name: 'dashboard-group-detail',
                      params: { groupId: route.params.groupId },
                    },
                  },
                  {
                    title: useProfileStore().fallbackName,
                  },
                ],
              },
            },
          ],
        },
        {
          path: 'chat/:groupId',
          name: 'dashboard-chat',
          component: Chat,
          meta: {
            breads: () =>
              useGroupStore().selfGroups.find(
                (g) => g.group_id === router.currentRoute.value.params.groupId,
              )?.name ?? 'Chat',
          },
        },
      ],
    },
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
    return { path: '/dashboard/home' }
  }

  return true
})

export default router
