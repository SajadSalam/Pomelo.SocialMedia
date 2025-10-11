<script setup lang="ts">
const { get, post } = useApi()
const router = useRouter()

definePageMeta({
  layout: 'dashboard',
})

const clients = ref<any[]>([])
const form = ref({
  clientId: '',
  kind: 'SINGLE_IMAGE',
  caption: '',
  mediaIds: [] as string[],
  thumbnailId: null as string | null,
  scheduledAt: null as string | null,
})
const uploading = ref(false)
const submitting = ref(false)

async function loadClients() {
  try {
    const response = await get<any>('/clients')
    clients.value = response.clients || []
  }
  catch (error) {
    console.error('Failed to load clients:', error)
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0)
    return

  uploading.value = true
  const formData = new FormData()

  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i]
    if (file) {
      formData.append('files', file)
    }
  }

  try {
    // Get auth token
    const { token } = useAuth()

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    form.value.mediaIds = data.mediaAssets.map((asset: any) => asset.id)
    alert('Files uploaded successfully!')
  }
  catch (error: any) {
    alert(`Failed to upload files: ${error.message}`)
  }
  finally {
    uploading.value = false
  }
}

async function handleThumbnailUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0)
    return

  uploading.value = true
  const formData = new FormData()
  const file = input.files[0]
  if (file) {
    formData.append('files', file) // Only one thumbnail
  }

  try {
    // Get auth token
    const { token } = useAuth()

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    form.value.thumbnailId = data.mediaAssets[0].id
    alert('Thumbnail uploaded successfully!')
  }
  catch (error: any) {
    alert(`Failed to upload thumbnail: ${error.message}`)
  }
  finally {
    uploading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.clientId || !form.value.caption || form.value.mediaIds.length === 0) {
    alert('Please fill in all required fields and upload media')
    return
  }

  submitting.value = true

  try {
    // Create post
    const createResponse = await post<any>('/posts', form.value)
    const postId = createResponse.post.id

    // Publish post
    await post(`/posts/${postId}/publish`, {})

    alert('Post created and queued for publishing!')
    router.push(`/posts/${postId}`)
  }
  catch (error: any) {
    alert(`Failed to create post: ${error.message}`)
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadClients()
})
</script>

<template>
  <div>
    <div mb-6>
      <NuxtLink to="/posts" text-indigo-600 dark:text-indigo-400 hover:underline>
        ← Back to Posts
      </NuxtLink>
      <h2 text-2xl text-gray-900 font-bold mt-2 dark:text-white>
        Create New Post
      </h2>
    </div>

    <div p-6 rounded-xl bg-white shadow dark:bg-gray-800>
      <form space-y-6 @submit.prevent="handleSubmit">
        <!-- Client Selection -->
        <div>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Client *
          </label>
          <select
            v-model="form.clientId"

            required text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
          >
            <option value="">
              Select a client
            </option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <!-- Post Type -->
        <div>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Post Type *
          </label>
          <select
            v-model="form.kind"

            required text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
          >
            <option value="SINGLE_IMAGE">
              Single Image
            </option>
            <option value="CAROUSEL">
              Carousel (2-10 images)
            </option>
            <option value="VIDEO">
              Video
            </option>
          </select>
        </div>

        <!-- Media Upload -->
        <div>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Upload Media *
          </label>
          <input
            type="file"
            :multiple="form.kind === 'CAROUSEL'"
            :accept="form.kind === 'VIDEO' ? 'video/*' : 'image/*'"

            text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
            @change="handleFileUpload"
          >
          <p v-if="uploading" text-sm text-gray-600 mt-2 dark:text-gray-400>
            Uploading...
          </p>
          <p v-else-if="form.mediaIds.length > 0" text-sm text-green-600 mt-2 dark:text-green-400>
            ✓ {{ form.mediaIds.length }} file(s) uploaded
          </p>
        </div>

        <!-- Video Thumbnail (optional, only for videos) -->
        <div v-if="form.kind === 'VIDEO'">
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Video Thumbnail (Optional)
            <span text-xs text-gray-500 ml-2>
              Custom thumbnail for Facebook
            </span>
          </label>
          <input
            type="file"
            accept="image/*"

            text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
            @change="handleThumbnailUpload"
          >
          <p v-if="form.thumbnailId" text-sm text-green-600 mt-2 dark:text-green-400>
            ✓ Thumbnail uploaded
          </p>
          <p text-xs text-gray-500 mt-1 dark:text-gray-400>
            Upload a custom thumbnail image for your video (recommended 1280x720px or 16:9 ratio).
            <br>
            <strong>Facebook:</strong> Will use your custom thumbnail<br>
            <strong>Instagram:</strong> Auto-generates thumbnails (custom thumbnails not supported)
          </p>
        </div>

        <!-- Caption -->
        <div>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Caption *
          </label>
          <textarea
            v-model="form.caption"

            rows="5"

            required text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
            placeholder="Write your caption here..."
          />
        </div>

        <!-- Scheduled Date (Optional) -->
        <div>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            Schedule for Later (Optional)
          </label>
          <input
            v-model="form.scheduledAt"
            type="datetime-local"

            text-gray-900 px-4 py-2 border border-gray-300 rounded-lg bg-white w-full dark:text-white dark:border-gray-600 dark:bg-gray-700
          >
        </div>

        <!-- Submit Button -->
        <div flex gap-3>
          <button
            type="submit"
            :disabled="submitting || uploading"

            text-white font-medium px-6 py-3 rounded-lg bg-indigo-600 flex-1 transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
          >
            <span v-if="submitting">Creating Post...</span>
            <span v-else>Create & Publish Post</span>
          </button>
          <NuxtLink
            to="/posts"

            text-gray-700 font-medium px-6 py-3 rounded-lg bg-gray-200 transition dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
          >
            Cancel
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>
