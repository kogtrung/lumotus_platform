import axiosClient from '@/api/axiosClient'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivityDay {
  date: string
  cards: number
  quizzes: number
  xp: number
}

export interface ProgressData {
  xp: number
  streak: number
  lastStudyDate: string | null
  heatmap: ActivityDay[]
  rank: number | null
  totalParticipants: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  avatarUrl: string | null
  xp: number
  streak: number
  compositeScore: number
  rank: number
}

export interface DashboardStats {
  totalXp: number
  streak: number
  cardsLast7Days: number
  quizzesLast7Days: number
  xpLast7Days: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const progressApi = {
  /**
   * GET /api/v1/progress/me
   * Full progress: XP, streak, heatmap 365 days, rank, total participants.
   */
  getMyProgress() {
    return axiosClient.get<ProgressData>('/progress/me')
  },

  /**
   * GET /api/v1/progress/heatmap?year=2026&month=7
   * Heatmap for a specific month.
   */
  getHeatmap(year: number, month: number) {
    return axiosClient.get<ActivityDay[]>('/progress/heatmap', {
      params: { year, month },
    })
  },

  /**
   * GET /api/v1/progress/leaderboard?limit=50
   * Global leaderboard (XP + streak composite score).
   */
  getLeaderboard(limit = 50) {
    return axiosClient.get<LeaderboardEntry[]>('/progress/leaderboard', {
      params: { limit },
    })
  },

  /**
   * GET /api/v1/stats/dashboard
   * Quick stats for dashboard: XP, streak, 7-day cards/quizzes/XP.
   */
  getDashboard() {
    return axiosClient.get<DashboardStats>('/stats/dashboard')
  },
}
