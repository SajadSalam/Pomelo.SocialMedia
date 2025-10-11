<script setup lang="ts">
const { get, post, delete: del } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const clients = ref<any[]>([])
const loading = ref(true)
const showAddDialog = ref(false)
const newClient = ref({ name: '', notes: '' })

async function loadClients() {
  try {
    const response = await get<any>('/clients')
    clients.value = response.clients || []
  }
  catch (error) {
    console.error('Failed to load clients:', error)
  }
  finally {
    loading.value = false
  }
}

async function addClient() {
  try {
    await post('/clients', newClient.value)
    showAddDialog.value = false
    newClient.value = { name: '', notes: '' }
    await loadClients()
  }
  catch (error: any) {
    alert('Failed to create client: ' + error.message)
  }
}

async function deleteClient(id: string) {
  if (!confirm('Are you sure you want to delete this client?')) return

  try {
    await del(`/clients/${id}`)
    await loadClients()
  }
  catch (error: any) {
    alert('Failed to delete client: ' + error.message)
  }
}

onMounted(() => {
  loadClients()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div flex items-center justify-between mb-6>
      <div>
        <h2 text-2xl font-bold text-gray-900 dark:text-white>
          Clients
        </h2>
        <p text-gray-600 dark:text-gray-400 mt-1>
          Manage your clients and their social media channels
        </p>
      </div>
      <button
        px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition
        @click="showAddDialog = true"
      >
        + Add Client
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading clients...
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="clients.length === 0" bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center>
      <span text-6xl mb-4 block>👥</span>
      <h3 text-2xl font-bold text-gray-900 dark:text-white mb-2>
        No clients yet
      </h3>
      <p text-gray-600 dark:text-gray-400 mb-6>
        Get started by creating your first client
      </p>
      <button
        px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition
        @click="showAddDialog = true"
      >
        Create First Client
      </button>
    </div>

    <!-- Clients Grid -->
    <div v-else grid="~ cols-1 md:cols-2 lg:cols-3" gap-6>
      <NuxtLink
        v-for="client in clients"
        :key="client.id"
        :to="`/clients/${client.id}`"
        bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 block transition
      >
        <div flex items-start justify-between mb-4>
          <h3 text-xl font-bold text-gray-900 dark:text-white truncate>
            {{ client.name }}
          </h3>
          <button
            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg
            @click.prevent="deleteClient(client.id)"
          >
            🗑️
          </button>
        </div>

        <p v-if="client.notes" text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2>
          {{ client.notes }}
        </p>

        <div space-y-2>
          <div flex items-center gap-2 text-sm>
            <span>📱</span>
            <span text-gray-700 dark:text-gray-300>
              {{ client.channels?.length || 0 }} channel(s)
            </span>
          </div>
          <div flex items-center gap-2 text-sm>
            <span>📝</span>
            <span text-gray-700 dark:text-gray-300>
              {{ client._count?.postRequests || 0 }} post(s)
            </span>
          </div>
        </div>

        <!-- Channel Badges -->
        <div v-if="client.channels && client.channels.length > 0" flex gap-2 mt-4>
          <span
            v-for="channel in client.channels"
            :key="channel.id"
            :class="[
              'px-2 py-1 text-xs rounded',
              channel.type === 'FACEBOOK_PAGE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
            ]"
          >
            {{ channel.type === 'FACEBOOK_PAGE' ? 'FB' : 'IG' }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- Add Client Dialog -->
    <div
      v-if="showAddDialog"
      fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50
      @click.self="showAddDialog = false"
    >
      <div bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6>
        <h3 text-2xl font-bold text-gray-900 dark:text-white mb-4>
          Add New Client
        </h3>

        <form @submit.prevent="addClient">
          <div mb-4>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Client Name *
            </label>
            <input
              v-model="newClient.name"
              required
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            >
          </div>

          <div mb-6>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Notes
            </label>
            <textarea
              v-model="newClient.notes"
              rows="3"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            />
          </div>

          <div flex gap-3>
            <button
              type="submit"
              flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition
            >
              Create Client
            </button>
            <button
              type="button"
              px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition
              @click="showAddDialog = false"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

