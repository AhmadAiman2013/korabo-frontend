import { defineStore } from 'pinia'

export const useChatUnreadStore = defineStore('chatUnread', {
  state: () => ({
    unseenIds: {} as Record<string, string[]>,
    snapshot: {} as Record<string, string[]>,
    nearBottom: {} as Record<string, boolean>,
  }),
  getters: {
    countFor: (state) => (groupId: string) => state.unseenIds[groupId]?.length ?? 0,
    dividerIdFor: (state) => (groupId: string) => state.snapshot[groupId]?.[0] ?? null,
  },
  actions: {
    setUnseen(groupId: string, ids: string[]) {
      this.unseenIds[groupId] = ids
    },
    addUnseen(groupId: string, messageId: string) {
      if (!this.unseenIds[groupId]) this.unseenIds[groupId] = []
      this.unseenIds[groupId].push(messageId)
    },
    takeSnapshot(groupId: string) {
      this.snapshot[groupId] = [...(this.unseenIds[groupId] ?? [])]
    },
    clearBadge(groupId: string) {
      this.unseenIds[groupId] = []
    },
    clearSnapshot(groupId: string) {
      this.snapshot[groupId] = []
    },
    setNearBottom(groupId: string, value: boolean) {
      this.nearBottom[groupId] = value
    },
  },
})
