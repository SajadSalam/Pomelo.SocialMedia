import { sseEmitter } from '../../server/utils/events'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // Create a stream
  const stream = createEventStream(event)

  // Send initial connection message
  await stream.push(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }))

  // Setup event listeners
  const publicationUpdateHandler = (data: any) => {
    stream.push(JSON.stringify({ type: 'publication-update', data }))
  }

  const postUpdateHandler = (data: any) => {
    stream.push(JSON.stringify({ type: 'post-update', data }))
  }

  const queueUpdateHandler = (data: any) => {
    stream.push(JSON.stringify({ type: 'queue-update', data }))
  }

  sseEmitter.on('publication-update', publicationUpdateHandler)
  sseEmitter.on('post-update', postUpdateHandler)
  sseEmitter.on('queue-update', queueUpdateHandler)

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    stream.push(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }))
  }, 30000) // Every 30 seconds

  // Cleanup on close
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval)
    sseEmitter.off('publication-update', publicationUpdateHandler)
    sseEmitter.off('post-update', postUpdateHandler)
    sseEmitter.off('queue-update', queueUpdateHandler)
    stream.close()
  })

  return stream.send()
})
