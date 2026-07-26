import { useSocketStore } from '@/stores/socket.ts'
import { useChatUnreadStore } from '@/stores/chatUnread.ts'
import { useDebounceFn } from '@vueuse/core'

const socket = useSocketStore()
const unread = useChatUnreadStore()

// module-level singleton — shared by ChatPage.vue and Dashboard/index.vue
// so both share one debounce timer instead of racing two
export const debouncedMarkSeen = useDebounceFn((groupId: string) => {
  socket.markSeen(groupId)
  unread.clearBadge(groupId)
}, 800)
