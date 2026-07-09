import axiosClient from '@/api/axiosClient'
import type { PageResponse } from '@/types/deck'

export interface AdminStats {
  totalUsers: number
  totalDecks: number
  totalCards: number
  totalQuizzes: number
  totalQuizAttempts: number
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
  deckCount: number
  totalCards: number
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

export interface DailyActivityAdmin {
  userId: string
  username: string
  date: string
  cardsReviewed: number
  xpEarned: number
  quizTaken: number
  studyMinutes?: number
  streak?: number
  deckCount?: number
}

export interface AdminChartDataPoint {
  date: string
  newUsers: number
  newDecks: number
  quizAttempts: number
}

// ============================================================
// Quiz Cooldown Types
// ============================================================

export interface CooldownSettings {
  id: string
  enabled: boolean
  minSecondsBetweenAttempts: number
  maxAttemptsPerQuizPerDay: number
  maxTotalAttemptsPerDay: number
  maxTotalAttemptsPerWeek: number
  bypassUserId: string | null
  bypassQuizId: string | null
  bypassExpiresAt: string | null
  bypassReason: string | null
  updatedAt: string
}

export interface CooldownCheckResult {
  quizId: string
  allowed: boolean
  violation: 'NONE' | 'COOLDOWN_PERIOD' | 'DAILY_QUIZ_LIMIT' | 'DAILY_TOTAL_LIMIT' | 'WEEKLY_TOTAL_LIMIT' | 'GLOBAL_DISABLED'
  message: string | null
  cooldownEndsAt: string | null
  secondsUntilCooldownEnds: number
  attemptsUsed: number | null
  attemptsLimit: number | null
}

export interface UpdateCooldownSettingsPayload {
  enabled: boolean
  minSecondsBetweenAttempts: number
  maxAttemptsPerQuizPerDay: number
  maxTotalAttemptsPerDay: number
  maxTotalAttemptsPerWeek: number
}

export interface BypassCooldownPayload {
  userId: string
  quizId: string
  expiresAt?: string
  reason?: string
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

  getQuizAttempts(params?: { page?: number; size?: number; status?: string }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>('/admin/quiz-attempts', { params })
  },

  getStudyHistory(params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<DailyActivityAdmin>>('/admin/study-history', { params })
  },

  getUserQuizAttempts(userId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>(`/admin/quiz-attempts/user/${userId}`, { params })
  },

  getQuizAttemptDetails(quizId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<QuizAttemptAdmin>>(`/admin/quiz-attempts/quiz/${quizId}`, { params })
  },

  getChartStats(params?: { startDate?: string; endDate?: string }) {
    return axiosClient.get<AdminChartDataPoint[]>('/admin/stats/charts', { params })
  },

  getUserStudyHistory(userId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<PageResponse<DailyActivityAdmin>>(`/admin/study-history/user/${userId}`, { params })
  },

  // ============================================================
  // Quiz Cooldown Settings
  // ============================================================

  getCooldownSettings() {
    return axiosClient.get<CooldownSettings>('/admin/quiz-cooldown/settings')
  },

  updateCooldownSettings(payload: UpdateCooldownSettingsPayload) {
    return axiosClient.put<CooldownSettings>('/admin/quiz-cooldown/settings', payload)
  },

  bypassCooldown(payload: BypassCooldownPayload) {
    return axiosClient.post<CooldownSettings>('/admin/quiz-cooldown/bypass', payload)
  },

  clearBypass() {
    return axiosClient.delete<CooldownSettings>('/admin/quiz-cooldown/bypass')
  },

  checkCooldown(userId: string, quizId: string) {
    return axiosClient.get<CooldownCheckResult>('/admin/quiz-cooldown/check', {
      params: { userId, quizId },
    })
  },
}
