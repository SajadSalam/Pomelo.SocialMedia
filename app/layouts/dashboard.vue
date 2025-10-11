<script setup lang="ts">
const { logout, isAuthenticated } = useAuth()
const route = useRoute()
const sidebarOpen = ref(false)

// Redirect to login if not authenticated
watchEffect(() => {
  if (!isAuthenticated.value) {
    navigateTo('/login')
  }
})

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Clients', path: '/clients', icon: '👥' },
  { name: 'Posts', path: '/posts', icon: '📝' },
  { name: 'Queue', path: '/queue', icon: '⏳' },
  { name: 'Analytics', path: '/analytics', icon: '📈' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div min-h-screen bg-gray-50 dark:bg-gray-900>
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="sidebarOpen"
      fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div flex items-center gap-2 px-6 py-6 border-b border-gray-200 dark:border-gray-700>
        <div w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center>
          <span text-white text-xl font-bold>SM</span>
        </div>
        <span text-xl font-bold text-gray-900 dark:text-white>SM Manager</span>
      </div>

      <!-- Navigation -->
      <nav px-4 py-6 space-y-1>
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition',
            isActive(item.path)
              ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="sidebarOpen = false"
        >
          <span text-xl>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Logout Button -->
      <div absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700>
        <button
          w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400
          hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition
          @click="logout"
        >
          <span text-xl>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div lg:ml-64>
      <!-- Header -->
      <header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4>
        <div flex items-center justify-between>
          <!-- Mobile Menu Button -->
          <button
            lg:hidden
            p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
            @click="sidebarOpen = !sidebarOpen"
          >
            <span text-2xl>☰</span>
          </button>

          <!-- Breadcrumb -->
          <div flex-1 ml-4>
            <h1 text-2xl font-bold text-gray-900 dark:text-white>
              {{ navigation.find(n => isActive(n.path))?.name || 'Dashboard' }}
            </h1>
          </div>

          <!-- Dark Mode Toggle -->
          <DarkToggle />
        </div>
      </header>

      <!-- Page Content -->
      <main p-4 lg:p-8>
        <slot />
      </main>
    </div>
  </div>
</template>

