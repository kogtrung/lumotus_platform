import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lumotoast } from '@/components/ui/Toast'
import ExitConfirmDialog from '@/components/ui/ExitConfirmDialog'
import { X, RotateCcw, Zap, Check, Clock, Target, BookOpen, Info } from 'lucide-react'
import { quizApi } from '@/api/study'
import QuizResult from '@/components/quiz/QuizResult'
import Button from '@/components/ui/Button'
import type { QuizQuestion } from '@/api/study'
import { cn } from '@/utils/cn'

type SessionPhase = 'loading' | 'session' | 'result'

interface Question {
  questionId: string
  front: string
  correctAnswer: string
  options: string[]
}

interface LocaleStrings {
  loading: string
  notFound: string
  backToQuiz: string
  retry: string
  otherQuiz: string
  expiredTitle: string
  expiredBody: string
  exitTitle: string
  exitBody: string
  exitEnd: string
  exitEndHint: string
  stay: string
  question: string
  questions: string
  submit: string
  submitting: string
  answered: string
  unanswered: string
  hint: string
  questionExpired: string
  rules: string
  rulesTitle: string
  submitTitle: string
  submitBody: string
  submitConfirm: string
  submitCancel: string
}

const EN: LocaleStrings = {
  loading: 'Loading quiz...',
  notFound: 'Quiz not found.',
  backToQuiz: 'Back to Quiz',
  retry: 'Retry',
  otherQuiz: 'Browse quizzes',
  expiredTitle: 'Time is up!',
  expiredBody: 'Your session has expired.',
  exitTitle: 'Leave quiz?',
  exitBody: 'You have unsaved answers. What would you like to do?',
  exitEnd: 'End session',
  exitEndHint: 'Quit and discard answers',
  stay: 'Continue quiz',
  question: 'Question',
  questions: 'Questions',
  submit: 'Submit',
  submitting: 'Submitting...',
  answered: 'Answered',
  unanswered: 'Unanswered',
  hint: 'Choose your answer',
  questionExpired: 'Time expired - auto marked wrong',
  rules: 'Quiz Rules',
  rulesTitle: 'How to play',
  submitTitle: 'Submit quiz?',
  submitBody: 'You have answered {answered}/{total} questions. Are you sure you want to submit?',
  submitConfirm: 'Submit now',
  submitCancel: 'Continue',
}

const VI: LocaleStrings = {
  loading: 'Đang tải quiz...',
  notFound: 'Không tìm thấy quiz.',
  backToQuiz: 'Về Quiz',
  retry: 'Chơi lại',
  otherQuiz: 'Quiz khác',
  expiredTitle: 'Hết giờ!',
  expiredBody: 'Phiên làm bài đã kết thúc.',
  exitTitle: 'Thoát quiz?',
  exitBody: 'Bạn có câu trả lời chưa lưu. Chọn hành động:',
  exitEnd: 'Kết thúc',
  exitEndHint: 'Thoát và hủy câu trả lời',
  stay: 'Tiếp tục',
  question: 'Câu hỏi',
  questions: 'Câu',
  submit: 'Nộp bài',
  submitting: 'Đang nộp...',
  answered: 'Đã trả lời',
  unanswered: 'Chưa trả lời',
  hint: 'Chọn đáp án của bạn',
  questionExpired: 'Hết giờ - tự động tính sai',
  rules: 'Quy luật',
  rulesTitle: 'Cách chơi',
  submitTitle: 'Nộp bài?',
  submitBody: 'Bạn đã trả lời {answered}/{total} câu. Xác nhận nộp bài?',
  submitConfirm: 'Nộp ngay',
  submitCancel: 'Tiếp tục',
}

// Debounce utility
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }) as T
}

const QUIZ_SESSION_KEY = (qid: string) => `quiz_session_${qid}`
const OFFLINE_ANSWERS_KEY = (qid: string) => `quiz_offline_${qid}`

interface QuizSessionCache {
  attemptId: string
  quizRef: string
  quizTitle: string
  startedAt: number
  questions: Question[]
  answers: Record<string, string>
  answeredSet: number[]
  navIndex: number
}

export interface QuizPlayProps {
  locale?: 'vi' | 'en'
}

