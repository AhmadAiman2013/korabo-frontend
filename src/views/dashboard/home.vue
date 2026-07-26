<script setup lang="ts">
import { Globe, Lock, Users } from '@lucide/vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import CreateGroupDialog from '@/components/CreateGroupDialog.vue'
import { useGroupStore } from '@/stores/group.ts'
import { type Group } from '@/api/group.ts'
import router from '@/router'
import { Badge } from '@/components/ui/badge'

const groupStore = useGroupStore()

function handleCreated(group: Group) {
  groupStore.addGroup(group)
}

function goToGroupDetails(groupId: string) {
  router.push(`/dashboard/groups/${groupId}`)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">Welcome!</h1>

      <div>
        <h2 class="mb-3 text-xl font-semibold">Your Groups</h2>

        <div class="grid gap-4 md:grid-cols-3">
          <template v-if="groupStore.loading">
            <Skeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
          </template>

          <template v-else-if="groupStore.selfGroups.length === 0">
            <div
              class="col-span-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center"
            >
              <Users class="size-8 text-muted-foreground" />
              <p class="font-medium">No groups yet</p>
              <p class="text-sm text-muted-foreground">Create one to get started.</p>
            </div>
          </template>

          <template v-else>
            <Card
              v-for="group in groupStore.selfGroups"
              :key="group.group_id"
              :class="['cursor-pointer transition-colors hover:bg-muted']"
              @click="goToGroupDetails(group.group_id)"
            >
              <CardHeader>
                <CardTitle>{{ group.name }}</CardTitle>
                <Badge :variant="group.group_type === 'private' ? 'outline' : 'default'">
                  <component
                    :is="group.group_type === 'private' ? Lock : Globe"
                    class="mr-1 h-3 w-3"
                  />
                  {{ group.group_type }}
                </Badge>
                <CardDescription>{{ group.description || 'No description' }}</CardDescription>
              </CardHeader>
            </Card>
          </template>
        </div>
      </div>

      <CreateGroupDialog @created="handleCreated" />
    </div>
  </div>
</template>

<style scoped></style>
