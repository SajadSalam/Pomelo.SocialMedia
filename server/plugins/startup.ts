export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Starting background services...')

  // Start the publishing worker
  try {
    await import('../workers/publisher')
    console.log('✅ Publishing worker started')
  }
  catch (error) {
    console.error('❌ Failed to start publishing worker:', error)
  }

  // Start the scheduler
  try {
    const { startScheduler } = await import('../services/scheduler')
    startScheduler()
    console.log('✅ Scheduler service started')
  }
  catch (error) {
    console.error('❌ Failed to start scheduler:', error)
  }

  console.log('✅ All background services started')
})

