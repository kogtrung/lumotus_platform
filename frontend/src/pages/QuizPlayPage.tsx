import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { quizApi } from '@/api/study'
import QuizView from '@/components/quiz/QuizView'
import Button from '@/components/ui/Button'
import type { QuizQuestion } from '@/api/study'

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
  passTitle: string
  failTitle: string
  correctText: string
  correctSuffix: string
  reviewTitle: string
  skippedLabel: string
  retry: string
  otherQuiz: string
  expiredTitle: string
  expiredBody: string
}

const EN: LocaleStrings = {
  loading: 'Loading quiz...',
  notFound: 'Quiz not found.',
  backToQuiz: 'Back to Quiz',
  passTitle: 'Great job!',
  failTitle: 'Keep practicing!',
  correctText: 'correct',
  correctSuffix: '',
  reviewTitle: 'Question Review',
  skippedLabel: '(skipped)',
  retry: 'Retry',
  otherQuiz: 'Browse quizzes',
  expiredTitle: 'Time is up!',
  expiredBody: 'Your session has expired.',
}

const VI: LocaleStrings = {
  loading: 'Đang tải quiz...',
  notFound: 'Không tìm thấy quiz.',
  backToQuiz: 'Về Quiz',
  passTitle: 'Xuất sắc!',
  failTitle: 'Tiếp tục cố gắng!',
  correctText: 'đúng',
  correctSuffix: '',
  reviewTitle: 'Đáp án',
  skippedLabel: '(bỏ qua)',
  retry: 'Chơi lại',
  otherQuiz: 'Quiz khác',
  expiredTitle: 'Hết giờ!',
  expiredBody: 'Phiên làm bài đã hết hạn.',
}

const QUIZ_SESSION_KEY = (quizId: string) => `lumotus:quiz:session:${quizId}`

