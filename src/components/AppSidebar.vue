<script setup lang="ts">
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
} from '@/components/ui/sidebar'

import { BookOpen, Command, SquareTerminal, UsersRound, LayoutDashboard } from '@lucide/vue'
import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import NavPrime from '@/components/NavPrime.vue'
import { useGroupStore } from '@/stores/group.ts'
import { useChatUnreadStore } from '@/stores/chatUnread.ts'
import { computed } from 'vue'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const groupStore = useGroupStore()
const unread = useChatUnreadStore()

const navPrime = [
  { title: 'Home', name: 'dashboard-home', icon: LayoutDashboard, url: '/dashboard/home' },
  { title: 'Groups', name: 'dashboard-groups-root', icon: UsersRound, url: '/dashboard/groups' },
]

const navMain = computed(() => [
  {
    title: 'Chat',
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: groupStore.selfGroups.map((g) => ({
      title: g.name,
      url: `/dashboard/chat/${g.group_id}`,
      groupId: g.group_id,
      unreadCount: unread.countFor(g.group_id),
    })),
  },
  {
    title: 'Forum',
    url: '#',
    icon: BookOpen,
    items: [{ title: 'Introduction', url: '#' }],
  },
])
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div class="flex items-center">
            <SidebarMenuButton size="lg" as-child>
              <a href="#">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">Korabo</span>
                </div>
              </a>
            </SidebarMenuButton>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavPrime :items="navPrime" />
      <NavMain :items="navMain" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
