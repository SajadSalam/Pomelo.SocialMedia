<script setup lang="ts">
const { login, isAuthenticated } = useAuth()
const router = useRouter()

definePageMeta({
  layout: false,
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Redirect if already authenticated
watchEffect(() => {
  if (isAuthenticated.value) {
    router.push('/dashboard')
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  }
  catch (e: any) {
    error.value = e.message || 'Login failed. Please check your credentials.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4>
    <div w-full max-w-md>
      <!-- Logo -->
      <div text-center mb-8>
        <div w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4>
          <span text-white text-3xl font-bold>SM</span>
        </div>
        <h1 text-3xl font-bold text-gray-900 dark:text-white>
          Welcome Back
        </h1>
        <p text-gray-600 dark:text-gray-300 mt-2>
          Sign in to your Social Media Manager account
        </p>
      </div>

      <!-- Login Form -->
      <div bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8>
        <form @submit.prevent="handleLogin">
          <!-- Error Message -->
          <div v-if="error" bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-4>
            {{ error }}
          </div>

          <!-- Email -->
          <div mb-4>
            <label for="email" block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Email Address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder="you@example.com"
            >
          </div>

          <!-- Password -->
          <div mb-6>
            <label for="password" block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2>
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder="••••••••"
            >
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            transition
          >
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Back to Home -->
        <div text-center mt-6>
          <NuxtLink to="/" text-indigo-600 dark:text-indigo-400 hover:underline>
            ← Back to Home
          </NuxtLink>
        </div>
      </div>

      <!-- Demo Account Info -->
      <div bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mt-6>
        <p text-sm text-blue-800 dark:text-blue-200 text-center>
          <strong>Demo:</strong> Create an account using the registration endpoint first.
        </p>
      </div>
    </div>
  </div>
</template>

