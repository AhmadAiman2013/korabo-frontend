<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useGroupStore } from '@/stores/group.ts'
import { computed, onMounted, ref } from 'vue'
import {
  approveMember,
  getGroup,
  type GroupMember,
  joinGroup,
  leaveGroup,
  listMembers,
  type ListMembersResponse,
  removeMember,
  transferOwnership,
} from '@/api/group.ts'
import { Lock, Globe, Users, Tags, Loader } from '@lucide/vue'

import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useProfileStore } from '@/stores/profile.ts'
import { getUsersProfile } from '@/api/user.ts'
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const route = useRoute()
const router = useRouter()
const groupStore = useGroupStore()

const groupId = computed(() => route.params.groupId as string)
const loading = ref(true)
const error = ref<string | null>(null)
const members = ref<GroupMember[]>([])
const isOwner = ref(false)
const profileStore = useProfileStore()
const forbidden = ref(false)

const pendingActions = ref<Set<string>>(new Set())
const showTransferDialog = ref(false)
const selectedNewOwner = ref<string | null>(null)
const transferSubmitting = ref(false)
const joinLeaveSubmitting = ref(false)

const selfUserId = computed(() => profileStore.selfProfile?.user_id ?? null)

const selfMember = computed(() => members.value.find((m) => m.user_id === selfUserId.value) ?? null)
const isMember = computed(() => !!selfMember.value)
const isPending = computed(() => selfMember.value?.status === 'pending')

// members other than self, active only, used as candidates for ownership transfer
const transferCandidates = computed(() =>
  members.value.filter((m) => m.user_id !== selfUserId.value && m.status === 'active'),
)

function isBusy(userId: string) {
  return pendingActions.value.has(userId)
}

function setBusy(userId: string, busy: boolean) {
  const next = new Set(pendingActions.value)
  if (busy) next.add(userId)
  else next.delete(userId)
  pendingActions.value = next
}

async function loadGroup() {
  const group = await getGroup(groupId.value)
  groupStore.selectGroup(group)
}

async function loadMembers() {
  const res = await listMembers(groupId.value)
  members.value = res.members
  isOwner.value = res.is_owner
}

async function loadMemberProfiles() {
  await Promise.all(
    members.value.map(async (member) => {
      if (!profileStore.getUserProfile(member.user_id)) {
        const profile = await getUsersProfile(member.user_id)
        profileStore.setUserProfile(profile)
      }
    }),
  )
}

function generateFallbackName(seed: string) {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    seed,
  })
}

function displayMemberName(userId: string) {
  const profile = profileStore.getUserProfile(userId)

  if (profile?.name) return profile.name

  return profile?.name ?? generateFallbackName(userId)
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadGroup(), loadMembers()])

    await loadMemberProfiles()
  } catch (e: any) {
    if (e?.response?.status === 403) {
      forbidden.value = true
    } else {
      error.value = 'Failed to load members.'
    }
  } finally {
    loading.value = false
  }
})

function goToProfileDetails(userId: string) {
  const profile = profileStore.getUserProfile(userId)
  console.log('goToProfileDetails', profile)
  if (profile) {
    profileStore.setProfile(profile)
  }
  router.push(`${route.path}/profile/${userId}`)
}

// group interaction

async function handleJoin() {
  joinLeaveSubmitting.value = true
  try {
    await joinGroup(groupId.value)

    if (selfUserId.value && !members.value.some((m) => m.user_id === selfUserId.value)) {
      members.value = [
        ...members.value,
        {
          group_id: groupId.value,
          user_id: selfUserId.value,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString(),
        },
      ]
    }

    const result = await pollMembersUntil((ms) => ms.some((m) => m.user_id === selfUserId.value))
    await applyServerState(result)
    toast.success('Joined group')

    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to join group.')
  } finally {
    joinLeaveSubmitting.value = false
  }
}

function handleLeaveClick() {
  if (isOwner.value) {
    selectedNewOwner.value = null
    showTransferDialog.value = true
    return
  }
  void doLeave()
}

async function doLeave() {
  joinLeaveSubmitting.value = true
  const leavingUserId = selfUserId.value
  try {
    await leaveGroup(groupId.value)

    // optimistic: remove self immediately
    members.value = members.value.filter((m) => m.user_id !== leavingUserId)

    const result = await pollMembersUntil((ms) => !ms.some((m) => m.user_id === leavingUserId))
    await applyServerState(result)
    toast.success('Left group')
    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to leave group.')
  } finally {
    joinLeaveSubmitting.value = false
  }
}

