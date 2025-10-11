export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')

  const apiCall = async <T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    const response = await fetch(`${config.public.apiBase}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || error.statusMessage || 'Request failed')
    }

    return response.json()
  }

  return {
    get: <T>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data?: any) =>
      apiCall<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    put: <T>(endpoint: string, data?: any) =>
      apiCall<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    delete: <T>(endpoint: string) => apiCall<T>(endpoint, { method: 'DELETE' }),
  }
}

export const useAuth = () => {
  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  const router = useRouter()

  const login = async (email: string, password: string) => {
    const response = await $fetch<any>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    if (response.success && response.token) {
      token.value = response.token
      return response.user
    }

    throw new Error('Login failed')
  }

  const logout = () => {
    token.value = null
    router.push('/login')
  }

  const isAuthenticated = computed(() => !!token.value)

  return {
    login,
    logout,
    isAuthenticated,
    token,
  }
}

