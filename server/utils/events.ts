import { EventEmitter } from 'node:events'

// Create singleton event emitter
class SSEEmitter extends EventEmitter {
  private static instance: SSEEmitter

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many clients
  }

  static getInstance(): SSEEmitter {
    if (!SSEEmitter.instance) {
      SSEEmitter.instance = new SSEEmitter()
    }
    return SSEEmitter.instance
  }
}

const sseEmitter = SSEEmitter.getInstance()

export function emitPublicationUpdate(data: any) {
  sseEmitter.emit('publication-update', data)
}

export function emitPostUpdate(data: any) {
  sseEmitter.emit('post-update', data)
}

export function emitQueueUpdate(data: any) {
  sseEmitter.emit('queue-update', data)
}

export { sseEmitter }

