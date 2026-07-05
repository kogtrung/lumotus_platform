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
  quizTitle: string
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
  slug?: string | null
}

export interface QuizDetailResponse extends QuizSummary {
  updatedAt: string
  questions: QuizQuestion[]
}

export interface CreateQuizPayload {
  title: string
  description?: string
  coverImageUrl?: string
  deckId?: string
  timeLimitSeconds?: number
  questionCount?: number
}

// ============================================================
// AUTO-SAVE
// ============================================================

export interface SaveAnswerPayload {
  questionId: string
  answer: string
}

export interface OfflineAnswer {
  questionId: string
  answer: string
  answeredAt?: number
}

export interface SyncAnswersPayload {
  answers: OfflineAnswer[]
}

// ============================================================
// LEADERBOARD
// ============================================================

export interface QuizLeaderboardEntry {
  userId: string
  username: string
  bestScore: number
  totalAttempts: number
  bestCorrectAnswers: number
  bestTimeSeconds: number | null
}

export interface QuizAttemptSummary {
  attemptId: string
  quizId: string | null
  quizSlug: string | null
  quizTitle: string | null
  score: number | null
  totalQuestions: number | null
  correctAnswers: number | null
  xpEarned: number | null
  timeTakenSeconds: number | null
  startedAt: string | null
  finishedAt: string | null
}

// ============================================================
// API CLIENT
// ============================================================

