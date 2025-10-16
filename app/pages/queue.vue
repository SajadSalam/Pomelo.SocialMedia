<script setup lang="ts">
const { get, post: apiPost } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const publications = ref<any[]>([])
const scheduledPosts = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('scheduled')
const retryingPublications = ref<Set<string>>(new Set())

async function loadPublications() {
  try {
    const response = await get<any>('/posts?limit=100')
    const posts = response.posts || []
    
    publications.value = []
    scheduledPosts.value = []
    
    posts.forEach((post: any) => {
      // Add scheduled posts (posts with scheduledAt but no publications yet)
      if (post.status === 'READY' && post.scheduledAt && (!post.publications || post.publications.length === 0)) {
        scheduledPosts.value.push(post)
      }
      
      // Add publications
      post.publications?.forEach((pub: any) => {
        publications.value.push({
          ...pub,
          post: {
            id: post.id,
            caption: post.caption,
            kind: post.kind,
          },
        })
      })
    })
  }
  catch (error) {
    console.error('Failed to load queue:', error)
  }
  finally {
    loading.value = false
  }
}

async function retryPublication(publicationId: string) {
  if (retryingPublications.value.has(publicationId)) {
    return
  }

  try {
    retryingPublications.value.add(publicationId)
    await apiPost(`/publications/${publicationId}/retry`, {})
    
    // Reload the queue
    await loadPublications()
  }
  catch (error: any) {
    console.error('Failed to retry publication:', error)
  }
  finally {
    retryingPublications.value.delete(publicationId)
  }
}

const filteredPublications = computed(() => {
  if (activeTab.value === 'scheduled') {
    return []
  }
  return publications.value.filter(pub => pub.status === activeTab.value)
})

const displayData = computed(() => {
  if (activeTab.value === 'scheduled') {
    return scheduledPosts.value
  }
  return filteredPublications.value
})

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    queued: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadPublications()
})
</script>

<template>
  <div>
    <div mb-6>
      <h2 text-2xl font-bold text-gray-900 dark:text-white>
        Publishing Queue
      </h2>
      <p text-gray-600 dark:text-gray-400 mt-1>
        Monitor the status of your publications
      </p>
    </div>

    <!-- Tabs -->
    <div bg-white dark:bg-gray-800 rounded-xl shadow mb-6>
      <div flex border-b border-gray-200 dark:border-gray-700>
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition"
          :class="[
            activeTab === 'scheduled'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="activeTab = 'scheduled'"
        >
          Scheduled ({{ scheduledPosts.length }})
        </button>
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition"
          :class="[
            activeTab === 'queued'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="activeTab = 'queued'"
        >
          Queued ({{ publications.filter(p => p.status === 'queued').length }})
        </button>
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition"
          :class="[
            activeTab === 'published'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="activeTab = 'published'"
        >
          Published ({{ publications.filter(p => p.status === 'published').length }})
        </button>
        <button
          class="flex-1 px-6 py-4 text-sm font-medium transition"
          :class="[
            activeTab === 'failed'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="activeTab = 'failed'"
        >
          Failed ({{ publications.filter(p => p.status === 'failed').length }})
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading queue...
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="displayData.length === 0" bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center>
      <span text-6xl mb-4 block>⏳</span>
      <h3 text-2xl font-bold text-gray-900 dark:text-white mb-2>
        No {{ activeTab }} {{ activeTab === 'scheduled' ? 'posts' : 'publications' }}
      </h3>
      <p text-gray-600 dark:text-gray-400>
        {{ activeTab === 'scheduled' ? 'Scheduled posts will appear here' : `Publications will appear here when posts are ${activeTab}` }}
      </p>
    </div>

    <!-- Scheduled Posts List -->
    <div v-else-if="activeTab === 'scheduled'" bg-white dark:bg-gray-800 rounded-xl shadow divide-y divide-gray-200 dark:divide-gray-700>
      <div
        v-for="post in scheduledPosts"
        :key="post.id"
        px-6 py-4
      >
        <div flex items-start justify-between>
          <div flex-1>
            <div flex items-center gap-3 mb-2>
              <span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Scheduled
              </span>
              <span class="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {{ post.kind }}
              </span>
            </div>
            <p text-gray-900 dark:text-white font-medium mb-1>
              📅 {{ new Date(post.scheduledAt).toLocaleString() }}
            </p>
            <p text-sm text-gray-600 dark:text-gray-400 truncate>
              {{ post.caption }}
            </p>
            <p text-xs text-gray-500 dark:text-gray-400 mt-2>
              Post will be automatically published at the scheduled time
            </p>
          </div>
          <div flex items-center gap-3>
            <NuxtLink
              :to="`/posts/${post.id}`"
              text-indigo-600 dark:text-indigo-400 hover:underline text-sm
            >
              View Post
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Publications List -->
    <div v-else bg-white dark:bg-gray-800 rounded-xl shadow divide-y divide-gray-200 dark:divide-gray-700>
      <div
        v-for="pub in filteredPublications"
        :key="pub.id"
        px-6 py-4
      >
        <div flex items-start justify-between>
          <div flex-1>
            <div flex items-center gap-3 mb-2>
              <span class="px-2 py-1 rounded text-xs font-medium" :class="getStatusColor(pub.status)">
                {{ pub.status }}
              </span>
              <span
                class="px-2 py-1 text-xs rounded"
                :class="pub.channel.type === 'FACEBOOK_PAGE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'"
              >
                {{ pub.channel.type }}
              </span>
            </div>
            <p text-gray-900 dark:text-white font-medium mb-1>
              {{ pub.channel.name || 'Unnamed Channel' }}
            </p>
            <p text-sm text-gray-600 dark:text-gray-400 truncate>
              {{ pub.post.caption }}
            </p>
            <p v-if="pub.error" text-sm text-red-600 dark:text-red-400 mt-2>
              Error: {{ pub.error }}
            </p>
            <p v-if="pub.platformPostId" text-xs text-gray-500 dark:text-gray-400 mt-1>
              Platform Post ID: {{ pub.platformPostId }}
            </p>
          </div>
          <div flex items-center gap-3>
            <button
              v-if="pub.status === 'failed'"
              class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
              :class="
                retryingPublications.has(pub.id)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
              "
              :disabled="retryingPublications.has(pub.id)"
              @click="retryPublication(pub.id)"
            >
              <span v-if="retryingPublications.has(pub.id)">...</span>
              <span v-else>🔄 Retry</span>
            </button>
            <NuxtLink
              :to="`/posts/${pub.postRequestId}`"
              text-indigo-600 dark:text-indigo-400 hover:underline text-sm
            >
              View Post
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

