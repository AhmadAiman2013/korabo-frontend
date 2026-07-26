import { type ChatMessageRecord, getChatHistory } from '@/api/chat.ts'
import { defineStore } from 'pinia'

interface GroupChatState {
  messages: ChatMessageRecord[]
  nextCursor: string | null
  loading: boolean
  loadedOnce: boolean
}

export const useChatMessagesStore = defineStore('chatMessages', {
  state: () => ({
    byGroup: {} as Record<string, GroupChatState>,
  }),
  actions: {
    ensureGroup(groupId: string) {
      if (!this.byGroup[groupId]) {
        this.byGroup[groupId] = {
          messages: [],
          nextCursor: null,
          loading: false,
          loadedOnce: false,
        }
      }
      return this.byGroup[groupId]
    },
    addLiveMessage(msg: ChatMessageRecord) {
      const g = this.ensureGroup(msg.group_id)
      if (g.messages.some((m) => m.message_id === msg.message_id)) return
      g.messages.push(msg)
    },
    async fetchInitial(groupId: string, limit = 30) {
      const g = this.ensureGroup(groupId)
      if (g.loadedOnce || g.loading) return
      g.loading = true
      try {
        const res = await getChatHistory({ group_id: groupId, limit })
        g.messages = [...res.messages].reverse() // confirm ordering assumption with backend
        g.nextCursor = res.next_cursor
        g.loadedOnce = true
      } finally {
        g.loading = false
      }
    },
    async fetchOlder(groupId: string, limit = 30) {
      const g = this.ensureGroup(groupId)
      if (g.loading || !g.nextCursor) return
      g.loading = true
      try {
        const res = await getChatHistory({ group_id: groupId, cursor: g.nextCursor, limit })
        g.messages = [...res.messages].reverse().concat(g.messages)
        g.nextCursor = res.next_cursor
      } finally {
        g.loading = false
      }
    },
  },
})

