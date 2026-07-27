<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { type Attachment, type Comment as CommentModel, forumApi } from '@/api/forum.ts'
import CommentItem from '@/components/CommentItem.vue'
import { Skeleton } from '@/components/ui/skeleton'
import CommentComposer from '@/components/CommentComposer.vue'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@lucide/vue'

const props = defineProps<{
  groupId: string
  postId: string
}>()

const comments = ref<CommentModel[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const posting = ref(false)
const savingCommentSk = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

async function loadFirstPage() {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await forumApi.listComments(props.postId, props.groupId)
    comments.value = res.comments
    nextCursor.value = res.next_cursor ?? null
  } catch (e) {
    errorMessage.value = 'Could not load comments.'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const res = await forumApi.listComments(props.postId, props.groupId, {
      cursor: nextCursor.value,
    })
    comments.value = [...comments.value, ...res.comments]
    nextCursor.value = res.next_cursor ?? null
  } catch (e) {
    errorMessage.value = 'Could not load more comments.'
  } finally {
    loadingMore.value = false
  }
}

async function handleCreate(payload: { body: string; attachments: Attachment[] }) {
  posting.value = true
  try {
    const created = await forumApi.createComment(props.postId, payload)
    comments.value = [...comments.value, created]
  } catch (e) {
    errorMessage.value = 'Could not post your comment. Please try again.'
  } finally {
    posting.value = false
  }
}

async function handleUpdate(
  comment: CommentModel,
  payload: { body: string; attachments: Attachment[] },
) {
  savingCommentSk.value = comment.sk
  try {
    const updated = await forumApi.updateComment(props.postId, comment.sk, payload)
    comments.value = comments.value.map((c) => (c.sk === comment.sk ? updated : c))
  } catch (e) {
    errorMessage.value = 'Could not save your changes.'
  } finally {
    savingCommentSk.value = null
  }
}

async function handleDelete(comment: CommentModel) {
  const previous = comments.value
  comments.value = comments.value.filter((c) => c.sk !== comment.sk) // optimistic
  try {
    await forumApi.deleteComment(props.postId, comment.sk)
  } catch (e) {
    comments.value = previous
    errorMessage.value = 'Could not delete that comment.'
  }
}

onMounted(loadFirstPage)
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-sm font-semibold text-muted-foreground">
      Comments<span v-if="!loading"> ({{ comments.length }})</span>
    </h2>

    <CommentComposer :group-id="groupId" :submitting="posting" @submit="handleCreate" />

    <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
    </div>

    <p v-else-if="!comments.length" class="py-6 text-center text-sm text-muted-foreground">
      No comments yet — be the first to say something.
    </p>

    <div v-else class="divide-y">
      <CommentItem
        v-for="comment in comments"
        :key="comment.sk"
        :group-id="groupId"
        :comment="comment"
        :saving="savingCommentSk === comment.sk"
        @update="(payload) => handleUpdate(comment, payload)"
        @delete="handleDelete(comment)"
      />
    </div>

    <div v-if="nextCursor" class="flex justify-center">
      <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
        <Loader2 v-if="loadingMore" class="mr-2 h-3.5 w-3.5 animate-spin" />
        Load more comments
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
