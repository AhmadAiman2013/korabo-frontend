import { useSocketStore } from '@/stores/socket.ts'
import { useChatUnreadStore } from '@/stores/chatUnread.ts'
import { useDebounceFn } from '@vueuse/core'

// module-level singleton function — shared by ChatPage.vue and Dashboard/index.vue
// so both share one debounce timer instead of racing two.
// Stores are resolved lazily INSIDE the callback, not at module scope,
// since Pinia isn't guaranteed to be active yet when this file is first imported.
export const debouncedMarkSeen = useDebounceFn((groupId: string) => {
  const socket = useSocketStore()
  const unread = useChatUnreadStore()
  socket.markSeen(groupId)
  unread.clearBadge(groupId)
}, 800)
