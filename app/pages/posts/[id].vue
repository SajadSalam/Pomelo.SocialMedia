<script setup lang="ts">
const route = useRoute()
const { get, post: apiPost } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const post = ref<any>(null)
const loading = ref(true)
const retryingPublications = ref<Set<string>>(new Set())

async function loadPost() {
  try {
    const response = await get<any>(`/posts/${route.params.id}`)
    post.value = response.post
  }
  catch (error) {
    console.error('Failed to load post:', error)
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
    
    // Show success message
    alert('Publication queued for retry!')
    
    // Reload the post to show updated status
    await loadPost()
  }
  catch (error: any) {
    console.error('Failed to retry publication:', error)
    alert(error.message || 'Failed to retry publication')
  }
  finally {
    retryingPublications.value.delete(publicationId)
  }
}

async function retryAllFailed() {
  const failedPublications = post.value?.publications?.filter((pub: any) => pub.status === 'failed') || []
  
  if (failedPublications.length === 0) {
    return
  }

  if (!confirm(`Retry ${failedPublications.length} failed publication(s)?`)) {
    return
  }

  for (const pub of failedPublications) {
    await retryPublication(pub.id)
  }
}

const hasFailedPublications = computed(() => {
  return post.value?.publications?.some((pub: any) => pub.status === 'failed') || false
})

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    READY: 'bg-blue-100 text-blue-800',
    QUEUED: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    queued: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadPost()
})
</script>

<template>
  <div>
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading post...
      </div>
    </div>

    <div v-else-if="post" space-y-6>
      <!-- Header -->
      <div>
        <NuxtLink to="/posts" text-indigo-600 dark:text-indigo-400 hover:underline>
          ← Back to Posts
        </NuxtLink>
        <div flex items-center gap-3 mt-3>
          <h2 text-3xl font-bold text-gray-900 dark:text-white>
            Post Details
          </h2>
          <span :class="['px-3 py-1 rounded text-sm font-medium', getStatusColor(post.status)]">
            {{ post.status }}
          </span>
        </div>
      </div>

      <!-- Post Content -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
        <h3 text-xl font-bold text-gray-900 dark:text-white mb-4>
          Post Content
        </h3>
        <div space-y-4>
          <div>
            <label text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1>
              Type
            </label>
            <p text-gray-900 dark:text-white>
              {{ post.kind }}
            </p>
          </div>
          <div>
            <label text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1>
              Caption
            </label>
            <p text-gray-900 dark:text-white whitespace-pre-wrap>
              {{ post.caption }}
            </p>
          </div>
          <div>
            <label text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1>
              Media Files
            </label>
            <p text-gray-900 dark:text-white>
              {{ post.mediaIds?.length || 0 }} file(s)
            </p>
          </div>
        </div>
      </div>

      <!-- Publications -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow>
        <div px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between>
          <h3 text-xl font-bold text-gray-900 dark:text-white>
            Publications
          </h3>
          <button
            v-if="hasFailedPublications"
            @click="retryAllFailed"
            class="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-sm font-medium transition-colors"
          >
            🔄 Retry All Failed
          </button>
        </div>
        
        <div v-if="!post.publications || post.publications.length === 0" px-6 py-8 text-center>
          <p text-gray-600 dark:text-gray-400>
            No publications yet.
          </p>
        </div>

        <div v-else divide-y divide-gray-200 dark:divide-gray-700>
          <div
            v-for="pub in post.publications"
            :key="pub.id"
            px-6 py-4
          >
            <div flex items-start justify-between>
              <div flex-1>
                <div flex items-center gap-3 mb-2>
                  <span :class="['px-2 py-1 rounded text-xs font-medium', getStatusColor(pub.status)]">
                    {{ pub.status }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded',
                      pub.channel.type === 'FACEBOOK_PAGE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    ]"
                  >
                    {{ pub.channel.type }}
                  </span>
                </div>
                <p text-sm text-gray-700 dark:text-gray-300>
                  {{ pub.channel.name || 'Unnamed Channel' }}
                </p>
                <p v-if="pub.platformPostId" text-xs text-gray-500 dark:text-gray-400 mt-1>
                  Platform Post ID: {{ pub.platformPostId }}
                </p>
                <p v-if="pub.error" text-sm text-red-600 dark:text-red-400 mt-2>
                  Error: {{ pub.error }}
                </p>
              </div>
              <div v-if="pub.status === 'failed'" ml-4>
                <button
                  :disabled="retryingPublications.has(pub.id)"
                  @click="retryPublication(pub.id)"
                  :class="[
                    'px-4 py-2 rounded text-sm font-medium transition-colors',
                    retryingPublications.has(pub.id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                  ]"
                >
                  <span v-if="retryingPublications.has(pub.id)">Retrying...</span>
                  <span v-else>🔄 Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

