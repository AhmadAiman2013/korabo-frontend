<script setup lang="ts">
import type { Attachment, Comment as CommentModel } from '@/api/forum.ts'
import { computed, ref } from 'vue'
import { useProfileStore } from '@/stores/profile.ts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/utils/format-time.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical } from '@lucide/vue'
import CommentComposer from '@/components/CommentComposer.vue'
import AttachmentGallery from '@/components/AttachmentGallery.vue'
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
import definition from '@dicebear/styles/glyphs.json'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'

const props = defineProps<{
  groupId: string
  comment: CommentModel
  saving?: boolean
}>()

const emit = defineEmits<{
  update: [{ body: string; attachments: Attachment[] }]
  delete: []
}>()

const profileStore = useProfileStore()

const currentUserId = computed(() => profileStore.selfProfile?.user_id)
const isOwner = computed(() => currentUserId.value === props.comment.author_id)
const isEditing = ref(false)
const confirmingDelete = ref(false)

function initials(id: string) {
  return id.slice(0, 2).toUpperCase()
}

function handleUpdate(payload: { body: string; attachments: Attachment[] }) {
  emit('update', payload)
  isEditing.value = false
}

// ---- avatar / fallback name ----
const style = new Style(definition)
function formAvatar(authorId: string) {
  const seed = authorId ?? 'user-seed'
  return new DicebearAvatar(style, { seed, size: 128 }).toDataUri()
}
</script>

<template>
  <div class="flex gap-3 py-3">
    <Avatar class="h-8 w-8 shrink-0">
      <AvatarImage :src="formAvatar(comment.author_id)" :alt="'avatar'" />
      <AvatarFallback class="text-xs">{{ initials(comment.author_id) }}</AvatarFallback>
    </Avatar>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{{ comment.author_id }}</span>
        <span class="text-xs text-muted-foreground">{{
          formatRelativeTime(comment.created_at)
        }}</span>

        <DropdownMenu v-if="isOwner">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="ml-auto h-6 w-6" aria-label="Open menu">
              <MoreVertical class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="isEditing = true">Edit</DropdownMenuItem>
            <DropdownMenuItem class="text-destructive" @click="confirmingDelete = true"
              >Delete</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommentComposer
        v-if="isEditing"
        :group-id="groupId"
        :comment="comment"
        :submitting="saving"
        class="mt-2"
        @submit="handleUpdate"
        @cancel="isEditing = false"
      />
      <template v-else>
        <p class="mt-0.5 whitespace-pre-wrap text-sm">{{ comment.body }}</p>
        <AttachmentGallery :attachments="comment.attachments" />
      </template>
    </div>

    <AlertDialog v-model:open="confirmingDelete">
      <AlertDialogTrigger class="hidden" />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="emit('delete')">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped></style>