interface QuizSessionCache {
  attemptId: string
  quizId: string
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
  const { quizId = '' } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [navIndex, setNavIndex] = useState(0)
  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<{
    correct: number; total: number; xpEarned: number; score: number
  } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // ─── Session cache helpers ────────────────────────────────────────────────────
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
    } catch { /* ignore */ }
  }

  // ─── Start fresh quiz ─────────────────────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: () => quizApi.start(quizId).then((r) => r.data),
    onSuccess: (data) => {
      const mapped: Question[] = data.questions.map((q: QuizQuestion) => ({
        questionId: q.id,
        front: q.questionText,
        correctAnswer: q.correctAnswer,
        options: q.options,
      }))

      setQuestions(mapped)
      setQuizTitle(data.deckTitle)
      setAttemptId(data.attemptId)
      setAnswers({})
      setAnsweredSet(new Set())
      setNavIndex(0)
      setResult(null)
      setIsExpired(false)

      if (data.timeLimitSeconds != null && data.timeLimitSeconds > 0) {
        setTimeRemaining(data.timeLimitSeconds)
      } else {
        setTimeRemaining(null)
      }

      saveSessionCache(quizId, {
        attemptId: data.attemptId,
        quizId,
        startedAt: Date.now(),
        questions: mapped,
        answers: {},
        answeredSet: [],
        navIndex: 0,
      })

      setPhase('session')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không bắt đầu được quiz')
      navigate('/quiz')
    },
  })

  // ─── Resume existing session ──────────────────────────────────────────────────
  const resumeMutation = useMutation({
    mutationFn: (aid: string) => quizApi.resumeSession(aid).then((r) => r.data),
    onSuccess: (resumeData) => {
      if (!resumeData.sessionFound) {
        clearSessionCache(quizId)
        startMutation.mutate()
        return
      }

      setTimeRemaining(resumeData.remainingSeconds >= 0 ? resumeData.remainingSeconds : null)

      if (resumeData.remainingSeconds <= 0 && resumeData.timeLimitSeconds != null) {
        setIsExpired(true)
      }

      setPhase('session')
    },
    onError: () => {
      clearSessionCache(quizId)
      startMutation.mutate()
    },
  })

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
      clearSessionCache(quizId)
      setResult({
        correct: data.correctAnswers,
        total: data.totalQuestions,
        xpEarned: data.xpEarned,
        score: data.score,
      })
      setPhase('result')
    },
    onError: (err: any) => {
      if (err?.response?.data?.message === 'Quiz session has expired') {
        clearSessionCache(quizId)
        toast.error('Phiên làm bài đã hết hạn')
        setIsExpired(true)
      } else {
        toast.error(err?.response?.data?.message || 'Không nộp được bài')
      }
    },
  })

  // ─── Phase: load cached or fresh ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading') return
    const cached = loadCachedSession(quizId)
    if (cached) {
      setQuestions(cached.questions)
      setAnswers(cached.answers)
      setAnsweredSet(new Set(cached.answeredSet))
      setNavIndex(cached.navIndex)
      setAttemptId(cached.attemptId)
      setResult(null)
      setIsExpired(false)
      resumeMutation.mutate(cached.attemptId)
    } else {
      startMutation.mutate()
    }
  }, [phase, quizId])

  // ─── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'session') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    if (timeRemaining === null) return

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          setIsExpired(true)
          if (phase === 'session') submitMutation.mutate()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeRemaining, phase])

  // ─── Heartbeat to keep Redis session alive ────────────────────────────────────
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

  // ─── Persist answers to localStorage on change ────────────────────────────────
  useEffect(() => {
    if (phase !== 'session' || !attemptId) return
    const cached = loadCachedSession(quizId)
    if (cached) {
      saveSessionCache(quizId, {
        ...cached,
        answers,
        answeredSet: Array.from(answeredSet),
        navIndex,
      })
    }
  }, [answers, answeredSet, navIndex, phase, attemptId, quizId])

  const handleAnswer = useCallback((qid: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }))
  }, [])

  const handleSubmit = useCallback(() => {
    submitMutation.mutate()
  }, [submitMutation])

  const handleRestart = useCallback(() => {
    clearSessionCache(quizId)
    setQuestions([])
    setAttemptId('')
    setAnswers({})
    setNavIndex(0)
    setAnsweredSet(new Set())
    setResult(null)
    setTimeRemaining(null)
    setPhase('loading')
  }, [quizId])

  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? answeredCount / questions.length : 0
  const currentQ = questions[navIndex]
  const currentAnswer = currentQ ? answers[currentQ.questionId] ?? null : null

  // ─── Loading state ─────────────────────────────────────────────────────────────
  if (phase === 'loading' || startMutation.isPending || resumeMutation.isPending) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[#8B7A9E]">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (startMutation.isError && !attemptId) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <p className="text-[#EF4444]">{t.notFound}</p>
          <Button onClick={() => navigate('/quiz')} className="mt-4">{t.backToQuiz}</Button>
        </div>
      </div>
    )
  }

  // ─── Expired state ────────────────────────────────────────────────────────────
  if (phase === 'session' && isExpired) {
    return (
      <div className="flex h-screen flex-col" style={{ background: '#1A1520' }}>
        <header className="flex h-14 shrink-0 items-center border-b border-[#3D3348] px-4">
          <button
            onClick={() => navigate('/quiz')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.2)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: '#EF4444', width: '2rem', height: '2rem' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#F5F0FA]">{t.expiredTitle}</h2>
          <p className="text-sm text-[#8B7A9E]">{t.expiredBody}</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => navigate('/quiz')}>{t.otherQuiz}</Button>
            <Button onClick={handleRestart}>{t.retry}</Button>
          </div>
        </main>
      </div>
    )
  }

  // ─── Result state ──────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
    const isPass = pct >= 70

    return (
      <div className="flex h-screen flex-col" style={{ background: '#1A1520' }}>
        <header className="shrink-0 border-b border-[#3D3348]">
          <div className="flex h-14 items-center px-4">
            <button
              onClick={() => navigate('/quiz')}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="ml-3 truncate text-sm font-bold text-[#F5F0FA]">{quizTitle}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto px-4 py-6 sm:gap-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg sm:h-20 sm:w-20"
            style={{ background: isPass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isPass ? '#10B981' : '#EF4444', width: '2rem', height: '2rem' }}>
              {isPass ? (
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-extrabold text-[#F5F0FA] sm:text-2xl">
              {isPass ? t.passTitle : t.failTitle}
            </h2>
            <p className="mt-2 text-base text-[#8B7A9E] sm:text-lg">
              <span className={`font-extrabold ${isPass ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{result.correct}</span>
              <span> / {result.total} {t.correctText}</span>
            </p>
            <p className={`mt-1 text-2xl font-extrabold sm:text-3xl ${isPass ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {pct}%
            </p>
          </div>

          {result.xpEarned > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[rgba(236,72,153,0.4)] bg-[rgba(236,72,153,0.1)] px-5 py-2">
              <span className="text-xl">⚡</span>
              <span className="text-xl font-extrabold text-[#EC4899]">+{result.xpEarned} XP</span>
            </div>
          )}

          <div className="w-full max-w-2xl">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8B7A9E] sm:text-sm">{t.reviewTitle}</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
              {questions.map((q, idx) => {
                const userAnswer = answers[q.questionId]
                const isCorrect = userAnswer === q.correctAnswer
                return (
                  <div
                    key={q.questionId}
                    className="flex flex-col rounded-xl border-2 p-2 sm:p-3"
                    style={{
                      borderColor: isCorrect ? '#10B981' : '#EF4444',
                      background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    <span className="mb-1 text-[10px] font-semibold text-[#8B7A9E] sm:text-xs">#{idx + 1}</span>
                    <p className="mb-1 text-xs font-bold text-[#F5F0FA] line-clamp-2 sm:text-sm">{q.front}</p>
                    <p className="mt-auto text-[10px] sm:text-xs" style={{ color: isCorrect ? '#10B981' : '#EF4444' }}>
                      {isCorrect ? (
                        <span className="font-semibold">{userAnswer}</span>
                      ) : (
                        <>
                          <span className="line-through opacity-60">{userAnswer || t.skippedLabel}</span>
                          <span className="mx-1 opacity-40">→</span>
                          <span className="font-semibold">{q.correctAnswer}</span>
                        </>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleRestart} size="lg" className="flex-1">
                {t.retry}
              </Button>
              <Button onClick={() => navigate('/quiz')} variant="outline" size="lg" className="flex-1">
                {t.otherQuiz}
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Session state ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col" style={{ background: 'linear-gradient(180deg, #1A1520 0%, #252030 100%)' }}>
      <header className="shrink-0">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#3D3348]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/quiz')}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="truncate text-sm font-bold text-[#F5F0FA]">{quizTitle}</span>
          </div>
          <span className="text-sm font-semibold text-[#8B7A9E]">
            <span className="font-bold text-[#F5F0FA]">{answeredCount}</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-[#F5F0FA]">{questions.length}</span>
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-4 sm:px-6 sm:py-6">
        <QuizView
          questions={questions.map((q) => ({
            questionId: q.questionId,
            type: 'MULTIPLE_CHOICE',
            front: q.front,
            phonetic: null,
            hint: null,
            imageUrl: null,
            audioUrl: null,
            correctAnswer: q.correctAnswer,
            options: q.options,
            cardInfo: null,
          }))}
          questionIndex={navIndex}
          selected={currentAnswer}
          answeredSet={answeredSet}
          onSelect={(a) => {
            if (a === '__SKIP__' || isExpired) return
            if (!currentQ) return
            handleAnswer(currentQ.questionId, a)
            const newSet = new Set(answeredSet)
            newSet.add(navIndex)
            setAnsweredSet(newSet)
          }}
          onNavigate={setNavIndex}
          onSubmit={handleSubmit}
          submitPending={submitMutation.isPending}
          timeRemaining={timeRemaining}
          isExpired={isExpired}
        />
      </main>
    </div>
  )
}