export const quizApi = {
  // --- Explore (public approved quizzes) ---
  listExplore(params?: { page?: number; size?: number; sort?: string }) {
    return axiosClient.get<{ content: QuizSummary[]; totalElements: number; totalPages: number }>(
      '/quizzes/explore',
      { params }
    )
  },

  getExplore(quizId: string) {
    return axiosClient.get(`/quizzes/explore/${quizId}`)
  },

  // --- My quizzes (deprecated, kept for existing pages) ---
  listMine(params?: { page?: number; size?: number }) {
    return axiosClient.get<{ content: QuizSummary[]; totalElements: number; totalPages: number }>(
      '/quizzes/me',
      { params }
    )
  },

  listByDeck(deckId: string, params?: { page?: number; size?: number }) {
    return axiosClient.get<{ content: QuizSummary[]; totalElements: number; totalPages: number }>(
      `/quizzes/deck/${deckId}`,
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

  submitForReview(payload: { quizId: string }) {
    return axiosClient.post('/quizzes/submit-review', payload)
  },

  updateQuestion(quizId: string, questionId: string, payload: {
    questionText: string
    correctAnswer: string
    options: string[]
    questionType: string
  }) {
    return axiosClient.put(`/quizzes/${quizId}/questions/${questionId}`, payload)
  },

  addQuestion(quizId: string, payload: {
    questionText: string
    correctAnswer: string
    options: string[]
    questionType: string
  }) {
    return axiosClient.post(`/quizzes/${quizId}/questions`, payload)
  },

  deleteQuestion(quizId: string, questionId: string) {
    return axiosClient.delete(`/quizzes/${quizId}/questions/${questionId}`)
  },

  importUserCsv(payload: {
    csvContent: string
    deckId?: string
    title?: string
    description?: string
    timeLimitSeconds?: number
  }) {
    return axiosClient.post('/quizzes/import', payload)
  },

  // --- Play ---
  start(quizId: string) {
    return axiosClient.post<StartQuizResponse>(`/quizzes/${quizId}/start`)
  },

  // Auto-save answer (debounced)
  saveAnswer(attemptId: string, payload: SaveAnswerPayload) {
    return axiosClient.post(`/quizzes/sessions/${attemptId}/answer`, payload)
  },

  // Sync offline answers
  syncAnswers(attemptId: string, payload: SyncAnswersPayload) {
    return axiosClient.post(`/quizzes/sessions/${attemptId}/sync`, payload)
  },

  // Mark question as skipped (timeout)
  skipQuestion(attemptId: string, payload: { questionId: string }) {
    return axiosClient.post(`/quizzes/sessions/${attemptId}/skip`, payload)
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
    return axiosClient.get<Array<{
      attemptId: string
      quizId: string | null
      quizSlug: string | null
      quizTitle: string | null
      timeLimitSeconds: number | null
      startedAtEpochSecond: number
      remainingSeconds: number
    }>>('/quizzes/me/active-sessions')
  },

  quitSession(attemptId: string) {
    return axiosClient.post<{
      attemptId: string
      quizId: string | null
      quizSlug: string | null
      quizTitle: string | null
      score: number | null
      totalQuestions: number | null
      correctAnswers: number | null
      xpEarned: number | null
      timeTakenSeconds: number | null
      startedAt: string | null
      finishedAt: string | null
    }>(`/quizzes/quit/${attemptId}`)
  },

  // --- Leaderboard ---
  getLeaderboard(quizId: string, limit = 10) {
    return axiosClient.get<QuizLeaderboardEntry[]>(`/quizzes/${quizId}/leaderboard`, { params: { limit } })
  },

  // --- Admin Quiz Management ---
  createFromDeck(payload: CreateQuizPayload) {
    return axiosClient.post('/quizzes/admin/from-deck', payload)
  },

  createEmpty(payload: CreateQuizPayload) {
    return axiosClient.post('/quizzes/admin/empty', payload)
  },

  getAdminQuiz(quizId: string) {
    return axiosClient.get<QuizDetailResponse>(`/quizzes/admin/${quizId}`)
  },

  updateAdminQuiz(quizId: string, payload: Partial<CreateQuizPayload>) {
    return axiosClient.put(`/quizzes/admin/${quizId}`, payload)
  },

  deleteAdminQuiz(quizId: string) {
    return axiosClient.delete(`/quizzes/admin/${quizId}`)
  },

  publishQuiz(quizId: string) {
    return axiosClient.post(`/quizzes/admin/${quizId}/publish`)
  },

  unpublishQuiz(quizId: string) {
    return axiosClient.post(`/quizzes/admin/${quizId}/unpublish`)
  },

  updateAdminQuestion(quizId: string, questionId: string, payload: {
    questionText: string
    correctAnswer: string
    options: string[]
    questionType: string
  }) {
    return axiosClient.put(`/quizzes/admin/${quizId}/questions/${questionId}`, payload)
  },

  addAdminQuestion(quizId: string, payload: {
    questionText: string
    correctAnswer: string
    options: string[]
    questionType: string
  }) {
    return axiosClient.post(`/quizzes/admin/${quizId}/questions`, payload)
  },

  deleteAdminQuestion(quizId: string, questionId: string) {
    return axiosClient.delete(`/quizzes/admin/${quizId}/questions/${questionId}`)
  },

  listAdminAll(params?: { page?: number; size?: number; status?: string }) {
    return axiosClient.get('/quizzes/admin/all', { params })
  },

  getPendingCount() {
    return axiosClient.get<number>('/quizzes/admin/pending/count')
  },

  moderate(payload: {
    quizId: string
    action: 'APPROVE' | 'PUBLISH' | 'UNPUBLISH' | 'REJECT' | 'TOGGLE_PUBLIC' | 'DELETE'
    rejectionNote?: string
  }) {
    return axiosClient.post('/quizzes/admin/moderate', payload)
  },

  importFromCsv(payload: {
    csvContent: string
    title?: string
    description?: string
    timeLimitSeconds?: number
  }) {
    return axiosClient.post('/quizzes/admin/import', payload)
  },

  // --- Global Leaderboard ---
  getGlobalLeaderboard(limit = 50) {
    return axiosClient.get<Array<{
      userId: string
      username: string
      avatarUrl: string | null
      xp: number
      streak: number
      compositeScore: number
      rank: number
    }>>('/progress/leaderboard', { params: { limit } })
  },

  // --- Global Quiz Leaderboard (performance across all quizzes) ---
  getGlobalQuizLeaderboard(limit = 10) {
    return axiosClient.get<Array<{
      userId: string
      username: string
      avatarUrl: string | null
      avgBestScore: number
      totalAttempts: number
      totalCorrectAnswers: number
      totalTimeSeconds: number
      rank: number
    }>>('/quizzes/leaderboard', { params: { limit } })
  },
}
