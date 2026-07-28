<script setup lang="ts">
import type { Attachment as AttachmentModel } from '@/api/forum.ts'
import { computed, ref } from 'vue'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import { FileText } from '@lucide/vue'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

const props = defineProps<{
  attachments: AttachmentModel[]
}>()

const images = computed(() => props.attachments.filter((a) => a.content_type.startsWith('image/')))
const files = computed(() => props.attachments.filter((a) => !a.content_type.startsWith('image/')))

const lightboxImage = ref<AttachmentModel | null>(null)

function fileName(a: AttachmentModel) {
  const raw = a.key.split('/').pop() ?? ''
  // strip the leading "{uuid}-" prefix your backend adds
  return raw.replace(/^[0-9a-f-]{36}-/, '')
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
          <button
            type="button"
            :aria-label="`View ${fileName(img)}`"
            @click="lightboxImage = img"
          />
        </AttachmentTrigger>
      </Attachment>
    </template>

    <template v-for="f in files" :key="f.key">
      <Attachment class="w-64">
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{{ fileName(f) }}</AttachmentTitle>
          <AttachmentDescription>{{ formatBytes(f.size_bytes) }}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger as-child>
          <a :href="f.url ?? undefined" rel="noreferrer" :aria-label="`Download ${fileName(f)}`" />
        </AttachmentTrigger>
      </Attachment>
    </template>
  </AttachmentGroup>

  <Dialog :open="!!lightboxImage" @update:open="(v) => !v && (lightboxImage = null)">
    <DialogTrigger class="hidden"/>
    <DialogContent class="max-w-3xl p-0">
      <img
        v-if="lightboxImage"
        :src="lightboxImage.url ?? undefined"
        :alt="fileName(lightboxImage)"
        class="w-full h-auto rounded-md"
      />
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
