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

    // called by handleSend — pushes a temp bubble immediately
    addOptimisticMessage(groupId: string, senderId: string, content: string): string {
      const g = this.ensureGroup(groupId)
      const tempId = `temp-${crypto.randomUUID()}`
      g.messages.push({
        group_id: groupId,
        message_id: tempId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
        pending: true,
      })
      return tempId
    },

    // called when the real chat.message frame arrives
    addLiveMessage(msg: ChatMessageRecord) {
      const g = this.ensureGroup(msg.group_id)

      // dedupe against a real (non-pending) duplicate, e.g. from a reconnect replay
      if (g.messages.some((m) => m.message_id === msg.message_id)) return

      // try to reconcile against my own pending optimistic bubble
      const pendingIndex = g.messages.findIndex(
        (m) => m.pending && m.sender_id === msg.sender_id && m.content === msg.content,
      )

      if (pendingIndex !== -1) {
        g.messages.splice(pendingIndex, 1, msg) // replace temp with real, pending gone
      } else {
        g.messages.push(msg)
      }
    },

    async fetchInitial(groupId: string, limit = 30) {
      const g = this.ensureGroup(groupId)
      if (g.loadedOnce || g.loading) return
      g.loading = true
      try {
        const res = await getChatHistory({ group_id: groupId, limit })
        g.messages = res.messages
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
        g.messages = res.messages.concat(g.messages)
        g.nextCursor = res.next_cursor
      } finally {
        g.loading = false
      }
    },
  },
})

