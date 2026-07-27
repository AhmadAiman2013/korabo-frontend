<script setup lang="ts">
import type { Post } from '@/api/forum.ts'
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/format-time.ts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Paperclip } from '@lucide/vue'
import definition from '@dicebear/styles/glyphs.json'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'

const props = defineProps<{
  post: Post
}>()

const emit = defineEmits<{
  open: []
}>()

const snippet = computed(() => {
  const text = props.post.body.trim()
  return text.length > 220 ? `${text.slice(0, 220)}…` : text
})

function initials(id: string) {
  return id.slice(0, 2).toUpperCase()
}

// ---- avatar / fallback name ----
const style = new Style(definition)
function formAvatar(authorId: string) {
  const seed = authorId ?? 'user-seed'
  return new DicebearAvatar(style, { seed, size: 128 }).toDataUri()
}
</script>

<template>
  <Card class="cursor-pointer transition-colors hover:bg-muted/40" @click="emit('open')">
    <CardHeader class="flex flex-row items-start gap-3 space-y-0 pb-2">
      <Avatar class="h-8 w-8 shrink-0">
        <AvatarImage :src="formAvatar(post.author_id)" :alt="'avatar'" />
        <AvatarFallback class="text-xs">{{ initials(post.author_id) }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <h3 class="truncate font-semibold leading-tight">{{ post.title }}</h3>
        <p class="text-xs text-muted-foreground">
          {{ post.author_id }} · {{ formatRelativeTime(post.created_at) }}
        </p>
      </div>
    </CardHeader>
    <CardContent class="pb-3">
      <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ snippet }}</p>
      <div
        v-if="post.attachments.length"
        class="mt-2 flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Paperclip class="h-3.5 w-3.5" />
        {{ post.attachments.length }} attachment{{ post.attachments.length > 1 ? 's' : '' }}
      </div>
    </CardContent>
  </Card>
</template>

<style scoped></style>
