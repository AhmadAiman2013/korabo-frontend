import { http } from '@/api/http.ts'

export interface ChatMessageRecord {
  group_id: string
  sort_key?: string
  message_id: string
  sender_id: string
  content: string
  message_type?: string
  created_at: string
  pending?: boolean // client-only, never comes from the server
}

export interface ChatHistoryRequest {
  group_id: string
  cursor?: string
  limit?: number
}

export interface ChatHistoryResponse {
  group_id: string
  messages: ChatMessageRecord[]
  next_cursor: string | null
}

export async function getChatHistory(payload: ChatHistoryRequest): Promise<ChatHistoryResponse> {
  const res = await http<{ body: ChatHistoryResponse }>('/chat/chat-history', {
    method: 'POST',
    body: payload,
  })
  return res.body
}
