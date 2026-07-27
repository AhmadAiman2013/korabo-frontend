import { http } from '@/api/http.ts'

export interface Attachment {
  key: string
  content_type: string
  size_bytes: number
  url?: string | null
}

export interface Post {
  post_id: string
  group_id: string
  author_id: string
  title: string
  body: string
  attachments: Attachment[]
  created_at: string
  deleted_at?: string | null
}

export interface Comment {
  comment_id: string
  sk: string // "COMMENT#{created_at}#{comment_id}" - needed verbatim for PUT/DELETE
  post_id: string
  author_id: string
  body: string
  attachments: Attachment[]
  created_at: string
}

export interface ListPostsResponse {
  group_id: string
  posts: Post[]
  next_cursor?: string | null
}

export interface ListCommentsResponse {
  post_id: string
  comments: Comment[]
  next_cursor?: string | null
}

export interface CreatePostRequest {
  group_id: string
  title: string
  body: string
  attachments: Attachment[]
}

export interface UpdatePostRequest {
  title: string
  body: string
  attachments: Attachment[]
}

export interface CreateCommentRequest {
  body: string
  attachments: Attachment[]
}

export interface UpdateCommentRequest {
  body: string
  attachments: Attachment[]
}

export interface PresignUploadRequest {
  group_id: string
  file_name: string
  content_type: string
  content_length: number
}

export interface PresignedUpload {
  upload_url: string
  key: string
  expires_in_secs: number
}

interface Envelope<T> {
  body: T
}

export const forumApi = {
  // ---- Posts ----
  listPosts(groupId: string, params?: { cursor?: string; limit?: number }) {
    return http<Envelope<ListPostsResponse>>('/post', {
      method: 'GET',
      query: { group_id: groupId, cursor: params?.cursor, limit: params?.limit },
    }).then((r) => r.body)
  },

  createPost(payload: CreatePostRequest) {
    return http<Envelope<Post>>('/post', {
      method: 'POST',
      body: payload,
    }).then((r) => r.body)
  },

  updatePost(postId: string, payload: UpdatePostRequest) {
    return http<Envelope<Post>>(`/post/${postId}`, {
      method: 'PUT',
      body: payload,
    }).then((r) => r.body)
  },

  deletePost(postId: string) {
    return http<void>(`/posts/${postId}`, { method: 'DELETE' })
  },

  // ---- Comments ----
  listComments(postId: string, groupId: string, params?: { cursor?: string; limit?: number }) {
    return http<Envelope<ListCommentsResponse>>(`/posts/${postId}/comments`, {
      method: 'GET',
      query: { group_id: groupId, cursor: params?.cursor, limit: params?.limit },
    }).then((r) => r.body)
  },

  createComment(postId: string, payload: CreateCommentRequest) {
    return http<Envelope<Comment>>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: payload,
    }).then((r) => r.body)
  },

  updateComment(postId: string, commentSk: string, payload: UpdateCommentRequest) {
    return http<Envelope<Comment>>(`/posts/${postId}/comments/${encodeURIComponent(commentSk)}`, {
      method: 'PUT',
      body: payload,
    }).then((r) => r.body)
  },

  deleteComment(postId: string, commentSk: string) {
    return http<void>(`/posts/${postId}/comments/${encodeURIComponent(commentSk)}`, {
      method: 'DELETE',
    })
  },

  // ---- Uploads ----
  getPresignedUpload(payload: PresignUploadRequest) {
    return http<Envelope<PresignedUpload>>('/post/upload', {
      method: 'POST',
      body: payload,
    }).then((r) => r.body)
  },
}

/**
 * Presigns + uploads a single file, returning the Attachment to include on the
 * post/comment payload (just { key, content_type, size_bytes } - the backend
 * fills in `url` on read).
 */
export async function uploadAttachment(
  file: File,
  groupId: string,
  onProgress?: (pct: number) => void,
): Promise<Attachment> {
  const presigned = await forumApi.getPresignedUpload({
    group_id: groupId,
    file_name: file.name,
    content_type: file.type || 'application/octet-stream',
    content_length: file.size,
  })

  await putToStorage(presigned.upload_url, file, onProgress)

  return {
    key: presigned.key,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  }
}

// XHR (not fetch) so we can report real upload progress for a progress bar.
function putToStorage(uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}
