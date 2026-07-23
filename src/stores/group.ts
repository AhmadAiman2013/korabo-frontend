import { defineStore } from 'pinia'
import type { Group } from '@/api/group'

export const useGroupStore = defineStore('group', {
  state: () => ({
    groups: [] as Group[],
    currentGroup: null as Group | null,
  }),

  actions: {
    setGroups(groups: Group[]) {
      this.groups = groups
    },

    selectGroup(group: Group) {
      this.currentGroup = group
    },

    clearGroup() {
      this.currentGroup = null
    },
  },
})
