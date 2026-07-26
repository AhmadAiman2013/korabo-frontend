// stores/member.ts
import { defineStore } from 'pinia'
import {
  approveMember,
  getMyMembership,
  listMembers,
  removeMember,
  transferOwnership,
  type GroupMember,
  type MyMembership,
  type TransferOwnershipRequest,
} from '@/api/group'

export const useMemberStore = defineStore('member', {
  state: () => ({
    groupId: null as string | null,
    members: [] as GroupMember[],
    isOwner: false,
    selfMembership: null as MyMembership | null,
    loading: false,
  }),

  actions: {
    // call this on mount / when groupId changes — guards against stale cross-group state
    resetFor(groupId: string) {
      if (this.groupId === groupId) return
      this.groupId = groupId
      this.members = []
      this.isOwner = false
      this.selfMembership = null
    },

    setMembers(res: { members: GroupMember[]; isOwner: boolean }) {
      this.members = res.members
      this.isOwner = res.isOwner
    },

    async loadMembers(groupId: string) {
      const res = await listMembers(groupId)
      this.setMembers({ members: res.members, isOwner: res.is_owner })
    },

    async loadMyMembership(groupId: string) {
      this.selfMembership = await getMyMembership(groupId)
    },

    async pollMembersUntil(
      groupId: string,
      predicate: (members: GroupMember[], isOwner: boolean) => boolean,
      { attempts = 6, intervalMs = 700 }: { attempts?: number; intervalMs?: number } = {},
    ) {
      let last: { members: GroupMember[]; is_owner: boolean } | null = null
      for (let i = 0; i < attempts; i++) {
        try {
          last = await listMembers(groupId)
        } catch (e: any) {
          if (e?.response?.status === 403) {
            return { settled: false, lostAccess: true }
          }
          throw e
        }
        if (predicate(last.members, last.is_owner)) {
          this.setMembers({ members: last.members, isOwner: last.is_owner })
          return { settled: true, lostAccess: false }
        }
        await new Promise((r) => setTimeout(r, intervalMs))
      }
      if (last) this.setMembers({ members: last.members, isOwner: last.is_owner })
      return { settled: false, lostAccess: false }
    },

    // mutation actions — same optimistic-flip pattern, just against store state
    optimisticAddSelf(member: GroupMember) {
      if (!this.members.some((m) => m.user_id === member.user_id)) {
        this.members = [...this.members, member]
      }
    },
    optimisticRemove(userId: string) {
      this.members = this.members.filter((m) => m.user_id !== userId)
    },
    optimisticSetRole(userId: string, role: GroupMember['role']) {
      this.members = this.members.map((m) => (m.user_id === userId ? { ...m, role } : m))
    },

    async approve(groupId: string, userId: string) {
      await approveMember(groupId, userId)
      this.members = this.members.map((m) =>
        m.user_id === userId ? { ...m, status: 'active' } : m,
      )
    },
    async remove(groupId: string, userId: string) {
      await removeMember(groupId, userId)
      this.optimisticRemove(userId)
    },
    async transfer(groupId: string, actingUserId: string, payload: TransferOwnershipRequest) {
      await transferOwnership(groupId, actingUserId, payload)
    },
  },
})
