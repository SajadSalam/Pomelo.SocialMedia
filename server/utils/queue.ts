import type { Queue } from 'bullmq'
import type Redis from 'ioredis'

// Lazy initialization - queues are created only when accessed
let _connection: Redis | null = null
let _publishQueue: Queue | null = null
let _insightsQueue: Queue | null = null
let _initialized = false

async function initializeQueues() {
  if (_initialized) {
    return
  }

  try {
    // Only initialize if we're in a server context (not during build)
    if (typeof process !== 'undefined' && process.server) {
      // Use dynamic imports for ESM compatibility
      const [{ Queue }, Redis] = await Promise.all([
        import('bullmq'),
        import('ioredis').then(m => m.default),
      ])
      
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
export async function getPublishQueue(): Promise<Queue> {
  if (!_publishQueue) {
    await initializeQueues()
  }
  if (!_publishQueue) {
    throw new Error('Publish queue not initialized. Redis connection may have failed.')
  }
  return _publishQueue
}

export async function getInsightsQueue(): Promise<Queue> {
  if (!_insightsQueue) {
    await initializeQueues()
  }
  if (!_insightsQueue) {
    throw new Error('Insights queue not initialized. Redis connection may have failed.')
  }
  return _insightsQueue
}

// Note: Use getPublishQueue() and getInsightsQueue() instead of direct exports
// since initialization is now async

