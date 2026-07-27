import { type Attachment, uploadAttachment } from '@/api/forum.ts'
import { computed, ref } from 'vue'

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024 // 2MB, per spec
export const MAX_ATTACHMENTS = 6

export interface PendingAttachment {
  id: string
  file: File
  previewUrl: string | null // object URL, only set for images
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error: string | null
  attachment: Attachment | null
}


function isImage(file: File) {
  return file.type.startsWith('image/')
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Manages the "attach files to a post/comment" flow:
 * pick -> validate size -> preview -> upload to presigned URL -> collect Attachment[]
 */
export function useAttachmentUpload(groupId: () => string) {
  const items = ref<PendingAttachment[]>([])

  const isUploading = computed(() => items.value.some((i) => i.status === 'uploading'))
  const hasErrors = computed(() => items.value.some((i) => i.status === 'error'))
  const readyAttachments = computed<Attachment[]>(() =>
    items.value.filter((i) => i.status === 'done' && i.attachment).map((i) => i.attachment as Attachment),
  )

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    for (const file of files) {
      if (items.value.length >= MAX_ATTACHMENTS) {
        break
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        items.value.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: null,
          progress: 0,
          status: 'error',
          error: `${file.name} is ${formatBytes(file.size)} — max is ${formatBytes(MAX_ATTACHMENT_BYTES)}`,
          attachment: null,
        })
        continue
      }
      items.value.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
        progress: 0,
        status: 'pending',
        error: null,
        attachment: null,
      })
    }
  }

  function remove(id: string) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const removed = items.value.splice(idx, 1)[0]
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
  }

  function reset() {
    items.value.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl))
    items.value = []
  }

  /** Uploads every "pending" item. Safe to call again to retry only the failed ones. */
  async function uploadAll() {
    const toUpload = items.value.filter((i) => i.status === 'pending' || i.status === 'error')
    await Promise.all(
      toUpload.map(async (item: PendingAttachment) => {
        if (item.error?.startsWith(item.file.name) && item.file.size > MAX_ATTACHMENT_BYTES) {
          return // oversized files never get retried, they must be removed
        }
        item.status = 'uploading'
        item.error = null
        item.progress = 0
        try {
          item.attachment = await uploadAttachment(item.file, groupId(), (pct) => {
            item.progress = pct
          })
          item.status = 'done'
        } catch (e) {
          item.status = 'error'
          item.error = e instanceof Error ? e.message : 'Upload failed'
        }
      }),
    )
    return !items.value.some((i) => i.status === 'error')
  }

  async function retryOne(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (!item || item.file.size > MAX_ATTACHMENT_BYTES) return
    item.status = 'uploading'
    item.error = null
    item.progress = 0
    try {
      item.attachment = await uploadAttachment(item.file, groupId(), (pct) => {
        item.progress = pct
      })
      item.status = 'done'
    } catch (e) {
      item.status = 'error'
      item.error = e instanceof Error ? e.message : 'Upload failed'
    }
  }

  return {
    items,
    isUploading,
    hasErrors,
    readyAttachments,
    addFiles,
    remove,
    reset,
    uploadAll,
    retryOne,
    formatBytes,
    MAX_ATTACHMENT_BYTES,
  }
}

