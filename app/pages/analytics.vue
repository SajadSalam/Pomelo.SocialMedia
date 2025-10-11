<script setup lang="ts">
const { get } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const summary = ref<any>(null)
const loading = ref(true)

async function loadAnalytics() {
  try {
    const response = await get<any>('/insights/summary')
    summary.value = response.summary
  }
  catch (error) {
    console.error('Failed to load analytics:', error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div>
    <div mb-6>
      <h2 text-2xl font-bold text-gray-900 dark:text-white>
        Analytics
      </h2>
      <p text-gray-600 dark:text-gray-400 mt-1>
        Track your social media performance
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading analytics...
      </div>
    </div>

    <div v-else-if="summary" space-y-6>
      <!-- Summary Cards -->
      <div grid="~ cols-1 md:cols-2 lg:cols-4" gap-6>
        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400 mb-2>
            Total Posts
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white>
            {{ summary.totalPosts }}
          </p>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400 mb-2>
            Published Posts
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white>
            {{ summary.publishedPosts }}
          </p>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400 mb-2>
            Total Reach
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white>
            {{ summary.totalReach.toLocaleString() }}
          </p>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400 mb-2>
            Engagement Rate
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white>
            {{ summary.engagementRate }}%
          </p>
        </div>
      </div>

      <!-- Platform Breakdown -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
        <h3 text-xl font-bold text-gray-900 dark:text-white mb-4>
          Platform Breakdown
        </h3>
        <div grid="~ cols-1 md:cols-2" gap-6>
          <div>
            <div flex items-center justify-between mb-2>
              <span text-gray-700 dark:text-gray-300>Facebook</span>
              <span text-2xl font-bold text-blue-600>{{ summary.platformBreakdown.facebook }}</span>
            </div>
            <div w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3>
              <div
                bg-blue-600 h-3 rounded-full
                :style="{
                  width: `${(summary.platformBreakdown.facebook / (summary.platformBreakdown.facebook + summary.platformBreakdown.instagram)) * 100}%`
                }"
              />
            </div>
          </div>
          <div>
            <div flex items-center justify-between mb-2>
              <span text-gray-700 dark:text-gray-300>Instagram</span>
              <span text-2xl font-bold text-pink-600>{{ summary.platformBreakdown.instagram }}</span>
            </div>
            <div w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3>
              <div
                bg-pink-600 h-3 rounded-full
                :style="{
                  width: `${(summary.platformBreakdown.instagram / (summary.platformBreakdown.facebook + summary.platformBreakdown.instagram)) * 100}%`
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Post Status -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
        <h3 text-xl font-bold text-gray-900 dark:text-white mb-4>
          Post Status
        </h3>
        <div grid="~ cols-1 md:cols-3" gap-6>
          <div>
            <p text-sm text-gray-600 dark:text-gray-400 mb-2>
              Published
            </p>
            <p text-2xl font-bold text-green-600>
              {{ summary.publishedPosts }}
            </p>
          </div>
          <div>
            <p text-sm text-gray-600 dark:text-gray-400 mb-2>
              Scheduled
            </p>
            <p text-2xl font-bold text-blue-600>
              {{ summary.scheduledPosts }}
            </p>
          </div>
          <div>
            <p text-sm text-gray-600 dark:text-gray-400 mb-2>
              Drafts
            </p>
            <p text-2xl font-bold text-gray-600>
              {{ summary.draftPosts }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

