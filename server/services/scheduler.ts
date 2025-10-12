import prisma from '../utils/prisma'

export async function checkScheduledPosts() {
  try {
    // Find posts that are ready to be published
    const scheduledPosts = await prisma.postRequest.findMany({
      where: {
        status: 'READY',
        scheduledAt: {
          lte: new Date(),
          not: null,
        },
      },
      include: {
        client: {
          include: {
            channels: {
              where: {
                isEnabled: true,
              },
            },
          },
        },
      },
    })

    console.log(`Found ${scheduledPosts.length} scheduled posts to publish`)

    for (const post of scheduledPosts) {
      if (post.client.channels.length === 0) {
        console.log(`No enabled channels for post ${post.id}, skipping`)
        continue
      }

      // Check if publications already exist
      const existingPublications = await prisma.publication.findMany({
        where: { postRequestId: post.id },
      })

      if (existingPublications.length > 0) {
        console.log(`Publications already exist for post ${post.id}, skipping`)
        continue
      }

      // Create publications for each enabled channel
      const publications = await Promise.all(
        post.client.channels.map(channel =>
          prisma.publication.create({
            data: {
              postRequestId: post.id,
              channelId: channel.id,
              status: 'queued',
            },
          }),
        ),
      )

      // Queue publishing jobs
      try {
        const { getPublishQueue } = await import('../utils/queue')
        const publishQueue = getPublishQueue()
        
        for (const publication of publications) {
          await publishQueue.add('publish-post', {
            publicationId: publication.id,
          })
        }
        console.log(`✅ Queued ${publications.length} publications for post ${post.id}`)
      }
      catch (error) {
        console.error('Failed to queue publications:', error)
      }
    }
  }
  catch (error: any) {
    console.error('Scheduler error:', error.message)
  }
}

// Run scheduler every minute
let schedulerInterval: NodeJS.Timeout | null = null

export function startScheduler() {
  if (schedulerInterval) {
    console.log('Scheduler already running')
    return
  }

  console.log('✅ Starting scheduler service...')
  
  // Run immediately
  checkScheduledPosts()

  // Then run every minute
  schedulerInterval = setInterval(() => {
    checkScheduledPosts()
  }, 60000) // 60 seconds
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('Scheduler stopped')
  }
}

