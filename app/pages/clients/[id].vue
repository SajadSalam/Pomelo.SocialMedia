<script setup lang="ts">
const route = useRoute()
const { get, post, put, delete: del } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const client = ref<any>(null)
const loading = ref(true)
const showAddChannelDialog = ref(false)
const newChannel = ref({
  type: 'FACEBOOK_PAGE',
  externalId: '',
  accessToken: '',
  name: '',
})

async function loadClient() {
  try {
    const response = await get<any>(`/clients/${route.params.id}`)
    client.value = response.client
  }
  catch (error) {
    console.error('Failed to load client:', error)
  }
  finally {
    loading.value = false
  }
}

async function addChannel() {
  try {
    await post(`/clients/${route.params.id}/channels`, newChannel.value)
    showAddChannelDialog.value = false
    newChannel.value = { type: 'FACEBOOK_PAGE', externalId: '', accessToken: '', name: '' }
    await loadClient()
  }
  catch (error: any) {
    alert('Failed to add channel: ' + error.message)
  }
}

async function toggleChannel(channelId: string, isEnabled: boolean) {
  try {
    await put(`/channels/${channelId}`, { isEnabled: !isEnabled })
    await loadClient()
  }
  catch (error: any) {
    alert('Failed to update channel: ' + error.message)
  }
}

async function deleteChannel(channelId: string) {
  if (!confirm('Are you sure you want to delete this channel?')) return

  try {
    await del(`/channels/${channelId}`)
    await loadClient()
  }
  catch (error: any) {
    alert('Failed to delete channel: ' + error.message)
  }
}

onMounted(() => {
  loadClient()
})
</script>

<template>
  <div>
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading client...
      </div>
    </div>

    <div v-else-if="client" space-y-6>
      <!-- Header -->
      <div>
        <div flex items-center gap-3 mb-2>
          <NuxtLink to="/clients" text-indigo-600 dark:text-indigo-400 hover:underline>
            ← Back to Clients
          </NuxtLink>
        </div>
        <h2 text-3xl font-bold text-gray-900 dark:text-white>
          {{ client.name }}
        </h2>
        <p v-if="client.notes" text-gray-600 dark:text-gray-400 mt-2>
          {{ client.notes }}
        </p>
      </div>

      <!-- Stats -->
      <div grid="~ cols-1 md:cols-3" gap-6>
        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400>
            Channels
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
            {{ client.channels?.length || 0 }}
          </p>
        </div>
        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400>
            Total Posts
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
            {{ client._count?.postRequests || 0 }}
          </p>
        </div>
        <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
          <p text-sm text-gray-600 dark:text-gray-400>
            Enabled Channels
          </p>
          <p text-3xl font-bold text-gray-900 dark:text-white mt-2>
            {{ client.channels?.filter((c: any) => c.isEnabled).length || 0 }}
          </p>
        </div>
      </div>

      <!-- Channels -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow>
        <div px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between>
          <h3 text-xl font-bold text-gray-900 dark:text-white>
            Social Media Channels
          </h3>
          <button
            px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition
            @click="showAddChannelDialog = true"
          >
            + Add Channel
          </button>
        </div>

        <div v-if="!client.channels || client.channels.length === 0" px-6 py-8 text-center>
          <p text-gray-600 dark:text-gray-400>
            No channels configured yet.
          </p>
        </div>

        <div v-else divide-y divide-gray-200 dark:divide-gray-700>
          <div
            v-for="channel in client.channels"
            :key="channel.id"
            px-6 py-4 flex items-center justify-between
          >
            <div flex-1>
              <div flex items-center gap-3>
                <span
                  :class="[
                    'px-3 py-1 text-sm rounded font-medium',
                    channel.type === 'FACEBOOK_PAGE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  ]"
                >
                  {{ channel.type === 'FACEBOOK_PAGE' ? 'Facebook Page' : 'Instagram Business' }}
                </span>
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    channel.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ channel.isEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <p text-sm text-gray-700 dark:text-gray-300 mt-2>
                {{ channel.name || 'Unnamed Channel' }}
              </p>
              <p text-xs text-gray-500 dark:text-gray-400 mt-1>
                ID: {{ channel.externalId }}
              </p>
            </div>
            <div flex gap-2>
              <button
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition',
                  channel.isEnabled
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200'
                ]"
                @click="toggleChannel(channel.id, channel.isEnabled)"
              >
                {{ channel.isEnabled ? 'Disable' : 'Enable' }}
              </button>
              <button
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 px-3 py-2 rounded-lg transition
                @click="deleteChannel(channel.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Channel Dialog -->
    <div
      v-if="showAddChannelDialog"
      fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50
      @click.self="showAddChannelDialog = false"
    >
      <div bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6>
        <h3 text-2xl font-bold text-gray-900 dark:text-white mb-4>
          Add Social Media Channel
        </h3>

        <form @submit.prevent="addChannel">
          <div mb-4>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Channel Type *
            </label>
            <select
              v-model="newChannel.type"
              required
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            >
              <option value="FACEBOOK_PAGE">
                Facebook Page
              </option>
              <option value="INSTAGRAM_BUSINESS">
                Instagram Business
              </option>
            </select>
          </div>

          <div mb-4>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Page/Account ID *
            </label>
            <input
              v-model="newChannel.externalId"
              required
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            >
          </div>

          <div mb-4>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Access Token *
            </label>
            <textarea
              v-model="newChannel.accessToken"
              required
              rows="3"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            />
          </div>

          <div mb-6>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Channel Name
            </label>
            <input
              v-model="newChannel.name"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            >
          </div>

          <div flex gap-3>
            <button
              type="submit"
              flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition
            >
              Add Channel
            </button>
            <button
              type="button"
              px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition
              @click="showAddChannelDialog = false"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

