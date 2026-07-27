<script setup lang="ts">
import type { Attachment, Post } from '@/api/forum.ts'
import { computed, ref } from 'vue'
import { useAttachmentUpload } from '@/composables/useAttachmentUpload.ts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AttachmentPicker from '@/components/AttachmentPicker.vue'
import { Textarea as Txt } from '@/components/ui/textarea'
import { FileText, Loader2, X } from '@lucide/vue'

const props = defineProps<{
  groupId: string
  /** Pass an existing post to edit it; omit to create a new one. */
  post?: Post
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ title: string; body: string; attachments: Attachment[] }]
  cancel: []
}>()

const title = ref(props.post?.title ?? '')
const body = ref(props.post?.body ?? '')
// Attachments already saved on the post (edit mode) - just references, nothing to (re)upload.
const existingAttachments = ref<Attachment[]>(props.post ? [...props.post.attachments] : [])

const { items, addFiles, remove, retryOne, uploadAll, isUploading, readyAttachments, reset } =
  useAttachmentUpload(() => props.groupId)

const canSubmit = computed(
  () =>
    title.value.trim().length > 0 &&
    body.value.trim().length > 0 &&
    !isUploading.value &&
    !props.submitting,
)

function existingFileName(a: Attachment) {
  const parts = a.key.split('/')
  return parts[parts.length - 1]
}

function removeExisting(key: string) {
  existingAttachments.value = existingAttachments.value.filter((a) => a.key !== key)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  const ok = await uploadAll()
  if (!ok) return // errors are shown inline per-file; let the user retry or remove them

  emit('submit', {
    title: title.value.trim(),
    body: body.value.trim(),
    attachments: [...existingAttachments.value, ...readyAttachments.value],
  })
}

function handleCancel() {
  reset()
  emit('cancel')
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="space-y-1.5">
      <label for="post-title" class="text-sm font-medium">Title</label>
      <Input
        id="post-title"
        v-model="title"
        placeholder="What's this post about?"
        maxlength="200"
        required
        aria-label="Post title"
      />
    </div>

    <div class="space-y-1.5">
      <label for="post-body" class="text-sm font-medium">Body</label>
      <Txt
        id="post-body"
        v-model="body"
        placeholder="Write something..."
        rows="6"
        required
        aria-label="Post body"
      />
    </div>

    <div v-if="existingAttachments.length" class="space-y-1.5">
      <p class="text-sm font-medium">Attached</p>
      <ul class="space-y-1.5">
        <li
          v-for="a in existingAttachments"
          :key="a.key"
          class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <FileText class="h-4 w-4 shrink-0 text-muted-foreground" />
          <span class="min-w-0 flex-1 truncate">{{ existingFileName(a) }}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="h-6 w-6 shrink-0"
            @click="removeExisting(a.key)"
            aria-label="Remove attachment"
          >
            <X class="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </div>

    <div class="space-y-1.5">
      <p class="text-sm font-medium">Add attachments</p>
      <AttachmentPicker
        :items="items"
        :disabled="submitting"
        @files="addFiles"
        @remove="remove"
        @retry="retryOne"
      />
    </div>

    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" :disabled="submitting" @click="handleCancel"
        >Cancel</Button
      >
      <Button type="submit" :disabled="!canSubmit">
        <Loader2 v-if="submitting || isUploading" class="mr-2 h-4 w-4 animate-spin" />
        {{ post ? 'Save changes' : 'Post' }}
      </Button>
    </div>
  </form>
</template>

<style scoped></style>
