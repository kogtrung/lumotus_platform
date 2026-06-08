import axiosClient from '@/api/axiosClient'
import type { Topic } from '@/types/deck'

export const topicsApi = {
  list: () => axiosClient.get<Topic[]>('/topics'),
}