async function confirmTransferAndLeave() {
  if (!selfUserId.value || !selectedNewOwner.value) return
  const newOwnerId = selectedNewOwner.value
  const leavingUserId = selfUserId.value
  transferSubmitting.value = true
  try {
    await transferOwnership(groupId.value, selfUserId.value, {
      new_owner_id: selectedNewOwner.value,
    })
    await leaveGroup(groupId.value)

    members.value = members.value
      .filter((m) => m.user_id !== leavingUserId)
      .map((m) => (m.user_id === newOwnerId ? { ...m, role: 'owner' } : m))

    showTransferDialog.value = false
    const result = await pollMembersUntil(
      (ms) =>
        !ms.some((m) => m.user_id === leavingUserId) &&
        ms.some((m) => m.user_id === newOwnerId && m.role === 'owner'),
    )
    await applyServerState(result)
    toast.success('Ownership transferred, and you left the group')
    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to transfer ownership and leave.')
  } finally {
    transferSubmitting.value = false
  }
}

async function handleApprove(userId: string) {
  const key = `approve:${userId}`
  setBusy(key, true)
  try {
    await approveMember(groupId.value, userId)
    // optimistic
    members.value = members.value.map((m) =>
      m.user_id === userId ? { ...m, status: 'active' } : m,
    )

    const result = await pollMembersUntil((ms) =>
      ms.some((m) => m.user_id === userId && m.status === 'active'),
    )
    await applyServerState(result)
    toast.success('Member approved')
    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to approve member.')
  } finally {
    setBusy(key, false)
  }
}

async function handleRemove(userId: string) {
  const key = `remove:${userId}`
  setBusy(key, true)
  try {
    await removeMember(groupId.value, userId)
    // optimistic
    members.value = members.value.filter((m) => m.user_id !== userId)

    const result = await pollMembersUntil((ms) => !ms.some((m) => m.user_id === userId))
    await applyServerState(result)
    toast.success('Member removed')
    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to remove member.')
  } finally {
    setBusy(key, false)
  }
}

async function handleDirectTransfer(userId: string) {
  if (!selfUserId.value) return
  const key = `transfer:${userId}`
  setBusy(key, true)
  try {
    await transferOwnership(groupId.value, selfUserId.value, { new_owner_id: userId })

    // optimistic
    members.value = members.value.map((m) => {
      if (m.user_id === userId) return { ...m, role: 'owner' }
      if (m.user_id === selfUserId.value) return { ...m, role: 'member' }
      return m
    })
    isOwner.value = false

    const result = await pollMembersUntil((ms) =>
      ms.some((m) => m.user_id === userId && m.role === 'owner'),
    )
    await applyServerState(result)
    toast.success('Ownership transferred')
    if (!result.settled) {
      toast.info('Still syncing — refresh in a moment if it looks off.')
    }
  } catch (e) {
    toast.error('Failed to transfer ownership.')
  } finally {
    setBusy(key, false)
  }
}

