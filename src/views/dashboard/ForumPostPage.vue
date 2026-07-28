<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { type Attachment, forumApi, type Post } from '@/api/forum.ts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useProfileStore } from '@/stores/profile.ts'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MoreVertical, Loader2 } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/utils/format-time.ts'
import AttachmentGallery from '@/components/AttachmentGallery.vue'
import { Separator } from '@/components/ui/separator'
import CommentList from '@/components/CommentList.vue'
import definition from '@dicebear/styles/glyphs.json'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import PostComposer from '@/components/PostComposer.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useForumStore } from '@/stores/forum.ts'

const route = useRoute()
const router = useRouter()
const groupId = route.params.groupId as string
const postId = route.params.postId as string

const profileStore = useProfileStore()
const forumStore = useForumStore()

const post = ref<Post | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)

const showEdit = ref(false)
const saving = ref(false)
const confirmingDelete = ref(false)
const deleting = ref(false)

const currentUserId = computed(() => profileStore.selfProfile?.user_id)
const isOwner = computed(() => !!post.value && currentUserId.value === post.value.author_id)

function initials(id: string) {
  return id.slice(0, 2).toUpperCase()
}

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    // The API doesn't expose a get-single-post endpoint, so we pull the group's
    // list and find this post in it. If your backend later adds GET /post/{id},
    // swap this for that direct call.
    const res = await forumApi.listPosts(groupId, { limit: 100 })
    post.value = res.posts.find((p) => p.post_id === postId) ?? null
    forumStore.setCurrentPost(post.value)
    if (!post.value) errorMessage.value = 'This post could not be found.'
  } catch (e) {
    errorMessage.value = 'Could not load this post.'
  } finally {
    loading.value = false
  }
}

async function handleUpdate(payload: { title: string; body: string; attachments: Attachment[] }) {
  if (!post.value) return
  saving.value = true
  try {
    post.value = await forumApi.updatePost(post.value.post_id, payload)
    forumStore.setCurrentPost(post.value)
    showEdit.value = false
  } catch (e) {
    errorMessage.value = 'Could not save your changes.'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!post.value) return
  deleting.value = true
  try {
    await forumApi.deletePost(post.value.post_id)
    router.push({ name: 'dashboard-forum', params: { groupId } })
  } catch (e) {
    errorMessage.value = 'Could not delete this post.'
    deleting.value = false
  }
}

// ---- avatar / fallback name ----
const style = new Style(definition)
function formAvatar(authorId: string) {
  const seed = authorId ?? 'user-seed'
  return new DicebearAvatar(style, { seed, size: 128 }).toDataUri()
}

onMounted(load)
onUnmounted(() => forumStore.setCurrentPost(null))
</script>

<template>
  <div class="mx-auto max-w-2xl w-full space-y-4 p-4">
    <Button
      variant="ghost"
      size="sm"
      class="-ml-2"
      @click="router.push({ name: 'dashboard-forum', params: { groupId } })"
    >
      <ArrowLeft class="mr-1.5 h-4 w-4" /> Back to forum
    </Button>

    <p v-if="errorMessage && !post" class="text-sm text-destructive">{{ errorMessage }}</p>

    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-6 w-2/3" />
      <Skeleton class="h-24 w-full" />
    </div>

    <template v-else-if="post">
      <div class="flex items-start gap-3">
        <Avatar class="h-9 w-9 shrink-0">
          <AvatarImage :src="formAvatar(post.author_id)" :alt="'avatar'" />
          <AvatarFallback class="text-xs">{{ initials(post.author_id) }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h1 class="text-lg font-semibold leading-tight">{{ post.title }}</h1>
            <DropdownMenu v-if="isOwner">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0" aria-label="button">
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="showEdit = true">Edit</DropdownMenuItem>
                <DropdownMenuItem class="text-destructive" @click="confirmingDelete = true"
                  >Delete</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ post.author_id }} · {{ formatRelativeTime(post.created_at) }}
          </p>
        </div>
      </div>

      <p class="whitespace-pre-wrap text-sm">{{ post.body }}</p>
      <AttachmentGallery :attachments="post.attachments" />

      <Separator class="my-2" />

      <CommentList :group-id="groupId" :post-id="post.post_id" />
    </template>

    <Dialog v-model:open="showEdit">
      <DialogTrigger class="hidden" />
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>
        <PostComposer
          v-if="post"
          :group-id="groupId"
          :post="post"
          :submitting="saving"
          @submit="handleUpdate"
          @cancel="showEdit = false"
        />
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="confirmingDelete">
      <AlertDialogTrigger class="hidden" />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription
            >This will also remove its comments. This can't be undone.</AlertDialogDescription
          >
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction :disabled="deleting" @click="handleDelete">
            <Loader2 v-if="deleting" class="mr-2 h-4 w-4 animate-spin" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped></style>
