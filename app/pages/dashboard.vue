<script setup lang="ts">
const { get } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const stats = ref({
  totalClients: 0,
  totalPosts: 0,
  publishedPosts: 0,
  scheduledPosts: 0,
  draftPosts: 0,
  queuedPublications: 0,
})

const recentPosts = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Fetch clients
    const clientsResponse = await get<any>('/clients')
    stats.value.totalClients = clientsResponse.clients?.length || 0

    // Fetch posts
    const postsResponse = await get<any>('/posts?limit=10')
    recentPosts.value = postsResponse.posts || []

    // Calculate post stats
    const allPostsResponse = await get<any>('/posts?limit=1000')
    const posts = allPostsResponse.posts || []
    
    stats.value.totalPosts = posts.length
    stats.value.publishedPosts = posts.filter((p: any) => p.status === 'PUBLISHED').length
    stats.value.scheduledPosts = posts.filter((p: any) => p.status === 'READY' && p.scheduledAt).length
    stats.value.draftPosts = posts.filter((p: any) => p.status === 'DRAFT').length

    // Count queued publications
    posts.forEach((post: any) => {
      post.publications?.forEach((pub: any) => {
        if (pub.status === 'queued') {
          stats.value.queuedPublications++
        }
      })
    })
  }
  catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
  finally {
    loading.value = false
  }
})

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    QUEUED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div>
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading dashboard...
      </div>
    </div>

    <div v-else space-y-6>
      <!-- Stats Cards -->
      <div grid="~ cols-1 md:cols-2 lg:cols-4" gap-6>
        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <div flex items-center justify-between>
            <div>
              <p text-sm text-gray-600 dark:text-gray-400>
                Total Clients
              </p>
              <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
                {{ stats.totalClients }}
              </p>
            </div>
            <div w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center>
              <span text-2xl>👥</span>
            </div>
          </div>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <div flex items-center justify-between>
            <div>
              <p text-sm text-gray-600 dark:text-gray-400>
                Total Posts
              </p>
              <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
                {{ stats.totalPosts }}
              </p>
            </div>
            <div w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center>
              <span text-2xl>📝</span>
            </div>
          </div>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <div flex items-center justify-between>
            <div>
              <p text-sm text-gray-600 dark:text-gray-400>
                Published
              </p>
              <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
                {{ stats.publishedPosts }}
              </p>
            </div>
            <div w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center>
              <span text-2xl>✅</span>
            </div>
          </div>
        </div>

        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <div flex items-center justify-between>
            <div>
              <p text-sm text-gray-600 dark:text-gray-400>
                In Queue
              </p>
              <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
                {{ stats.queuedPublications }}
              </p>
            </div>
            <div w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center>
              <span text-2xl>⏳</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div grid="~ cols-1 md:cols-2" gap-6>
        <NuxtLink
          to="/posts/new"
          bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
          text-white rounded-xl shadow-lg p-8 block transition
        >
          <div flex items-center justify-between>
            <div>
              <h3 text-2xl font-bold mb-2>
                Create New Post
              </h3>
              <p text-indigo-100>
                Schedule or publish a new post to your social media channels
              </p>
            </div>
            <span text-5xl>➕</span>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/clients"
          bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700
          text-white rounded-xl shadow-lg p-8 block transition
        >
          <div flex items-center justify-between>
            <div>
              <h3 text-2xl font-bold mb-2>
                Manage Clients
              </h3>
              <p text-blue-100>
                Add new clients and configure their social media channels
              </p>
            </div>
            <span text-5xl>👥</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Recent Posts -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow>
        <div px-6 py-4 border-b border-gray-200 dark:border-gray-700>
          <div flex items-center justify-between>
            <h2 text-xl font-bold text-gray-900 dark:text-white>
              Recent Posts
            </h2>
            <NuxtLink
              to="/posts"
              text-indigo-600 dark:text-indigo-400 hover:underline text-sm
            >
              View All
            </NuxtLink>
          </div>
        </div>
        
        <div v-if="recentPosts.length === 0" px-6 py-8 text-center>
          <p text-gray-600 dark:text-gray-400>
            No posts yet. Create your first post to get started!
          </p>
        </div>

        <div v-else divide-y divide-gray-200 dark:divide-gray-700>
          <NuxtLink
            v-for="post in recentPosts"
            :key="post.id"
            :to="`/posts/${post.id}`"
            block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          >
            <div flex items-center justify-between>
              <div flex-1>
                <div flex items-center gap-3 mb-2>
                  <span :class="['px-2 py-1 rounded text-xs font-medium', getStatusColor(post.status)]">
                    {{ post.status }}
                  </span>
                  <span text-sm text-gray-600 dark:text-gray-400>
                    {{ post.client?.name }}
                  </span>
                </div>
                <p text-gray-900 dark:text-white truncate>
                  {{ post.caption }}
                </p>
                <p text-sm text-gray-500 dark:text-gray-400 mt-1>
                  {{ new Date(post.createdAt).toLocaleString() }}
                </p>
              </div>
              <div text-right>
                <p text-sm text-gray-600 dark:text-gray-400>
                  {{ post.publications?.length || 0 }} channel(s)
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

