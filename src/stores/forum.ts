import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post } from '@/api/forum.ts'


export const useForumStore = defineStore('forum', () => {
  const currentPost = ref<Post | null>(null)

  function setCurrentPost(post: Post | null) {
    currentPost.value = post
  }

  return { currentPost, setCurrentPost }
})
