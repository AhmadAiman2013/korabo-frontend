import { defineStore } from 'pinia'

export const usePresenceStore = defineStore('presence', {
  state: () => ({
    onlineByGroup: {} as Record<string, Set<string>>,
  }),
  getters: {
    countFor: (state) => (groupId: string) => state.onlineByGroup[groupId]?.size ?? 0,
    hasOnline: (state) => (groupId: string) => (state.onlineByGroup[groupId]?.size ?? 0) > 0,
    isOnline: (state) => (groupId: string, userId: string) =>
      state.onlineByGroup[groupId]?.has(userId) ?? false,
  },
  actions: {
    setSnapshot(groupId: string, userIds: string[]) {
      this.onlineByGroup[groupId] = new Set(userIds)
    },
    markOnline(groupId: string, userId: string) {
      if (!this.onlineByGroup[groupId]) this.onlineByGroup[groupId] = new Set()
      this.onlineByGroup[groupId].add(userId)
    },
    markOffline(groupId: string, userId: string) {
      this.onlineByGroup[groupId]?.delete(userId)
    },
  },
})
