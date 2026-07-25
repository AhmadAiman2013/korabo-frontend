<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGroupStore } from '@/stores/group.ts'
import { storeToRefs } from 'pinia'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Globe, Lock, User2 } from '@lucide/vue'
import router from '@/router'
import { useRoute } from 'vue-router'

const store = useGroupStore()
const route = useRoute()
const { groups, loading } = storeToRefs(store)
const search = ref('')

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value.filter(
    (g) =>
      g.primary_subject.toLowerCase().includes(q) ||
      g.name.toLowerCase().includes(q) ||
      g.subject_tags.some((tag) => tag.toLowerCase().includes(q)),
  )
})

function goToGroupDetails(groupId: string) {
  router.push(`${route.path}/${groupId}`)
}

onMounted(() => {
  store.fetchAllGroups()
})
</script>

<template>
  <div class="content mx-auto max-w-5xl p-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Groups</h1>
      <Input
        v-model="search"
        placeholder="Search by subject, name, or tag..."
        class="max-w-sm"
        aria-label="search"
      />
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="n in 6" :key="n">
        <CardHeader><Skeleton class="h-5 w-2/3 mb-2" /><Skeleton class="h-4 w-1/2" /></CardHeader>
        <CardContent
          ><Skeleton class="h-4 w-full mb-1" /><Skeleton class="h-4 w-4/5"
        /></CardContent>
      </Card>
    </div>

    <div v-else class="flex flex-wrap gap-4">
      <Card
        v-for="group in filteredGroups"
        :key="group.group_id"
        class="hover:shadow-md transition-shadow cursor-pointer flex-1 basis-72 max-w-md"
        @click="goToGroupDetails(group.group_id)"
      >
        <CardHeader>
          <CardTitle>{{ group.name }}</CardTitle>
          <Badge :variant="group.group_type === 'private' ? 'outline' : 'default'">
            <component :is="group.group_type === 'private' ? Lock : Globe" class="mr-1 h-3 w-3" />
            {{ group.group_type }}
          </Badge>
          <CardDescription>{{ group.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-1">
            <Badge variant="secondary">{{ group.primary_subject }}</Badge>
            <Badge v-for="tag in group.subject_tags" :key="tag" variant="outline">{{ tag }}</Badge>
          </div>
        </CardContent>
        <CardFooter class="text-sm text-muted-foreground flex items-center gap-1">
          <User2 class="h-4 w-4" /> {{ group.member_count }} members
        </CardFooter>
      </Card>

      <p v-if="!filteredGroups.length" class="w-full text-center text-muted-foreground py-10">
        No groups match "{{ search }}".
      </p>
    </div>
  </div>
</template>

<style scoped></style>
