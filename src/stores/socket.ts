import { defineStore } from 'pinia'
import { useWebSocket } from '@vueuse/core'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface WsMessage {
  type: string
  payload?: any
}
type Listener = (msg: WsMessage) => void

export const useSocketStore = defineStore('socket', () => {
  const auth = useAuthStore()

  // computed = reconnects always pick up the *current* token
  const wsUrl = computed(() => {
    const base = import.meta.env.VITE_WS_URL
    return `${base}/prodWS?token=${encodeURIComponent(auth.token ?? '')}`
  })

  const listeners = new Map<string, Set<Listener>>()
  const wildcard = new Set<Listener>()

  function emit(msg: WsMessage) {
    listeners.get(msg.type)?.forEach((cb) => cb(msg))
    wildcard.forEach((cb) => cb(msg))
  }

  function on(type: string, cb: Listener) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(cb)
    return () => listeners.get(type)?.delete(cb)
  }

  function onAny(cb: Listener) {
    wildcard.add(cb)
    return () => wildcard.delete(cb)
  }

  const { status, data, send, open, close } = useWebSocket(wsUrl, {
    immediate: false,
    autoReconnect: {
      retries: -1,
      delay: 2000,
      onFailed: () => console.error('WS: gave up reconnecting'),
    },

    heartbeat: {
      message: JSON.stringify({ action: 'ping' }),
      interval: 30000,
      pongTimeout: 10000,
    },
    onConnected: () => console.log('[ws] connected'),
    onDisconnected: (_ws, e) => console.log('[ws] closed', e?.code, e?.reason),
    onError: (_ws, e) => console.error('[ws] error', e),
    onMessage: (_ws, event) => {
      try {
        const raw = JSON.parse(event.data)

        if (raw.ack) {
          emit({ type: `ack.${raw.ack.action}`, payload: raw.ack })
          return
        }

        const [type] = Object.keys(raw)
        if (type) emit({ type, payload: raw[type] })
      } catch {
        console.warn('[ws] non-JSON message', event.data)
      }
    },
  })

  function connect() {
    if (!auth.token) return console.warn('[ws] no token yet, skipping connect')
    open()
  }
  function disconnect() {
    close()
  }

  function sendJson(payload: Record<string, any>) {
    if (status.value !== 'OPEN') {
      return
    }
    send(JSON.stringify(payload))
  }

  function joinGroup(groupId: string) {
    sendJson({ action: 'chat.join', group_id: groupId })
  }

  function leaveGroup(groupId: string) {
    sendJson({ action: 'chat.leave', group_id: groupId })
  }

  function sendMessage(groupId: string, content: string) {
    sendJson({ action: 'chat.send', group_id: groupId, content })
  }

  function requestUnreadIds(groupId: string) {
    sendJson({ action: 'chat.history', group_id: groupId })
  }

  function markSeen(groupId: string) {
    sendJson({ action: 'chat.mark-seen', group_id: groupId })
  }

  function requestOnlineUsers(groupId: string) {
    sendJson({ action: 'chat.online', group_id: groupId })
  }

  return {
    status,
    data,
    connect,
    disconnect,
    send: sendJson,
    joinGroup,
    leaveGroup,
    sendMessage,
    requestUnreadIds,
    markSeen,
    on,
    onAny,
    requestOnlineUsers
  }
})
