export const useSSE = () => {
  const events = ref<any[]>([])
  let eventSource: EventSource | null = null

  const connect = () => {
    if (eventSource) {
      return
    }

    eventSource = new EventSource('/api/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        events.value.push(data)

        // Keep only last 100 events
        if (events.value.length > 100) {
          events.value.shift()
        }
      }
      catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      disconnect()
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        connect()
      }, 5000)
    }
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    events: readonly(events),
    connect,
    disconnect,
  }
}

