import axiosClient from '@/api/axiosClient'

export interface ActivityDay {
  date: string
  cards: number
  quizzes: number
  xp: number
}

export interface ActivitySummary {
  daily: ActivityDay[]
  totalCards: number
  totalQuizzes: number
  totalXp: number
  activeDays: number
}

export interface WeeklySummary {
  days: ActivityDay[]
  thisWeek: { cards: number; quizzes: number; xp: number }
  lastWeek: { cards: number; quizzes: number; xp: number }
}

export interface DashboardStats {
  totalXp: number
  streak: number
  cardsLast7Days: number
  quizzesLast7Days: number
  xpLast7Days: number
  cardsToday: number
  quizzesToday: number
  xpToday: number
}

export const statsApi = {
  getDashboard() {
    return axiosClient.get<DashboardStats>('/stats/dashboard')
  },

  getActivity(params?: { days?: number }) {
    return axiosClient.get<ActivitySummary>('/stats/activity', { params })
  },

  getWeekly(offset = 0) {
    return axiosClient.get<WeeklySummary>('/stats/weekly', { params: { offset } })
  },
}
