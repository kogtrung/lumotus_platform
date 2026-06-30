import axiosClient from '@/api/axiosClient'

// ============================================================
// SHARED TYPES
// ============================================================

export interface QuizQuestion {
  id: string
  questionType: string
  questionText: string
  correctAnswer: string
  options: string[]
  sortOrder: number
}

export interface QuizAnswer {
  questionId: string
  selectedAnswer: string
}

export interface QuizResultDetail {
  questionId: string
  questionText: string
  correctAnswer: string
  selectedAnswer: string
  correct: boolean
}

// ============================================================
// START
// ============================================================

export interface StartQuizResponse {
  attemptId: string
  deckTitle: string
  totalQuestions: number
  timeLimitSeconds: number | null
  startedAtEpochSecond: number
  questions: QuizQuestion[]
}

export interface QuizSessionResumeResponse {
  remainingSeconds: number
  startedAtEpochSecond: number
  timeLimitSeconds: number | null
  sessionFound: boolean
}

export interface StartQuizPayload {
  quizId: string
}

// ============================================================
// SUBMIT
// ============================================================

export interface QuizSubmitPayload {
  attemptId: string
  answers: QuizAnswer[]
  timeTakenSeconds?: number
}

export interface QuizResultResponse {
  attemptId: string
  quizId: string | null
  quizTitle: string | null
  score: number
  totalQuestions: number
  correctAnswers: number
  xpEarned: number
  timeTakenSeconds: number
  startedAt: string
  finishedAt: string
  details: QuizResultDetail[]
}

// ============================================================
// QUIZ — public explore & my quizzes
// ============================================================

export interface QuizSummary {
  id: string
  title: string
  description: string | null
  coverImageUrl: string | null
  deckId: string | null
  deckTitle: string | null
  ownerId: string
  ownerUsername: string | null
  isPublic: boolean
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionNote: string | null
  timeLimitSeconds: number | null
  questionCount: number
  attemptCount: number
  avgScore: number | null
  createdAt: string
  quizType?: 'GENERATED' | 'IMPORTED'
  isImmutable?: boolean
}

export interface QuizDetailResponse extends QuizSummary {
  updatedAt: string
  questions: QuizQuestion[]
}

export interface CreateQuizPayload {
  title: string
  description?: string
  coverImageUrl?: string
  deckId: string
  timeLimitSeconds?: number
  questionCount: number
}

export interface SubmitReviewPayload {
  quizId: string
}

// ============================================================
// LEADERBOARD
// ============================================================

export interface LeaderboardEntry {
  userId: string
  username: string
  bestScore: number
  totalAttempts: number
  bestCorrectAnswers: number
  bestTimeSeconds: number | null
}

// ============================================================
// API CLIENT
// ============================================================

export const quizApi = {
  // --- Explore (public approved quizzes) ---
  listExplore(params?: { page?: number; size?: number }) {
    return axiosClient.get<{ content: QuizSummary[]; totalElements: number; totalPages: number }>(
      '/quizzes/explore',
      { params }
    )
  },

  getExplore(quizId: string) {
    return axiosClient.get(`/quizzes/explore/${quizId}`)
  },

  // --- My quizzes ---
  listMine(params?: { page?: number; size?: number }) {
    return axiosClient.get<{ content: QuizSummary[]; totalElements: number; totalPages: number }>(
      '/quizzes/me',
      { params }
    )
  },

  create(payload: CreateQuizPayload) {
    return axiosClient.post('/quizzes', payload)
  },

  getMy(quizId: string) {
    return axiosClient.get<QuizDetailResponse>(`/quizzes/me/${quizId}`)
  },

  update(quizId: string, payload: Partial<CreateQuizPayload>) {
    return axiosClient.put(`/quizzes/${quizId}`, payload)
  },

  delete(quizId: string) {
    return axiosClient.delete(`/quizzes/${quizId}`)
  },

  submitForReview(payload: SubmitReviewPayload) {
    return axiosClient.post('/quizzes/submit-review', payload)
  },

  updateQuestion(quizId: string, questionId: string, payload: { questionText: string; correctAnswer: string; options: string[]; questionType: string }) {
    return axiosClient.put(`/quizzes/${quizId}/questions/${questionId}`, payload)
  },

  // --- Play ---
  start(quizId: string) {
    return axiosClient.post<StartQuizResponse>(`/quizzes/${quizId}/start`)
  },

  submit(payload: QuizSubmitPayload) {
    return axiosClient.post<QuizResultResponse>('/quizzes/submit', {
      attemptId: payload.attemptId,
      answers: payload.answers,
      timeTakenSeconds: payload.timeTakenSeconds,
    })
  },

  resumeSession(attemptId: string) {
    return axiosClient.get<QuizSessionResumeResponse>(`/quizzes/resume/${attemptId}`)
  },

  heartbeat(attemptId: string) {
    return axiosClient.post('/quizzes/session/heartbeat', { attemptId })
  },

  getAttemptResult(attemptId: string) {
    return axiosClient.get<QuizResultResponse>(`/quizzes/attempts/${attemptId}`)
  },

  getMyHistory(params?: { page?: number; size?: number }) {
    return axiosClient.get('/quizzes/attempts', { params })
  },

  getActiveSessions() {
    return axiosClient.get<Array<{ attemptId: string; quizId: string | null; quizTitle: string | null; timeLimitSeconds: number | null; startedAtEpochSecond: number; remainingSeconds: number }>>('/quizzes/me/active-sessions')
  },

  // --- Leaderboard ---
  getLeaderboard(quizId: string, limit = 10) {
    return axiosClient.get<LeaderboardEntry[]>(`/quizzes/${quizId}/leaderboard`, { params: { limit } })
  },
}
