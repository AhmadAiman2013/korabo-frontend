<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { type Attachment, forumApi, type Post } from '@/api/forum.ts'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import PostCard from '@/components/PostCard.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import PostComposer from '@/components/PostComposer.vue'

const route = useRoute()
const router = useRouter()
const groupId = route.params.groupId as string

const posts = ref<Post[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref<string | null>(null)

const showComposer = ref(false)
const creating = ref(false)

async function loadFirstPage() {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await forumApi.listPosts(groupId)
    posts.value = res.posts
    nextCursor.value = res.next_cursor ?? null
  } catch (e) {
    errorMessage.value = 'Could not load posts for this group.'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const res = await forumApi.listPosts(groupId, { cursor: nextCursor.value })
    posts.value = [...posts.value, ...res.posts]
    nextCursor.value = res.next_cursor ?? null
  } catch (e) {
    errorMessage.value = 'Could not load more posts.'
  } finally {
    loadingMore.value = false
  }
}

async function handleCreate(payload: { title: string; body: string; attachments: Attachment[] }) {
  creating.value = true
  try {
    const created = await forumApi.createPost({ group_id: groupId, ...payload })
    posts.value = [created, ...posts.value]
    showComposer.value = false
  } catch (e) {
    errorMessage.value = 'Could not create the post. Please try again.'
  } finally {
    creating.value = false
  }
}

function openPost(post: Post) {
  router.push({ name: 'dashboard-forum-post', params: { groupId, postId: post.post_id } })
}

onMounted(loadFirstPage)
</script>

<template>
  <div class="mx-auto max-w-2xl w-full space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Forum</h1>
      <Button size="sm" @click="showComposer = true">
        <Plus class="mr-1.5 h-4 w-4" /> New post
      </Button>
    </div>

    <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-28 w-full" />
      <Skeleton class="h-28 w-full" />
      <Skeleton class="h-28 w-full" />
    </div>

    <p v-else-if="!posts.length" class="py-12 text-center text-sm text-muted-foreground">
      No posts yet. Start the conversation.
    </p>

    <div v-else class="space-y-3">
      <PostCard v-for="post in posts" :key="post.post_id" :post="post" @open="openPost(post)" />
    </div>

    <div v-if="nextCursor" class="flex justify-center pt-2">
      <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
        <Loader2 v-if="loadingMore" class="mr-2 h-3.5 w-3.5 animate-spin" />
        Load more
      </Button>
    </div>

    <Dialog v-model:open="showComposer">
      <DialogTrigger class="hidden" />

      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
        </DialogHeader>
        <PostComposer
          :group-id="groupId"
          :submitting="creating"
          @submit="handleCreate"
          @cancel="showComposer = false"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped></style>