async function pollMembersUntil(
  predicate: (members: GroupMember[], isOwner: boolean) => boolean,
  { attempts = 6, intervalMs = 700 }: { attempts?: number; intervalMs?: number } = {},
): Promise<{ members: GroupMember[]; isOwner: boolean; settled: boolean }> {
  let last: ListMembersResponse | null = null
  for (let i = 0; i < attempts; i++) {
    last = await listMembers(groupId.value)
    if (predicate(last.members, last.is_owner)) {
      return { members: last.members, isOwner: last.is_owner, settled: true }
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return { members: last!.members, isOwner: last!.is_owner, settled: false }
}

async function applyServerState(res: { members: GroupMember[]; isOwner: boolean }) {
  members.value = res.members
  isOwner.value = res.isOwner
  await loadMemberProfiles()
}
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-6 p-6">
    <Skeleton class="h-8 w-64" />
    <Skeleton class="h-4 w-96" />
    <Skeleton class="h-40 w-full" />
  </div>
  <div v-else-if="error || !groupStore.currentGroup" class="p-6 text-destructive">
    {{ error || 'Group not found.' }}
  </div>

  <div v-else class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-semibold">{{ groupStore.currentGroup.name }}</h1>
          <Badge
            :variant="groupStore.currentGroup.group_type === 'private' ? 'secondary' : 'default'"
          >
            <component
              :is="groupStore.currentGroup.group_type === 'private' ? Lock : Globe"
              class="mr-1 h-3 w-3"
            />
            {{ groupStore.currentGroup.group_type }}
          </Badge>
        </div>

        <div>
          <Button v-if="!isMember" size="sm" :disabled="joinLeaveSubmitting" @click="handleJoin">
            <Loader v-if="joinLeaveSubmitting" class="mr-1 h-4 w-4 animate-spin" />
            Join
          </Button>
          <Button
            v-else-if="!isPending"
            size="sm"
            variant="outline"
            :disabled="joinLeaveSubmitting"
            @click="handleLeaveClick"
          >
            <Loader v-if="joinLeaveSubmitting" class="mr-1 h-4 w-4 animate-spin" />
            Leave
          </Button>
          <Badge v-else variant="outline">Pending approval</Badge>
        </div>
      </div>

      <p class="text-muted-foreground">{{ groupStore.currentGroup.description }}</p>

      <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Tags class="h-4 w-4" />
        <span>{{ groupStore.currentGroup.primary_subject }}</span>
        <Badge v-for="tag in groupStore.currentGroup.subject_tags" :key="tag" variant="outline">
          {{ tag }}
        </Badge>
      </div>
      <div class="flex items-center gap-1 text-sm text-muted-foreground">
        <Users class="h-4 w-4" />
        <span
          >{{ groupStore.currentGroup.member_count }} member{{
            groupStore.currentGroup.member_count === 1 ? '' : 's'
          }}</span
        >
      </div>
    </div>

    <div>
      <h2 class="mb-2 text-lg font-medium">Members</h2>

      <div
        v-if="forbidden"
        class="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center"
      >
        <Lock class="h-5 w-5 text-muted-foreground" />
        <p class="text-sm font-medium">Members are private</p>
        <p class="text-xs text-muted-foreground">Join this group to see who's a member.</p>
      </div>
      <div v-else class="flex flex-col divide-y rounded-md border">
        <div v-for="m in members" :key="m.user_id" class="flex items-center justify-between p-3">
          <span @click="goToProfileDetails(m.user_id)" class="cursor-pointer hover:underline">
            {{ displayMemberName(m.user_id) }}
          </span>

          <div class="flex items-center gap-2">
            <Badge
              v-if="profileStore && m.user_id === profileStore.selfProfile?.user_id"
              class="bg-green-500 text-white hover:bg-green-600"
            >
              You
            </Badge>
            <Badge v-else-if="m.status === 'pending'" variant="outline"> Pending </Badge>
            <Badge v-else :variant="m.role === 'owner' ? 'default' : 'secondary'">
              {{ m.role }}
            </Badge>

            <!-- owner-only actions on other members -->
            <template v-if="isOwner && m.user_id !== selfUserId">
              <Button
                v-if="m.status === 'pending'"
                size="sm"
                variant="outline"
                :disabled="isBusy(m.user_id)"
                @click="handleApprove(m.user_id)"
              >
                <Loader v-if="isBusy(m.user_id)" class="mr-1 h-4 w-4 animate-spin" />
                Approve
              </Button>

              <Button
                v-if="m.status === 'active'"
                size="sm"
                variant="ghost"
                :disabled="isBusy(m.user_id)"
                @click="handleDirectTransfer(m.user_id)"
              >
                <Loader v-if="isBusy(m.user_id)" class="mr-1 h-4 w-4 animate-spin" />
                Make owner
              </Button>

              <Button
                size="sm"
                variant="destructive"
                :disabled="isBusy(m.user_id)"
                @click="handleRemove(m.user_id)"
              >
                <Loader v-if="isBusy(m.user_id)" class="mr-1 h-4 w-4 animate-spin" />
                Remove
              </Button>
            </template>
          </div>
        </div>
        <div v-if="members.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          No members yet.
        </div>
      </div>
    </div>

    <Dialog v-model:open="showTransferDialog">
      <DialogTrigger class="hidden" />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer ownership before leaving</DialogTitle>
          <DialogDescription>
            You're the owner of this group. Pick another member to take over ownership before you
            leave.
          </DialogDescription>
        </DialogHeader>

        <div v-if="transferCandidates.length === 0" class="text-sm text-muted-foreground">
          There are no other active members to transfer ownership to. Approve or add a member first.
        </div>
        <RadioGroup v-else v-model="selectedNewOwner" class="flex flex-col gap-2">
          <div
            v-for="c in transferCandidates"
            :key="c.user_id"
            class="flex items-center gap-2 rounded-md border p-2"
          >
            <RadioGroupItem :id="c.user_id" :value="c.user_id" />
            <Label :for="c.user_id" class="cursor-pointer">
              {{ displayMemberName(c.user_id) }}
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" @click="showTransferDialog = false">Cancel</Button>
          <Button
            :disabled="!selectedNewOwner || transferSubmitting"
            @click="confirmTransferAndLeave"
          >
            <Loader v-if="transferSubmitting" class="mr-1 h-4 w-4 animate-spin" />
            Transfer & leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped></style>
