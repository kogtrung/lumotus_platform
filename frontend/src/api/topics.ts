import axiosClient from '@/api/axiosClient'
import type { Topic } from '@/types/deck'

export interface CreateTopicPayload {
  name: string
  slug: string
  description?: string
  icon?: string
  colorHex?: string
  sortOrder?: number
}

export interface UpdateTopicPayload {
  name?: string
  description?: string
  icon?: string
  colorHex?: string
  sortOrder?: number
}

export const topicsApi = {
  list: () => axiosClient.get<Topic[]>('/topics'),

  get: (topicRef: string) => axiosClient.get<Topic>(`/topics/${topicRef}`),

  create: (data: CreateTopicPayload) => axiosClient.post<Topic>('/topics', data),

  update: (topicRef: string, data: UpdateTopicPayload) =>
    axiosClient.put<Topic>(`/topics/${topicRef}`, data),

  delete: (topicRef: string) => axiosClient.delete(`/topics/${topicRef}`),
}
