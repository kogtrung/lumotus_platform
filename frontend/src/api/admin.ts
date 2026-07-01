import axiosClient from '@/api/axiosClient'
import type { PageResponse } from '@/types/deck'

export interface AdminStats {
  totalUsers: number
  totalDecks: number
  totalCards: number
  totalQuizzes: number
  totalActiveUsersToday: number
  totalReviewsToday: number
  totalXpAwardedToday: number
}

export interface UserAdmin {
  id: string
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  xp: number
  streak: number
  createdAt: string
  active: boolean
}

export interface UpdateUserPayload {
  role?: 'USER' | 'ADMIN'
  active?: boolean
}

export const adminApi = {
  getStats() {
    return axiosClient.get<AdminStats>('/admin/stats')
  },

  getUsers(params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<UserAdmin>>('/admin/users', { params })
  },

  getUser(userId: string) {
    return axiosClient.get<UserAdmin>(`/admin/users/${userId}`)
  },

  updateUser(userId: string, payload: UpdateUserPayload) {
    return axiosClient.patch<UserAdmin>(`/admin/users/${userId}`, payload)
  },
}
