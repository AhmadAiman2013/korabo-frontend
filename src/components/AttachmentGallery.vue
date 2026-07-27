<script setup lang="ts">
import type { Attachment as AttachmentModel } from '@/api/forum.ts'
import { computed } from 'vue'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import  {FileTextIcon } from '@lucide/vue'

const props = defineProps<{
  attachments: AttachmentModel[]
}>()

const images = computed(() => props.attachments.filter((a) => a.content_type.startsWith('image/')))
const files = computed(() => props.attachments.filter((a) => !a.content_type.startsWith('image/')))

function fileName(a: AttachmentModel) {
  const parts = a.key.split('/')
  return parts[parts.length - 1]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <AttachmentGroup v-if="attachments.length" class="mt-3">
    <template v-for="img in images" :key="img.key">
      <Attachment orientation="vertical" class="w-40">
        <AttachmentMedia variant="image">
          <img :src="img.url ?? undefined" :alt="fileName(img)" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{{ fileName(img) }}</AttachmentTitle>
          <AttachmentDescription>{{ formatBytes(img.size_bytes) }}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger as-child>
          <a
            :href="img.url ?? undefined"
            target="_blank"
            rel="noreferrer"
            :aria-label="`Open ${fileName(img)}`"
          />
        </AttachmentTrigger>
      </Attachment>
    </template>

    <template v-for="f in files" :key="f.key">
      <Attachment class="w-64">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{{ fileName(f) }}</AttachmentTitle>
          <AttachmentDescription>{{ formatBytes(f.size_bytes) }}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger as-child>
          <a
            :href="f.url ?? undefined"
            target="_blank"
            rel="noreferrer"
            :aria-label="`Download ${fileName(f)}`"
          />
        </AttachmentTrigger>
      </Attachment>
    </template>
  </AttachmentGroup>
</template>

<style scoped></style>
