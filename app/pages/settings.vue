<script setup lang="ts">
const { get, put } = useApi()

definePageMeta({
  layout: 'dashboard',
})

const settings = ref<any>(null)
const loading = ref(true)
const saving = ref(false)

async function loadSettings() {
  try {
    const response = await get<any>('/settings')
    settings.value = response.settings
  }
  catch (error) {
    console.error('Failed to load settings:', error)
  }
  finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await put('/settings', settings.value)
    alert('Settings saved successfully!')
  }
  catch (error: any) {
    alert('Failed to save settings: ' + error.message)
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div>
    <div mb-6>
      <h2 text-2xl font-bold text-gray-900 dark:text-white>
        Settings
      </h2>
      <p text-gray-600 dark:text-gray-400 mt-1>
        Configure your Meta API credentials and preferences
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" text-center py-20>
      <div animate-pulse text-xl text-gray-600 dark:text-gray-400>
        Loading settings...
      </div>
    </div>

    <div v-else-if="settings" space-y-6>
      <!-- Meta API Configuration -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
        <h3 text-xl font-bold text-gray-900 dark:text-white mb-4>
          Meta API Configuration
        </h3>
        
        <form @submit.prevent="saveSettings" space-y-4>
          <!-- Long-Lived Token -->
          <div>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Long-Lived Access Token
            </label>
            <textarea
              v-model="settings.metaLongLivedToken"
              rows="3"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder="Enter your Meta long-lived access token..."
            />
            <p text-xs text-gray-500 dark:text-gray-400 mt-1>
              This token is used to access Facebook and Instagram APIs
            </p>
          </div>

          <!-- App ID -->
          <div>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Meta App ID
            </label>
            <input
              v-model="settings.metaAppId"
              type="text"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder="Enter your Meta App ID..."
            >
          </div>

          <!-- App Secret -->
          <div>
            <label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Meta App Secret
            </label>
            <input
              v-model="settings.metaAppSecret"
              type="password"
              w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder="Enter your Meta App Secret..."
            >
          </div>

          <!-- Save Button -->
          <button
            type="submit"
            :disabled="saving"
            px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed transition font-medium
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Settings</span>
          </button>
        </form>
      </div>

      <!-- Instructions -->
      <div bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-6>
        <h4 text-lg font-bold text-blue-900 dark:text-blue-100 mb-3>
          How to Get Meta API Credentials
        </h4>
        <ol list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200>
          <li>Go to <a href="https://developers.facebook.com" target="_blank" class="underline">Facebook Developers</a></li>
          <li>Create a new app or select an existing one</li>
          <li>Add Facebook Login and Instagram Basic Display products</li>
          <li>Generate a long-lived access token from the Graph API Explorer</li>
          <li>Copy your App ID and App Secret from the app settings</li>
          <li>Paste them into the fields above and save</li>
        </ol>
      </div>

      <!-- API Status -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow p-6>
        <h3 text-xl font-bold text-gray-900 dark:text-white mb-4>
          API Status
        </h3>
        <div flex items-center gap-3>
          <div
            :class="[
              'w-3 h-3 rounded-full',
              settings.metaLongLivedToken ? 'bg-green-500' : 'bg-red-500'
            ]"
          />
          <span text-gray-700 dark:text-gray-300>
            {{ settings.metaLongLivedToken ? 'Connected' : 'Not Connected' }}
          </span>
        </div>
        <p text-sm text-gray-600 dark:text-gray-400 mt-2>
          {{ settings.metaLongLivedToken 
            ? 'Your Meta API credentials are configured and ready to use.' 
            : 'Please configure your Meta API credentials to start publishing.' 
          }}
        </p>
      </div>
    </div>
  </div>
</template>

