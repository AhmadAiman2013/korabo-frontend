<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useGroupStore } from '@/stores/group.ts'
import { computed, onMounted, ref } from 'vue'
import { getGroup, type GroupMember, listMembers } from '@/api/group.ts'
import { Lock, Globe, Users, Tags } from '@lucide/vue'

import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useProfileStore } from '@/stores/profile.ts'
import { getUsersProfile } from '@/api/user.ts'
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'

const route = useRoute()
const groupStore = useGroupStore()

const groupId = computed(() => route.params.groupId as string)
const loading = ref(true)
const error = ref<string | null>(null)
const members = ref<GroupMember[]>([])
const memberCount = ref(0)
const isOwner = ref(false)
const profileStore = useProfileStore()
const forbidden = ref(false)

async function loadGroup() {
  const group = await getGroup(groupId.value)
  groupStore.selectGroup(group)
}

async function loadMembers() {
  const res = await listMembers(groupId.value)
  members.value = res.members
  memberCount.value = res.count
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
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-4 p-6">
    <Skeleton class="h-8 w-64" />
    <Skeleton class="h-4 w-96" />
    <Skeleton class="h-40 w-full" />
  </div>

  <div v-else-if="error || !groupStore.currentGroup" class="p-6 text-destructive">
    {{ error || 'Group not found.' }}
  </div>

  <div v-else class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
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
        <span>{{ memberCount }} member{{ memberCount === 1 ? '' : 's' }}</span>
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
          <span>
            {{ displayMemberName(m.user_id) }}
          </span>

          <div class="flex items-center gap-2">
            <Badge v-if="m.status === 'pending'" variant="outline"> pending </Badge>

            <Badge :variant="m.role === 'owner' ? 'default' : 'secondary'">
              {{ m.role }}
            </Badge>
          </div>
        </div>
        <div v-if="members.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          No members yet.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
