<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSocketStore } from '@/stores/socket'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from '@lucide/vue'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'
import definition from '@dicebear/styles/glyphs.json' with { type: 'json' }
import { useProfileStore } from '@/stores/profile.ts'
import { useChatUnreadStore } from '@/stores/chatUnread.ts'
import { useChatMessagesStore } from '@/stores/chatMessages.ts'
import { debouncedMarkSeen } from '@/composables/useMarkSeen.ts'
import { Separator } from '@/components/ui/separator'

const route = useRoute()
const groupId = computed(() => route.params.groupId as string)

const socket = useSocketStore()
const profileStore = useProfileStore()
const chatMessages = useChatMessagesStore()
const unread = useChatUnreadStore()

const draft = ref('')
const scrollRef = ref<InstanceType<typeof ScrollArea> | null>(null)

const currentUserId = computed(() => profileStore.selfProfile?.user_id)
const messages = computed(() => chatMessages.byGroup[groupId.value]?.messages ?? [])

function getViewport() {
  return scrollRef.value?.$el?.querySelector(
    '[data-reka-scroll-area-viewport]',
  ) as HTMLElement | null
}

function scrollToBottom() {
  nextTick(() => {
    const viewport = getViewport()
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  })
}

function checkScrollPosition() {
  const viewport = getViewport()
  if (!viewport) return
  const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
  unread.setNearBottom(groupId.value, distanceFromBottom < 100)
}

function trySafeMarkSeen() {
  if (!document.hidden && unread.nearBottom[groupId.value]) {
    debouncedMarkSeen(groupId.value)
  }
}

function onVisibilityOrFocus() {
  trySafeMarkSeen()
}

const style = new Style(definition)

function avatarFor(senderId: string) {
  const profile = profileStore.getUserProfile(senderId)
  const seed = profile?.user_id ?? senderId
  return new DicebearAvatar(style, { seed, size: 128 }).toDataUri()
}

function nameFor(senderId: string) {
  return profileStore.getUserProfile(senderId)?.name ?? senderId
}

function handleSend() {
  const text = draft.value.trim()
  if (!text) return
  socket.sendMessage(groupId.value, text)
  draft.value = ''
}

let offMessageLocal: () => void

onMounted(async () => {
  unread.setNearBottom(groupId.value, true)

  await chatMessages.fetchInitial(groupId.value)
  unread.takeSnapshot(groupId.value)

  scrollToBottom()
  await nextTick()
  checkScrollPosition()
  trySafeMarkSeen()

  // lazily resolve unknown sender profiles + auto-scroll for messages arriving while this page is open
  offMessageLocal = socket.on('chat.message', async (msg) => {
    const payload = msg.payload
    if (payload.group_id !== groupId.value) return
    if (!profileStore.getUserProfile(payload.sender_id)) {
      await profileStore.ensureUserProfile(payload.sender_id)
    }
    checkScrollPosition()
    if (unread.nearBottom[groupId.value]) scrollToBottom()
  })

  const viewport = getViewport()
  viewport?.addEventListener('scroll', checkScrollPosition)
  window.addEventListener('focus', onVisibilityOrFocus)
  document.addEventListener('visibilitychange', onVisibilityOrFocus)
})

onUnmounted(() => {
  unread.clearSnapshot(groupId.value)
  offMessageLocal?.()
  const viewport = getViewport()
  viewport?.removeEventListener('scroll', checkScrollPosition)
  window.removeEventListener('focus', onVisibilityOrFocus)
  document.removeEventListener('visibilitychange', onVisibilityOrFocus)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <ScrollArea ref="scrollRef" class="flex-1 px-4">
      <div class="flex flex-col gap-3 py-4">
        <Button
          v-if="chatMessages.byGroup[groupId]?.nextCursor"
          variant="ghost"
          size="sm"
          class="self-center"
          @click="chatMessages.fetchOlder(groupId)"
        >
          Load older messages
        </Button>

        <template v-for="m in messages" :key="m.message_id">
          <div
            v-if="m.message_id === unread.dividerIdFor(groupId)"
            class="flex items-center gap-2 my-2"
          >
            <Separator class="flex-1" />
            <span class="text-xs text-muted-foreground shrink-0">New messages</span>
            <Separator class="flex-1" />
          </div>

          <div
            class="flex gap-2 max-w-[75%]"
            :class="m.sender_id === currentUserId ? 'self-end flex-row-reverse' : 'self-start'"
          >
            <Avatar>
              <AvatarImage :src="avatarFor(m.sender_id)" class="h-8 w-8 shrink-0" alt="avatar" />
              <AvatarFallback>{{ nameFor(m.sender_id).charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>
            <div
              class="rounded-lg px-3 py-2 text-sm"
              :class="
                m.sender_id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'
              "
            >
              <p v-if="m.sender_id !== currentUserId" class="font-medium text-xs opacity-70 mb-0.5">
                {{ nameFor(m.sender_id) }}
              </p>
              <p>{{ m.content }}</p>
            </div>
          </div>
        </template>
      </div>
    </ScrollArea>

    <div class="border-t p-3 flex gap-2">
      <Input
        v-model="draft"
        placeholder="Type a message…"
        @keyup.enter="handleSend"
        aria-label="message"
      />
      <Button size="icon" :disabled="!draft.trim()" @click="handleSend" aria-label="send">
        <Send class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
