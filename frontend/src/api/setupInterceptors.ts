import axiosClient from '@/api/axiosClient'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

let isRefreshing = false

export function setupAxiosInterceptors() {
  axiosClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config
      if (!original || original._retry) {
        return Promise.reject(error)
      }

      const isAuthEndpoint =
        original.url?.includes('/auth/login') ||
        original.url?.includes('/auth/register') ||
        original.url?.includes('/auth/refresh') ||
        original.url?.includes('/auth/google')

      if (error.response?.status !== 401 || isAuthEndpoint) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return Promise.reject(error)
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await authApi.refresh()
        useAuthStore.getState().setAuth(data.accessToken, data.user)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return axiosClient(original)
      } catch {
        useAuthStore.getState().clearAuth()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    },
  )
}

/** Khôi phục phiên: dùng accessToken đã lưu; chỉ gọi /refresh khi token hết hạn. Khách không gọi /refresh. */
export async function initializeAuth() {
  const { accessToken, user, setAuth, clearAuth, setInitialized } = useAuthStore.getState()

  try {
    if (accessToken && user) {
      try {
        const { data } = await authApi.me()
        setAuth(accessToken, data)
      } catch {
        const { data } = await authApi.refresh()
        setAuth(data.accessToken, data.user)
      }
    }
  } catch {
    clearAuth()
  } finally {
    setInitialized(true)
  }
}
