import { onMounted, onUnmounted } from 'vue'
import { useSocketStore } from '@/stores/socket'

export function useSocketEvent(type: string, handler: (msg: any) => void) {
  const socket = useSocketStore()
  let off: () => void
  onMounted(() => {
    off = socket.on(type, handler)
  })
  onUnmounted(() => off?.())
}
