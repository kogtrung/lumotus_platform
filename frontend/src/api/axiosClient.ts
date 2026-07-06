import axios from 'axios'
import { lumotoast } from '@/components/ui/Toast'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Global interceptor: handle 429 cooldown errors — toast message comes from backend
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const message = error.response.data?.message ?? 'Bạn bị giới hạn làm quiz. Vui lòng thử lại sau.'
      lumotoast.error(message)
      return Promise.reject(new axios.Cancel('cooldown'))
    }
    return Promise.reject(error)
  }
)

export default axiosClient
