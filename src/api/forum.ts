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
  file_name: string
}

interface Envelope<T> {
  body: T
}

export const forumApi = {
  // ---- Posts ----
  async listPosts(groupId: string, params?: { cursor?: string; limit?: number }) {
    const r = await http<Envelope<ListPostsResponse>>('/forum/posts', {
      method: 'GET',
      query: { group_id: groupId, cursor: params?.cursor, limit: params?.limit },
    })
    return r.body
  },

  async createPost(payload: CreatePostRequest) {
    const r = await http<Envelope<Post>>('/forum/posts', {
      method: 'POST',
      body: payload,
    })
    return r.body
  },

  async updatePost(postId: string, payload: UpdatePostRequest) {
    const r = await http<Envelope<Post>>(`/forum/posts/${postId}`, {
      method: 'PUT',
      body: payload,
    })
    return r.body
  },

  deletePost(postId: string) {
    return http<void>(`/forum/posts/${postId}`, { method: 'DELETE' })
  },

  // ---- Comments ----
  async listComments(
    postId: string,
    groupId: string,
    params?: { cursor?: string; limit?: number },
  ) {
    const r = await http<Envelope<ListCommentsResponse>>(`/forum/posts/${postId}/comments`, {
      method: 'GET',
      query: { group_id: groupId, cursor: params?.cursor, limit: params?.limit },
    })
    return r.body
  },

  async createComment(postId: string, payload: CreateCommentRequest) {
    const r = await http<Envelope<Comment>>(`/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: payload,
    })
    return r.body
  },

  async updateComment(postId: string, commentSk: string, payload: UpdateCommentRequest) {
    const { createdAt, commentId } = parseCommentSk(commentSk)
    const r = await http<Envelope<Comment>>(
      `/forum/posts/${postId}/comments}`,
      {
        method: 'PUT',
        body: payload,
        query: { comment_id: commentId, created_at: createdAt },
      },
    )
    return r.body
  },

  async deleteComment(postId: string, commentSk: string) {
    const { createdAt, commentId } = parseCommentSk(commentSk)
    return http<void>(`/forum/posts/${postId}/comments}`, {
      method: 'DELETE',
      query: { comment_id: commentId, created_at: createdAt },
    })
  },

  // ---- Uploads ----
  async getPresignedUpload(payload: PresignUploadRequest) {
    const r = await http<Envelope<PresignedUpload>>('/forum/posts/upload', {
      method: 'POST',
      body: payload,
    })
    return r.body
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

  const contentDisposition = file.type.startsWith('image/')
    ? undefined
    : `attachment; filename="${presigned.file_name}"`

  await putToStorage(presigned.upload_url, file, contentDisposition, onProgress)

  return {
    key: presigned.key,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  }
}

// XHR (not fetch) so we can report real upload progress for a progress bar.
function putToStorage(
  uploadUrl: string,
  file: File,
  contentDisposition: string | undefined,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    if (contentDisposition) {
      xhr.setRequestHeader('Content-Disposition', contentDisposition)
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}

function parseCommentSk(sk: string): { createdAt: string; commentId: string } {
  const parts = sk.split('#')
  if (parts.length !== 3 || parts[0] !== 'COMMENT' || !parts[1] || !parts[2]) {
    throw new Error(`Invalid comment sk format: ${sk}`)
  }
  return { createdAt: parts[1], commentId: parts[2] }
}
