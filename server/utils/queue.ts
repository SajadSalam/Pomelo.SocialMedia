import { Queue } from 'bullmq'
import Redis from 'ioredis'

const config = useRuntimeConfig()

// Create Redis connection
const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Create BullMQ queues
export const publishQueue = new Queue('publish-post', {
  connection,
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

export const insightsQueue = new Queue('fetch-insights', {
  connection,
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

console.log('✅ BullMQ queues initialized')