export default function QuizPlayPage({ locale = 'vi' }: QuizPlayProps) {
  const t = locale === 'en' ? EN : VI
  const params = useParams<{ quizRef?: string; attemptId?: string }>()
  const quizRef = params.quizRef ?? ''
  const urlAttemptId = params.attemptId ?? ''
  const navigate = useNavigate()
  const qc = useQueryClient()
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [navIndex, setNavIndex] = useState(0)
  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<{
    correct: number; total: number; xpEarned: number; score: number
    startedAt?: string; finishedAt?: string
    details: Array<{ questionId: string; questionText: string; correctAnswer: string; selectedAnswer: string; correct: boolean }>
  } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null)
  const [expiredSet, setExpiredSet] = useState<Set<number>>(new Set())
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number | null>(null) // Per-question timer from admin config
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  // ─── Submit quiz mutation (base for timer ref) ───────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () =>
      quizApi.submit({
        attemptId,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
        timeTakenSeconds: timeRemaining != null ? timeRemaining : undefined,
      }).then((r) => r.data),
    onSuccess: (data) => {
      clearSessionCache(quizRef)
      setResult({
        correct: data.correctAnswers,
        total: data.totalQuestions,
        xpEarned: data.xpEarned,
        score: data.score,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        details: data.details ?? [],
      })
      setPhase('result')
      qc.invalidateQueries({ queryKey: ['quiz', 'me'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'active-sessions'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'attempts'] })
      qc.invalidateQueries({ queryKey: ['progress', 'me'] })
      qc.invalidateQueries({ queryKey: ['stats', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['stats', 'weekly'] })
      qc.invalidateQueries({ queryKey: ['stats', 'activity'] })
    },
    onError: async (err: unknown) => {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const message = e?.response?.data?.message || ''
      const isValidationError = message.toLowerCase().includes('answers')
      if (e?.response?.status === 400 && isValidationError) {
        if (result) {
          setPhase('result')
          return
        }
      }
      if (message === 'Quiz session has expired') {
        setSessionExpired(true)
        clearSessionCache(quizRef)
        lumotoast.error('Phiên làm bài đã hết hạn')
      } else {
        lumotoast.error(message || 'Không nộp được bài')
      }
    },
  })

  // Refs for timer callback to avoid circular deps
  const questionsRef = useRef(questions)
  const navIndexRef = useRef(navIndex)
  const answeredSetRef = useRef(answeredSet)
  const timeRemainingRef = useRef(timeRemaining)
  const attemptIdRef = useRef(attemptId)

  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { navIndexRef.current = navIndex }, [navIndex])
  useEffect(() => { answeredSetRef.current = answeredSet }, [answeredSet])
  useEffect(() => { timeRemainingRef.current = timeRemaining }, [timeRemaining])
  useEffect(() => { attemptIdRef.current = attemptId }, [attemptId])
  const submitMutationBaseRef = useRef(submitMutation)
  useEffect(() => { submitMutationBaseRef.current = submitMutation }, [submitMutation])

  // ─── Session cache helpers ────────────────────────────────
  const loadCachedSession = (qid: string): QuizSessionCache | null => {
    try {
      const raw = localStorage.getItem(QUIZ_SESSION_KEY(qid))
      if (!raw) return null
      const session: QuizSessionCache = JSON.parse(raw)
      const ttlMs = 2 * 60 * 60 * 1000
      if (Date.now() - session.startedAt > ttlMs) {
        localStorage.removeItem(QUIZ_SESSION_KEY(qid))
        return null
      }
      return session
    } catch {
      return null
    }
  }

  const saveSessionCache = (qid: string, data: QuizSessionCache) => {
    try {
      localStorage.setItem(QUIZ_SESSION_KEY(qid), JSON.stringify(data))
    } catch { /* ignore */ }
  }

  const clearSessionCache = (qid: string) => {
    try {
      localStorage.removeItem(QUIZ_SESSION_KEY(qid))
      localStorage.removeItem(OFFLINE_ANSWERS_KEY(qid))
    } catch { /* ignore */ }
  }

  // ─── Offline answers helpers ─────────────────────────────
  const saveOfflineAnswers = (qid: string, data: Record<string, string>) => {
    try {
      localStorage.setItem(OFFLINE_ANSWERS_KEY(qid), JSON.stringify(data))
    } catch { /* ignore */ }
  }

  const loadOfflineAnswers = (qid: string): Record<string, string> | null => {
    try {
      const raw = localStorage.getItem(OFFLINE_ANSWERS_KEY(qid))
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  // ─── Sync offline answers ────────────────────────────────
  const syncOfflineAnswers = useCallback(async () => {
    if (!attemptId || !quizRef) return
    const offlineData = loadOfflineAnswers(quizRef)
    if (!offlineData || Object.keys(offlineData).length === 0) return
    try {
      const answersToSync = Object.entries(offlineData).map(([questionId, answer]) => ({
        questionId,
        answer,
        answeredAt: Date.now(),
      }))
      await quizApi.syncAnswers(attemptId, { answers: answersToSync })
      lumotoast.success('Đã đồng bộ câu trả lời offline')
      localStorage.removeItem(OFFLINE_ANSWERS_KEY(quizRef))
    } catch (err) {
      console.warn('Sync offline answers failed:', err)
    }
  }, [attemptId, quizRef])

  // ─── Auto-save with debounce (2.5s) ────────────────────
  const autoSaveAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!attemptId) return
    if (!isOnline) {
      const offlineData = loadOfflineAnswers(quizRef) || {}
      offlineData[questionId] = answer
      saveOfflineAnswers(quizRef, offlineData)
      return
    }
    try {
      await quizApi.saveAnswer(attemptId, { questionId, answer })
    } catch (err) {
      console.warn('Auto-save failed:', err)
      const offlineData = loadOfflineAnswers(quizRef) || {}
      offlineData[questionId] = answer
      saveOfflineAnswers(quizRef, offlineData)
    }
  }, [attemptId, isOnline, quizRef])

  const debouncedAutoSave = useMemo(
    () => debounce(autoSaveAnswer, 0),
    [autoSaveAnswer]
  )

  // ─── Online/Offline detection ─────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineAnswers()
    }
    const handleOffline = () => {
      setIsOnline(false)
      lumotoast.warning('Mất kết nối. Câu trả lời sẽ được lưu offline.')
    }
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncOfflineAnswers])

  // ─── Start quiz mutation ───────────────────────────────
  const startMutation = useMutation({
    mutationFn: () => {
      const trimmed = quizRef.trim()
      if (!trimmed) {
        lumotoast.error('Thiếu quizRef, không thể bắt đầu bài quiz')
        return Promise.reject(new Error('missing quizRef'))
      }
      return quizApi.start(trimmed).then((r) => r.data)
    },
    onSuccess: (data) => {
      const mapped: Question[] = data.questions.map((q: QuizQuestion) => ({
        questionId: q.id,
        front: q.questionText,
        correctAnswer: q.correctAnswer,
        options: q.options,
      }))
      setQuestions(mapped)
      setQuizTitle(data.quizTitle)
      setAttemptId(data.attemptId)
      if (Object.keys(answers).length === 0) {
        setAnswers({})
        setAnsweredSet(new Set())
        setNavIndex(0)
      }
      qc.invalidateQueries({ queryKey: ['quiz', 'active-sessions'] })
      setResult(null)
      setExpiredSet(new Set())
      // Use per-question time limit from quiz config, default to 30s if not set
      const perQuestionTime = data.timeLimitSeconds && data.timeLimitSeconds > 0 ? data.timeLimitSeconds : 30
      setQuestionTimeLimit(perQuestionTime)
      setQuestionTimeRemaining(perQuestionTime)
      saveSessionCache(quizRef, {
        attemptId: data.attemptId,
        quizRef,
        quizTitle: data.quizTitle,
        startedAt: Date.now(),
        questions: mapped,
        answers,
        answeredSet: Array.from(answeredSet),
        navIndex,
      })
      setPhase('session')
    },
    onError: (err: unknown) => {
      const e = err as { message?: string; isAxiosError?: boolean; config?: { cancelled?: boolean } }
      const isCooldownCancel = e?.message === 'cooldown' || (e as { isCanceled?: boolean })?.isCanceled
      if (isCooldownCancel) {
        navigate('/quiz')
        return
      }
      if (e?.message !== 'missing quizRef') {
        lumotoast.error(e?.message || 'Lỗi khi bắt đầu quiz')
      }
      navigate('/quiz')
    },
  })

  // ─── Timer countdown - resets on each new question ─────────────────────────
  useEffect(() => {
    if (phase !== 'session') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    if (questionTimeLimit === null) return
    if (questionTimeRemaining === null) {
      setQuestionTimeRemaining(questionTimeLimit)
      return
    }

    timerRef.current = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          // Time's up - auto skip to next question
          const currentNavIdx = navIndexRef.current
          const question = questionsRef.current[currentNavIdx]
          if (question && !answeredSetRef.current.has(currentNavIdx)) {
            setExpiredSet((prevSet) => new Set(prevSet).add(currentNavIdx))
            // Call skip API
            quizApi.skipQuestion(attemptIdRef.current, { questionId: question.questionId }).catch(() => {})
          }
          if (currentNavIdx < questionsRef.current.length - 1) {
            setNavIndex(currentNavIdx + 1)
          } else {
            // Last question timed out - submit
            setPhase('result')
            submitMutationBaseRef.current.mutate()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, questionTimeRemaining]) // Re-run on questionTimeRemaining changes

  // ─── Smooth progress bar animation based on current question ───────────────────
  useEffect(() => {
    if (phase !== 'session' || questions.length === 0) return
    // Progress is based on current position: (answeredCount + currentPosition) / total
    const targetProgress = (navIndex + 1) / questions.length
    setDisplayProgress(targetProgress)
    }, [phase, navIndex, questions.length])
  // ─── Reset timer on new question ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'session' && questionTimeLimit !== null) {
      setQuestionTimeRemaining(questionTimeLimit)
    }
  }, [navIndex, questionTimeLimit])
  useEffect(() => {
    if (phase !== 'loading') return

    // If accessing via /quiz/result/:attemptId, fetch and show result directly
    if (urlAttemptId) {
      quizApi.getAttemptResult(urlAttemptId).then((r) => {
        const data = r.data
        setResult({
          correct: data.correctAnswers,
          total: data.totalQuestions,
          xpEarned: data.xpEarned ?? 0,
          score: data.score ?? 0,
          startedAt: data.startedAt,
          finishedAt: data.finishedAt,
          details: data.details ?? [],
        })
        setQuizTitle(data.quizTitle || 'Quiz Result')
        setPhase('result')
      }).catch(() => {
        lumotoast.error('Không tải được kết quả quiz')
        navigate('/quiz/history')
      })
      return
    }

    const cached = loadCachedSession(quizRef)
    if (cached) {
      // Resume from cached session - don't start a new quiz
      setQuestions(cached.questions)
      setAnswers(cached.answers)
      setAnsweredSet(new Set(cached.answeredSet))
      setNavIndex(Math.min(cached.navIndex, Math.max(0, cached.questions.length - 1)))
      setAttemptId(cached.attemptId)
      setResult(null)
      setExpiredSet(new Set())
      // Get quiz title from cached session or use quizRef
      setQuizTitle(cached.quizTitle || quizRef)
      // Use per-question time limit from quiz config, default to 30s if not set
      const perQuestionTime = 30
      setQuestionTimeLimit(perQuestionTime)
      setQuestionTimeRemaining(perQuestionTime)
      setPhase('session')
      return // Don't start a new quiz
    }
    // No cached session - start a new quiz
    startMutation.mutate()
  }, [phase, quizRef])

  // ─── Heartbeat ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'session' || !attemptId) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      return
    }
    heartbeatRef.current = setInterval(() => {
      quizApi.heartbeat(attemptId).catch(() => {})
    }, 60000)
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [phase, attemptId])

  // ─── Persist answers to localStorage on change ──────────
  useEffect(() => {
    if (phase !== 'session' || !attemptId) return
    const cached = loadCachedSession(quizRef)
    if (cached) {
      saveSessionCache(quizRef, {
        ...cached,
        answers,
        answeredSet: Array.from(answeredSet),
        navIndex,
      })
    }
  }, [answers, answeredSet, navIndex, phase, attemptId, quizRef])

  // ─── Answer handler with auto-save ─────────────────────
  const handleAnswer = useCallback((qid: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }))
    debouncedAutoSave(qid, answer)
    // Clear expired/skipped status for this question since user answered
    setExpiredSet((prev) => {
      const next = new Set(prev)
      const idx = questions.findIndex((q) => q.questionId === qid)
      if (idx >= 0) next.delete(idx)
      return next
    })
  }, [debouncedAutoSave, questions])

  // ─── Submit ────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    submitMutation.mutate()
  }, [submitMutation])

  // ─── Exit handlers ─────────────────────────────────────
  const handleExit = useCallback(() => {
    if (phase === 'session') {
      setShowExitDialog(true)
      return
    }
    // If viewing result from history, go back to history
    if (urlAttemptId) {
      navigate('/quiz/history')
      return
    }
    navigate('/quiz')
  }, [phase, navigate, urlAttemptId])

  const handleExitEnd = useCallback(async () => {
    setShowExitDialog(false)
    const idToQuit = attemptId
    clearSessionCache(quizRef)
    navigate('/quiz')
    if (idToQuit) {
      try {
        await quizApi.quitSession(idToQuit)
      } catch (err) {
        console.warn('quitSession failed:', err)
      }
      qc.invalidateQueries({ queryKey: ['quiz', 'active-sessions'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'attempts'] })
    }
  }, [attemptId, quizRef, qc, navigate])

  const handleExitCancel = useCallback(() => {
    setShowExitDialog(false)
  }, [])

  const handleRestart = useCallback(() => {
    clearSessionCache(quizRef)
    setQuestions([])
    setAttemptId('')
    setAnswers({})
    setNavIndex(0)
    setAnsweredSet(new Set())
    setResult(null)
    setTimeRemaining(null)
    setQuestionTimeRemaining(null)
    setQuestionTimeLimit(null)
    setExpiredSet(new Set())
    setSessionExpired(false)
    setPhase('loading')
  }, [quizRef])

  const currentQ = questions[navIndex]
  const currentAnswer = currentQ ? answers[currentQ.questionId] ?? null : null
  const answeredCount = answeredSet.size
  const isNotFound = startMutation.isError && !attemptId

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1520 0%, #252035 50%, #1a1520 100%)' }}>
      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#3D3348] border-t-[#EC4899]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#EC4899]/20" />
              </div>
            </div>
            <p className="text-base font-semibold text-[#8B7A9E]">{t.loading}</p>
          </div>
        </div>
      )}

      {/* Not found */}
      {phase !== 'loading' && isNotFound && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-[#EF4444]">{t.notFound}</p>
            <Button onClick={() => navigate('/quiz')} className="mt-4">{t.backToQuiz}</Button>
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && result && !isNotFound && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#3D3348] px-4">
            <button
              onClick={handleExit}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="truncate text-sm font-bold text-[#F5F0FA]">{quizTitle}</span>
            <div className="flex items-center gap-2">
              <Button to="/quiz" size="sm" variant="ghost" className="h-9 gap-1.5 px-3">
                Quiz khác
              </Button>
              <Button onClick={handleRestart} size="sm" variant="ghost" className="h-9 gap-1.5 px-3">
                <RotateCcw className="h-4 w-4" />
                {t.retry}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <QuizResult
              deckRef={quizRef}
              correct={result.correct}
              total={result.total}
              xpEarned={result.xpEarned}
              quizTitle={quizTitle}
              startedAt={result.startedAt ?? ''}
              finishedAt={result.finishedAt ?? ''}
              details={result.details}
              onRestart={handleRestart}
              score={result.score}
            />
          </main>
        </div>
      )}

      {/* Active session - NEW LAYOUT */}
      {phase === 'session' && !isNotFound && (
        <div className="flex h-full flex-col">
          {/* Top Bar */}
          <header className="shrink-0 border-b border-[#3D3348]">
            {/* Progress bar */}
              <div className="h-1 w-full overflow-hidden bg-[#2D2538]">
                <div
                  className="h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${displayProgress * 100}%`,
                    background: 'linear-gradient(90deg, #EC4899 0%, #F472B6 50%, #FB923C 100%)'
                  }}
                />
              </div>

            <div className="flex h-16 items-center justify-between px-4">
              {/* Left: Back button + Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleExit}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <span className="truncate text-base font-bold text-[#F5F0FA]">{quizTitle}</span>
              </div>

              {/* Center: Large Timer */}
              {questionTimeRemaining !== null && (
                <div className={cn(
                  "flex items-center gap-3 rounded-2xl px-6 py-3 text-xl font-black transition-all",
                  questionTimeRemaining <= 10 ? "bg-[#EF4444]/30 text-[#EF4444] animate-pulse" :
                  questionTimeRemaining <= 30 ? "bg-[#F59E0B]/30 text-[#F59E0B]" :
                  "bg-[#10B981]/30 text-[#10B981]"
                )}>
                  <Clock className="h-7 w-7" />
                  <span>{Math.floor(questionTimeRemaining / 60)}:{String(questionTimeRemaining % 60).padStart(2, '0')}</span>
                </div>
              )}

              {/* Right: Stats + Rules */}
              <div className="flex items-center gap-3">
                {!isOnline && (
                  <span className="rounded bg-[#F59E0B]/20 px-2 py-0.5 text-xs font-semibold text-[#F59E0B]">
                    Offline
                  </span>
                )}
                <button
                  onClick={() => setShowRulesDialog(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
                  title={t.rules}
                >
                  <Info className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1.5 rounded-full bg-[#2D2538] px-4 py-2">
                  <Target className="h-5 w-5 text-[#8B7A9E]" />
                  <span className="text-sm font-bold text-[#F5F0FA]">
                    {navIndex + 1}/{questions.length}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Center focused */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Center: Question Content */}
            <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 sm:p-8 lg:p-12">
              <div className="w-full max-w-3xl">
                {/* Question number & hint */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EC4899]/20 text-sm font-bold text-[#EC4899]">
                      {navIndex + 1}
                    </span>
                    <span className="text-xs text-[#8B7A9E]">
                      {t.question} {navIndex + 1} / {questions.length}
                    </span>
                  </div>
                  <span className="text-xs text-[#8B7A9E]">{t.hint}</span>
                </div>

                {/* Question text */}
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-extrabold leading-relaxed text-[#F5F0FA] sm:text-3xl md:text-4xl">
                    {currentQ?.front}
                  </h2>
                </div>

                {/* Options - Compact */}
                <div className="space-y-2">
                  {currentQ?.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    const displayText = option.replace(/^[A-D]\.\s*/, '').replace(/^[A-D]\)\s*/, '')
                    const isSelected = currentAnswer === displayText
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (!currentQ) return
                          // Send TEXT as answer (no letter mapping needed)
                          handleAnswer(currentQ.questionId, displayText)
                          const newSet = new Set(answeredSet)
                          newSet.add(navIndex)
                          setAnsweredSet(newSet)
                          // Auto advance after delay
                          if (navIndex < questions.length - 1) {
                            setTimeout(() => setNavIndex(navIndex + 1), 400)
                          }
                        }}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all duration-200',
                          isSelected
                            ? 'border-[#EC4899] bg-[#EC4899]/15'
                            : 'border-[#3D3348] bg-[#252030] hover:border-[#4A4060] hover:bg-[#2D2538]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all',
                            isSelected
                              ? 'bg-[#EC4899] text-white'
                              : 'bg-[#3D3348] text-[#8B7A9E] group-hover:bg-[#4A4060] group-hover:text-[#F5F0FA]'
                          )}
                        >
                          {letter}
                        </span>
                        <span className={cn(
                          'flex-1 text-left text-sm font-medium',
                          isSelected ? 'text-[#F5F0FA]' : 'text-[#C4B8D9]'
                        )}>
                          {displayText}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-[#EC4899]" strokeWidth={3} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Question Navigator - Bottom */}
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                  {questions.map((q, idx) => {
                    const isAnswered = answeredSet.has(idx)
                    const isExpired = expiredSet.has(idx)
                    const isCurrent = idx === navIndex
                    const isPast = idx < navIndex
                    return (
                      <button
                        key={q.questionId}
                        type="button"
                        onClick={() => {
                          // Only allow: current question, already answered, or expired (time's up)
                          if (isPast) return
                          if (!isCurrent && !isAnswered && !isExpired) return
                          setNavIndex(idx)
                        }}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all',
                          isCurrent
                            ? 'bg-[#EC4899] text-white ring-2 ring-[#EC4899] ring-offset-2 ring-offset-[#1a1520]' // Pink: Current
                            : isPast
                              ? 'bg-[#2D2538]/30 text-[#3D3348] cursor-not-allowed' // Mờ: Đã qua
                              : isExpired
                                ? 'bg-[#F59E0B] text-white cursor-pointer' // Yellow: Hết giờ
                                : isAnswered
                                  ? 'bg-[#10B981] text-white cursor-pointer hover:opacity-80' // Green: Đã trả lời
                                  : 'bg-[#2D2538]/40 text-[#3D3348] cursor-not-allowed' // Mờ: Chưa trả lời
                        )}
                        disabled={isPast}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            </main>

            {/* Bottom Bar - Submit Button */}
            <div className="shrink-0 border-t border-[#3D3348] bg-[#1a1520] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#8B7A9E]">
                    {answeredCount} {t.answered}
                  </span>
                  <span className="text-sm text-[#8B7A9E]">
                    •
                  </span>
                  <span className="text-sm text-[#8B7A9E]">
                    {questions.length - answeredCount} {t.unanswered}
                  </span>
                </div>
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitMutation.isPending}
                  size="lg"
                  className={cn(
                    "gap-2 px-8 text-base font-bold transition-all",
                    answeredCount === questions.length
                      ? "bg-gradient-to-r from-[#EC4899] to-[#F472B6] hover:shadow-lg hover:shadow-[#EC4899]/30"
                      : "bg-[#3D3348] hover:bg-[#4A4060]"
                  )}
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t.submitting}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      {t.submit}
                      {answeredCount < questions.length && (
                        <span className="text-xs opacity-70">({answeredCount}/{questions.length})</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Dialog */}
      {showRulesDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-md rounded-2xl border border-[#3D3348] bg-[#1D1A24] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#EC4899]" />
                <h3 className="text-lg font-bold text-[#F5F0FA]">{t.rulesTitle}</h3>
              </div>
              <button
                onClick={() => setShowRulesDialog(false)}
                className="text-[#8B7A9E] hover:text-[#F5F0FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-[#C4B8D9]">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">1</div>
                <p><strong className="text-[#F5F0FA]">Mỗi câu hỏi có thời gian giới hạn</strong> — Hết giờ = tự động tính sai.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">2</div>
                <p><strong className="text-[#F5F0FA]">Không quay lại câu trước</strong> — Đã trả lời hoặc hết giờ sẽ bị khóa.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">3</div>
                <p><strong className="text-[#F5F0FA]">Chọn đáp án để tiếp tục</strong> — Hệ thống tự chuyển sang câu tiếp theo.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">4</div>
                <p><strong className="text-[#F5F0FA]">Nộp bài khi hoàn thành</strong> — XP được tính dựa trên câu trả lời đúng.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">5</div>
                <p><strong className="text-[#F5F0FA]">Làm lại không được</strong> — Mỗi câu hỏi chỉ có một lần trả lời duy nhất.</p>
              </div>
            </div>
            <button
              onClick={() => setShowRulesDialog(false)}
              className="mt-6 w-full rounded-xl bg-[#EC4899] py-3 font-bold text-white transition-all hover:bg-[#EC4899]/80"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Exit dialog */}
      {showExitDialog && (
        <ExitConfirmDialog
          open
          title={sessionExpired ? t.expiredTitle : t.exitTitle}
          body={sessionExpired ? t.expiredBody : t.exitBody}
          confirmLabel={t.exitEnd}
          confirmHint={t.exitEndHint}
          cancelLabel={t.stay}
          onConfirm={handleExitEnd}
          onCancel={handleExitCancel}
        />
      )}

      {/* Submit confirmation dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-[#3D3348] bg-[#1D1A24] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#EC4899]" />
                <h3 className="text-lg font-bold text-[#F5F0FA]">{t.submitTitle}</h3>
              </div>
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="text-[#8B7A9E] hover:text-[#F5F0FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[#C4B8D9]">
              Bạn đã trả lời <strong className="text-[#F5F0FA]">{answeredCount}/{questions.length}</strong> câu.
              {answeredCount < questions.length && (
                <span className="mt-1 block text-[#8B7A9E]">Còn {questions.length - answeredCount} câu chưa trả lời sẽ bị tính là sai.</span>
              )}
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => setShowSubmitDialog(false)}
                variant="outline"
                className="flex-1"
              >
                {t.submitCancel}
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitDialog(false)
                  handleSubmit()
                }}
                className="flex-1 bg-gradient-to-r from-[#EC4899] to-[#F472B6]"
              >
                {t.submitConfirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
