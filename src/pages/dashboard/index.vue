<script lang="ts"></script>

<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModeToggle from '@/components/ModeToggle.vue'
import { useSocketStore } from '@/stores/socket.ts'
import { useChatUnreadStore } from '@/stores/chatUnread.ts'
import { useGroupStore } from '@/stores/group.ts'
import { useChatMessagesStore } from '@/stores/chatMessages.ts'
import type { ChatMessageRecord } from '@/api/chat.ts'
import { debouncedMarkSeen } from '@/composables/useMarkSeen.ts'
import { usePresenceStore } from '@/stores/presence.ts'

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  return route.matched
    .filter((r) => r.meta.breads)
    .flatMap((r) => {
      const result = typeof r.meta.breads === 'function' ? r.meta.breads(route) : r.meta.breads
      const items = Array.isArray(result) ? result : [{ title: result, to: { name: r.name } }]

      return items.map((item) => ({
        title: item.title,
        path: item.to ? router.resolve(item.to).path : r.path,
        groupId: r.name === 'dashboard-chat' ? (route.params.groupId as string) : undefined,
      }))
    })
})

const socket = useSocketStore()
const groupStore = useGroupStore()
const chatMessages = useChatMessagesStore()
const unread = useChatUnreadStore()
const presence = usePresenceStore()

let offMessage: () => void
let offHistory: () => void
let offOnlineSnapshot: () => void
let offPresence: () => void

onMounted(async () => {
  socket.connect()
  await groupStore.fetchSelfGroupsOnce()

  offMessage = socket.on('chat.message', (msg) => {
    const payload = msg.payload as ChatMessageRecord
    chatMessages.addLiveMessage(payload)

    const viewingThisGroup =
      route.name === 'dashboard-chat' && route.params.groupId === payload.group_id
    const safeToMarkSeen =
      viewingThisGroup && !document.hidden && unread.nearBottom[payload.group_id]

    if (safeToMarkSeen) {
      debouncedMarkSeen(payload.group_id)
    } else {
      unread.addUnseen(payload.group_id, payload.message_id)
    }
  })

  offHistory = socket.on('chat.history', (msg) => {
    const { group_id, messages_ids } = msg.payload
    unread.setUnseen(group_id, messages_ids)
  })

  offOnlineSnapshot = socket.on('chat.online', (msg) => {
    presence.setSnapshot(msg.payload.group_id, msg.payload.online_user_ids)
  })

  offPresence = socket.on('chat.presence', (msg) => {
    const { group_id, user_id, status } = msg.payload
    status === 'online'
      ? presence.markOnline(group_id, user_id)
      : presence.markOffline(group_id, user_id)
  })
})

const joinedGroups = new Set<string>()

watch(
  [() => socket.status, () => groupStore.selfGroups],
  ([status, groups]) => {
    if (status !== 'OPEN' || !groups.length) return
    groups.forEach((g) => {
      if (joinedGroups.has(g.group_id)) return
      socket.joinGroup(g.group_id)
      socket.requestUnreadIds(g.group_id)
      socket.requestOnlineUsers(g.group_id)
      joinedGroups.add(g.group_id)
    })
  },
  { immediate: true, deep: true },
)

// clear so a real reconnect re-joins everything (new connectionId server-side)
watch(
  () => socket.status,
  (status, prevStatus) => {
    if (status !== 'OPEN' && prevStatus === 'OPEN') {
      joinedGroups.clear()
    }
  },
)

onUnmounted(() => {
  socket.disconnect()
  offMessage?.()
  offHistory?.()
  offOnlineSnapshot?.()
  offPresence?.()
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 justify-between items-center px-4 shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
                <BreadcrumbItem class="hidden md:block">
                  <BreadcrumbPage
                    v-if="i === breadcrumbs.length - 1"
                    class="flex items-center gap-2"
                  >
                    {{ crumb.title }}
                    <span
                      v-if="crumb.groupId"
                      class="flex items-center gap-1 text-xs text-muted-foreground font-normal"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {{ presence.countFor(crumb.groupId) }} online
                    </span>
                  </BreadcrumbPage>

                  <BreadcrumbLink v-else as-child>
                    <RouterLink :to="crumb.path">
                      {{ crumb.title }}
                    </RouterLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator v-if="i < breadcrumbs.length - 1" class="hidden md:block" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <ModeToggle />
      </header>
      <RouterView :key="route.params.groupId as string" />
    </SidebarInset>
  </SidebarProvider>
</template>
