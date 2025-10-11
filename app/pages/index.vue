<script setup lang="ts">
const { isAuthenticated } = useAuth()

definePageMeta({
  layout: false,
})

// Redirect to dashboard if already authenticated
watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800>
    <!-- Header -->
    <header py-6 px-4>
      <div max-w-7xl mx-auto flex justify-between items-center>
        <div flex items-center gap-2>
          <div w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center>
            <span text-white text-xl font-bold>SM</span>
          </div>
          <span text-2xl font-bold text-gray-800 dark:text-white>Social Media Manager</span>
        </div>
        <NuxtLink
          to="/login"
          px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition
        >
          Login
        </NuxtLink>
      </div>
    </header>

    <!-- Hero Section -->
    <main>
      <div max-w-7xl mx-auto px-4 py-20>
        <div text-center max-w-3xl mx-auto>
          <h1 text-5xl font-extrabold text-gray-900 dark:text-white mb-6>
            Manage Multiple Social Media Accounts
            <span text-indigo-600 dark:text-indigo-400> Effortlessly</span>
          </h1>
          <p text-xl text-gray-600 dark:text-gray-300 mb-8>
            Schedule posts, publish to Facebook and Instagram, track analytics, and manage multiple clients from one powerful platform.
          </p>
          <NuxtLink
            to="/login"
            px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 transition inline-block
          >
            Get Started
          </NuxtLink>
        </div>

        <!-- Features -->
        <div grid="~ cols-1 md:cols-3" gap-8 mt-20>
          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>📱</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Multi-Platform Publishing
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Publish to Facebook Pages and Instagram Business accounts with a single click.
            </p>
          </div>

          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>📅</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Smart Scheduling
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Schedule posts in advance and let the system publish them automatically.
            </p>
          </div>

          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>📊</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Advanced Analytics
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Track impressions, reach, engagement, and more with detailed analytics.
            </p>
          </div>

          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>👥</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Multi-Client Management
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Manage multiple clients and their social media accounts in one place.
            </p>
          </div>

          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>🤖</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Telegram Bot
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Create and publish posts directly from Telegram with our interactive bot.
            </p>
          </div>

          <div bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4>
              <span text-2xl>⚡</span>
            </div>
            <h3 text-xl font-bold text-gray-900 dark:text-white mb-2>
              Real-time Updates
            </h3>
            <p text-gray-600 dark:text-gray-300>
              Get instant notifications when your posts are published or if anything fails.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer py-8 px-4 border-t border-gray-200 dark:border-gray-700>
      <div max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400>
        <p>© 2025 Social Media Manager. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
