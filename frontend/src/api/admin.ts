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

export interface QuizAttemptAdmin {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  quizId: string | null
  quizTitle: string | null
  quizSlug: string | null
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  score: number
  totalQuestions: number
  correctAnswers: number
  skippedAnswers: number
  xpEarned: number
  timeTakenSeconds: number | null
  startedAt: string
  finishedAt: string | null
  answers?: QuizAnswerDetail[]
}

export interface QuizAnswerDetail {
  id: string
  questionId: string | null
  questionText: string | null
  userAnswer: string | null
  correctAnswer: string | null
  correct: boolean
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

  getQuizAttempts(params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>('/admin/quiz-attempts', { params })
  },

  getUserQuizAttempts(userId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>(`/admin/quiz-attempts/user/${userId}`, { params })
  },

  getQuizAttemptDetails(quizId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>(`/admin/quiz-attempts/quiz/${quizId}`, { params })
  },
}
