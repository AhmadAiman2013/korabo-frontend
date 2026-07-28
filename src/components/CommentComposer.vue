<script setup lang="ts">
import type { Attachment, Comment as CommentModel } from '@/api/forum.ts'
import { computed, ref } from 'vue'
import { useAttachmentUpload } from '@/composables/useAttachmentUpload.ts'
import { Button } from '@/components/ui/button'
import { Textarea as Txt } from '@/components/ui/textarea'
import AttachmentPicker from '@/components/AttachmentPicker.vue'
import { Loader2 } from '@lucide/vue'

const props = defineProps<{
  groupId: string
  comment?: CommentModel
  submitting?: boolean
  autofocus?: boolean
}>()

const emit = defineEmits<{
  submit: [{ body: string; attachments: Attachment[] }]
  cancel: []
}>()

const body = ref(props.comment?.body ?? '')
const existingAttachments = ref<Attachment[]>(props.comment ? [...props.comment.attachments] : [])
const showAttachments = ref(existingAttachments.value.length > 0)

const { items, addFiles, remove, retryOne, uploadAll, isUploading, readyAttachments, reset } =
  useAttachmentUpload(() => props.groupId)

const canSubmit = computed(
  () => body.value.trim().length > 0 && !isUploading.value && !props.submitting,
)

function removeExisting(key: string) {
  existingAttachments.value = existingAttachments.value.filter((a) => a.key !== key)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  const ok = await uploadAll()
  if (!ok) return

  emit('submit', {
    body: body.value.trim(),
    attachments: [...existingAttachments.value, ...readyAttachments.value],
  })
  body.value = ''
  reset()
}

function handleCancel() {
  reset()
  emit('cancel')
}
</script>

<template>
  <form class="space-y-2" @submit.prevent="handleSubmit">
    <Txt
      v-model="body"
      :autofocus="autofocus"
      placeholder="Write a comment..."
      rows="3"
      required
      aria-label="Comment Composer"
    />

    <div v-if="existingAttachments.length" class="flex flex-wrap gap-2">
      <span
        v-for="a in existingAttachments"
        :key="a.key"
        class="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
      >
        {{ a.key.split('/').pop() }}
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground"
          @click="removeExisting(a.key)"
        >
          &times;
        </button>
      </span>
    </div>

    <AttachmentPicker
      v-if="showAttachments"
      :items="items"
      :disabled="submitting"
      @files="addFiles"
      @remove="remove"
      @retry="retryOne"
    />

    <div class="flex items-center justify-between">
      <button
        v-if="!showAttachments"
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground hover:underline"
        @click="showAttachments = true"
      >
        + Add attachment
      </button>
      <span v-else />

      <div class="flex gap-2">
        <Button
          v-if="comment"
          type="button"
          variant="outline"
          size="sm"
          :disabled="submitting"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" :disabled="!canSubmit">
          <Loader2 v-if="submitting || isUploading" class="mr-2 h-3.5 w-3.5 animate-spin" />
          {{ comment ? 'Save' : 'Comment' }}
        </Button>
      </div>
    </div>
  </form>
</template>

<style scoped></style>
