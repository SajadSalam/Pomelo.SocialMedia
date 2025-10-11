<script setup lang="ts">
const { get, delete: del } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const posts = ref<any[]>([])
const loading = ref(true)

async function loadPosts() {
  try {
    const response = await get<any>('/posts?limit=50')
    posts.value = response.posts || []
  }
  catch (error) {
    console.error('Failed to load posts:', error)
  }
  finally {
    loading.value = false
  }
}

async function deletePost(id: string) {
  if (!confirm('Are you sure you want to delete this post?')) return

  try {
    await del(`/posts/${id}`)
    await loadPosts()
  }
  catch (error: any) {
    alert('Failed to delete post: ' + error.message)
  }
}

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

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div flex items-center justify-between mb-6>
      <div>
        <h2 text-2xl font-bold text-gray-900 dark:text-white>
          Posts
        </h2>
        <p text-gray-600 dark:text-gray-400 mt-1>
          View and manage all your social media posts
        </p>
      </div>
      <NuxtLink
        to="/posts/new"
        px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition
      >
        + Create Post
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading posts...
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="posts.length === 0" bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center>
      <span text-6xl mb-4 block>📝</span>
      <h3 text-2xl font-bold text-gray-900 dark:text-white mb-2>
        No posts yet
      </h3>
      <p text-gray-600 dark:text-gray-400 mb-6>
        Create your first post to get started
      </p>
      <NuxtLink
        to="/posts/new"
        px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition inline-block
      >
        Create First Post
      </NuxtLink>
    </div>

    <!-- Posts Table -->
    <div v-else bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden>
      <div overflow-x-auto>
        <table w-full>
          <thead bg-gray-50 dark:bg-gray-700>
            <tr>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Status
              </th>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Client
              </th>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Caption
              </th>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Type
              </th>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Date
              </th>
              <th px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider>
                Actions
              </th>
            </tr>
          </thead>
          <tbody divide-y divide-gray-200 dark:divide-gray-700>
            <tr v-for="post in posts" :key="post.id">
              <td px-6 py-4 whitespace-nowrap>
                <span :class="['px-2 py-1 rounded text-xs font-medium', getStatusColor(post.status)]">
                  {{ post.status }}
                </span>
              </td>
              <td px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white>
                {{ post.client?.name }}
              </td>
              <td px-6 py-4 text-sm text-gray-700 dark:text-gray-300>
                <div max-w-xs truncate>
                  {{ post.caption }}
                </div>
              </td>
              <td px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300>
                {{ post.kind }}
              </td>
              <td px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400>
                {{ new Date(post.createdAt).toLocaleDateString() }}
              </td>
              <td px-6 py-4 whitespace-nowrap text-sm>
                <div flex gap-2>
                  <NuxtLink
                    :to="`/posts/${post.id}`"
                    text-indigo-600 dark:text-indigo-400 hover:underline
                  >
                    View
                  </NuxtLink>
                  <button
                    text-red-600 dark:text-red-400 hover:underline
                    @click="deletePost(post.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

