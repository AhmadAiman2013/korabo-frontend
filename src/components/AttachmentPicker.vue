<script setup lang="ts">
import { MAX_ATTACHMENT_BYTES, type PendingAttachment } from '@/composables/useAttachmentUpload.ts'
import { useTemplateRef } from 'vue'
import { useDropZone } from '@vueuse/core'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { FileTextIcon, RefreshCwIcon, XIcon, Paperclip } from '@lucide/vue'

const props = defineProps<{
  items: PendingAttachment[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  files: [FileList | File[]]
  remove: [string]
  retry: [string]
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const dropZoneRef = useTemplateRef<HTMLDivElement>('dropZoneRef')

const { isOverDropZone } = useDropZone(dropZoneRef, {
  multiple: true,
  onDrop: (files) => {
    if (props.disabled || !files?.length) return
    emit('files', files)
  },
})

function openPicker() {
  if (!props.disabled) inputRef.value?.click()
}

function onInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) emit('files', target.files)
  target.value = '' // allow re-selecting the same file later
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function stateFor(item: PendingAttachment) {
  if (item.status === 'pending') return 'idle'
  return item.status // 'uploading' | 'done' | 'error' line up with Attachment's states
}

function descriptionFor(item: PendingAttachment) {
  if (item.status === 'uploading') return `Uploading · ${item.progress}%`
  if (item.status === 'error') return item.error ?? 'Upload failed'
  if (item.status === 'done') return `Uploaded · ${formatBytes(item.file.size)}`
  return `Ready to upload · ${formatBytes(item.file.size)}`
}
</script>

<template>
  <div class="space-y-2">
    <div
      ref="dropZoneRef"
      class="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors"
      :class="[
        isOverDropZone ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-muted/40',
      ]"
      @click="openPicker"
    >
      <Paperclip class="h-5 w-5 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        <span class="font-medium text-foreground">Click to attach</span> or drag files here
      </p>
      <p class="text-xs text-muted-foreground">
        Images or files, up to {{ formatBytes(MAX_ATTACHMENT_BYTES) }} each
      </p>
      <input
        ref="inputRef"
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        class="hidden"
        :disabled="disabled"
        @change="onInputChange"
      />
    </div>

    <div v-if="items.length" class="flex flex-col gap-2">
      <Attachment v-for="item in items" :key="item.id" :state="stateFor(item)" class="w-full">
        <AttachmentMedia v-if="item.previewUrl" variant="image">
          <img :src="item.previewUrl" :alt="item.file.name" />
        </AttachmentMedia>
        <AttachmentMedia v-else>
          <FileTextIcon />
        </AttachmentMedia>

        <AttachmentContent>
          <AttachmentTitle>{{ item.file.name }}</AttachmentTitle>
          <AttachmentDescription>{{ descriptionFor(item) }}</AttachmentDescription>
        </AttachmentContent>

        <AttachmentActions>
          <AttachmentAction
            v-if="item.status === 'error' && item.file.size <= MAX_ATTACHMENT_BYTES"
            aria-label="Retry upload"
            @click="emit('retry', item.id)"
          >
            <RefreshCwIcon />
          </AttachmentAction>
          <AttachmentAction
            v-if="item.status !== 'uploading'"
            :aria-label="`Remove ${item.file.name}`"
            @click="emit('remove', item.id)"
          >
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  </div>
</template>

<style scoped></style>
