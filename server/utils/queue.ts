import type { Queue } from 'bullmq'
import type Redis from 'ioredis'

// Lazy initialization - queues are created only when accessed
let _connection: Redis | null = null
let _publishQueue: Queue | null = null
let _insightsQueue: Queue | null = null
let _initialized = false

function initializeQueues() {
  if (_initialized) {
    return
  }

  try {
    // Only initialize if we're in a server context (not during build)
    if (typeof process !== 'undefined' && process.server) {
      const { Queue } = require('bullmq')
      const Redis = require('ioredis')
      const config = useRuntimeConfig()

      // Create Redis connection
      _connection = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      })

      // Handle connection errors gracefully
      _connection.on('error', (err: any) => {
        console.error('Redis connection error:', err.message)
      })

      // Create BullMQ queues
      _publishQueue = new Queue('publish-post', {
        connection: _connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 500,
          },
        },
      })

      _insightsQueue = new Queue('fetch-insights', {
        connection: _connection,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 200,
          },
        },
      })

      // Connect to Redis
      _connection.connect().then(() => {
        console.log('✅ BullMQ queues initialized')
      }).catch((err: any) => {
        console.error('Failed to connect to Redis:', err.message)
      })

      _initialized = true
    }
  }
  catch (error: any) {
    console.error('Failed to initialize queues:', error.message)
  }
}

// Getter functions for lazy initialization
export function getPublishQueue(): Queue {
  if (!_publishQueue) {
    initializeQueues()
  }
  if (!_publishQueue) {
    throw new Error('Publish queue not initialized. Redis connection may have failed.')
  }
  return _publishQueue
}

export function getInsightsQueue(): Queue {
  if (!_insightsQueue) {
    initializeQueues()
  }
  if (!_insightsQueue) {
    throw new Error('Insights queue not initialized. Redis connection may have failed.')
  }
  return _insightsQueue
}

// Legacy exports for backward compatibility (will initialize on first access)
export const publishQueue = new Proxy({} as Queue, {
  get(target, prop) {
    return getPublishQueue()[prop as keyof Queue]
  },
})

export const insightsQueue = new Proxy({} as Queue, {
  get(target, prop) {
    return getInsightsQueue()[prop as keyof Queue]
  },
})

