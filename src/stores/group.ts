import { defineStore } from 'pinia'
import { getMyGroups, type Group, listGroups } from '@/api/group'

export const useGroupStore = defineStore('group', {
  state: () => ({
    selfGroups: [] as Group[],
    groups: [] as Group[],
    currentGroup: null as Group | null,
    loading: false,
  }),

  actions: {
    setSelfGroups(groups: Group[]) {
      this.selfGroups = Array.isArray(groups) ? groups : []
    },

    setGroups(groups: Group[]) {
      this.groups = Array.isArray(groups) ? groups : []
    },

    selectGroup(group: Group) {
      this.currentGroup = group
    },

    clearGroup() {
      this.currentGroup = null
    },

    addGroup(group: Group) {
      this.selfGroups.push(group)
    },

    async fetchSelfGroupsOnce() {
      if (this.selfGroups.length || this.loading) return
      this.loading = true
      try {
        const groups = await getMyGroups()
        this.setSelfGroups(groups)
      } finally {
        this.loading = false
      }
    },

    async fetchAllGroups() {
      this.loading = true
      try {
        let cursor: string | undefined
        const all: Group[] = []
        do {
          const res = await listGroups({ cursor, limit: 50 })
          all.push(...res.groups)
          cursor = res.nextCursor ?? undefined
        } while (cursor)
        this.setGroups(all)
      } finally {
        this.loading = false
      }
    },
  },
})
