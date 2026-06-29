/**
 * StudyPage — Per-mode session architecture
 *
 * Mỗi mode có session riêng trong localStorage (key = {deckRef}:{mode}).
 * Màn hình config KHÔNG có ModeTab — user chọn mode từ header (ModeDropdown).
 * Click ModeDropdown:
 *   1. Save session hiện tại (nếu đang trong session)
 *   2. Về màn hình config của mode mới (KHÔNG auto-start)
 * Resume: chỉ xảy ra khi mount page và có session đã lưu cho mode đó
 *
 * Các bugs đã fix:
 * - Quiz/Learn/Spell: tự chuyển câu hỏi sau khi trả lời (studyIndex = answeredCount)
 * - Quiz session: lưu full questions để resume chính xác
 * - Mode switch: disable khi đang trong session
 * - ResumeDialog: không loop khi user chọn discard
 * - Flashcard resume: tăng limit để đảm bảo đủ cards
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { studyApi } from '@/api/study'
import { reviewApi } from '@/api/review'
import { decksApi } from '@/api/decks'
import RatingButtonGroup from '@/components/review/RatingButtonGroup'
import QuizView from '@/components/study/QuizView'
import LearnView from '@/components/study/LearnView'
import SpellView from '@/components/study/SpellView'
import Flashcard from '@/components/study/Flashcard'
import Button from '@/components/ui/Button'
import { shuffleArray } from '@/utils/shuffle'
import { StudyHeader } from '@/components/study/StudyHeader'
import { StudyConfigView } from '@/components/study/StudyConfigView'
import { ResumeDialog } from '@/components/study/ResumeDialog'
import { StudyEmptyState } from '@/components/study/StudyEmptyState'
import { FlashcardResult } from '@/components/study/FlashcardResult'
import { QuizResult } from '@/components/study/QuizResult'
import {
  type StudySession,
  type StudyConfig,
  loadConfig,
  saveConfig,
  loadSession,
  saveSession,
  clearSession,
  clearAllSessions,
  createSession,
  createQuizSession,
  resolveSessionCards,
  mergeRating,
} from '@/utils/studySession'
import type { StudyMode, Question } from '@/types/study'
import type { DueCard, ReviewRating } from '@/types/review'

type SessionPhase = 'config' | 'session' | 'result'

const MODE_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
  LEARN: 'Learn',
  SPELL: 'Spell',
}

/* ─── Study page ─────────────────────────────────────────────── */
export default function StudyPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const { mode: modeParam } = useParams<{ mode?: string }>()

  // ── Session state ───────────────────────────────────────────────
  const sessionRef = useRef<StudySession | null>(null)
  const initialMode = (modeParam?.toUpperCase() as StudyMode) || 'FLASHCARD'
  const [phase, setPhase] = useState<SessionPhase>('config')
  const [mode, setMode] = useState<StudyMode>(initialMode)
  const [modeConfig, setModeConfig] = useState<StudyConfig>(() => loadConfig(initialMode))

  // ── Resume dialog state ────────────────────────────────────────
  const [showResume, setShowResume] = useState(false)
  const [savedSession, setSavedSession] = useState<StudySession | null>(null)
  // Bug fix: flag để effect không re-trigger sau khi user chọn discard/resume
  const resumeDialogDismissed = useRef(false)

  // ── Flashcard UI state ──────────────────────────────────────────
  const [flashCards, setFlashCards] = useState<DueCard[]>([])
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashFlipped, setFlashFlipped] = useState(false)
  const [flashStats, setFlashStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
  const [flashAvailableCount, setFlashAvailableCount] = useState<number>(0)

  // ── Quiz/Learn/Spell UI state ─────────────────────────────────
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([])
  const [studyAttemptId, setStudyAttemptId] = useState('')
  const [studyAnswers, setStudyAnswers] = useState<Record<string, string>>({})
  const [studyResult, setStudyResult] = useState<{ correct: number; total: number } | null>(null)
  // Navigation: separate index for each mode
  const [quizNavIndex, setQuizNavIndex] = useState(0)
  const [learnNavIndex, setLearnNavIndex] = useState(0)
  // Quiz features
  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  /** Track if quiz has timed out */
  const [isQuizExpired, setIsQuizExpired] = useState(false)
  /** Timestamp when session started (for timer restoration) */
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Auto-save ──────────────────────────────────────────────────
  const persistSession = useCallback(() => {
    if (sessionRef.current) saveSession(sessionRef.current)
  }, [])

  // ── Queries ─────────────────────────────────────────────────────
  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
  })

  const dueQuery = useQuery({
    queryKey: ['review', 'due', deckRef],
    // Bug fix: tăng limit lên 200 để đảm bảo đủ cards khi resume
    queryFn: () => reviewApi.getDue({ deckRef, limit: 200 }).then((r) => r.data),
    enabled: false,
  })

  // ── Mutations ────────────────────────────────────────────────────

  /** Rate a flashcard — SM-2 via /review API */
  const rateMutation = useMutation({
    mutationFn: (rating: ReviewRating) =>
      reviewApi.rate(flashCards[flashIndex]!.cardId, rating).then((r) => r.data),
    onSuccess: (data, rating) => {
      if (sessionRef.current) {
        sessionRef.current = mergeRating(sessionRef.current, rating, data.xpEarned)
        persistSession()
      }
      setFlashStats((s) => {
        const next = { ...s }
        if (rating === 'AGAIN') next.again++
        else if (rating === 'HARD') next.hard++
        else if (rating === 'GOOD') next.good++
        else if (rating === 'EASY') next.easy++
        next.xp += data.xpEarned
        return next
      })
      if (data.xpEarned > 0) {
        toast.success(`+${data.xpEarned} XP`, {
          duration: 1500,
          style: { background: '#252030', color: '#F5F0FA' },
        })
      }
      dueQuery.refetch()
    },
    onError: () => toast.error('Không gửi được đánh giá'),
  })

  /** Start a quiz/learn/spell session */
  const startMutation = useMutation({
    mutationFn: ({ count, direction, mode: m }: { count: number; direction: string; mode: StudyMode }) => {
      const body = { deckRef, mode: m, count, direction }
      return studyApi.start(body).then((r) => r.data)
    },
    onSuccess: (data, { count, mode: m }) => {
      // Natural randomization: shuffle then slice
      const source = data.questions
      const shuffled = modeConfig.shuffle ? shuffleArray([...source]) : [...source]
      const selected = shuffled.slice(0, Math.min(count, shuffled.length))
      const now = Date.now()
      setStudyQuestions(selected)
      setStudyAttemptId(data.attemptId)
      setStudyAnswers({})
      setAnsweredSet(new Set())
      setStudyResult(null)
      setQuizNavIndex(0)
      setLearnNavIndex(0)
      setSessionStartedAt(now)
      // Start timer if time limit set
      if (modeConfig.timeLimit > 0) {
        setTimeRemaining(modeConfig.timeLimit * 60)
      } else {
        setTimeRemaining(null)
      }
      sessionRef.current = createQuizSession(deckRef, m, modeConfig, data.attemptId, selected, {}, [], 0)
      sessionRef.current.progress.quiz!.startedAt = now
      persistSession()
      setPhase('session')
    },
    onError: () => toast.error('Không bắt đầu được phiên học'),
  })

  /** Submit quiz/learn/spell answers */
  const submitMutation = useMutation({
    mutationFn: () =>
      studyApi
        .submit(
          studyAttemptId,
          Object.entries(studyAnswers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer,
          })),
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      if (sessionRef.current) {
        clearSession(deckRef, sessionRef.current.mode)
        sessionRef.current = null
      }
      // LEARN/SPELL: hiện result sau khi hoàn thành
      setStudyResult({ correct: data.correct, total: data.total })
      setPhase('result')
    },
    onError: () => toast.error('Không nộp được bài'),
  })

  // ─────────────────────────────────────────────────────────────────
  // Shared helpers
  // ─────────────────────────────────────────────────────────────────

  /** Reset all session UI state */
  const resetUiState = useCallback(() => {
    setFlashCards([])
    setFlashIndex(0)
    setFlashFlipped(false)
    setFlashStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
    setStudyQuestions([])
    setStudyAttemptId('')
    setStudyAnswers({})
    setStudyResult(null)
    setQuizNavIndex(0)
    setLearnNavIndex(0)
    setAnsweredSet(new Set())
    setTimeRemaining(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * Resume a flashcard session from a saved session.
   * Called after dueQuery.refetch() resolves.
   */
  const resumeFlashcardSession = useCallback(
    (session: StudySession, allCards: DueCard[]) => {
      const shuffledIds = shuffleArray([...allCards.map((c) => c.cardId)])
      const resolved = resolveSessionCards(session, allCards, shuffledIds)

      if (resolved.length === 0) {
        clearSession(deckRef, 'FLASHCARD')
        return false
      }

      sessionRef.current = session
      setMode('FLASHCARD')
      setModeConfig(session.config)
      setFlashCards(resolved)
      setFlashIndex(session.progress.flashcard?.currentIndex ?? 0)
      setFlashFlipped(session.progress.flashcard?.flipped ?? false)
      setFlashStats(session.progress.stats)
      setPhase('session')
      return true
    },
    [deckRef],
  )

  /**
   * Resume a quiz/learn/spell session from a saved session.
   * Restores: questions, answers, navIndex, answeredSet, timeRemaining
   */
  const resumeQuizSession = useCallback((session: StudySession) => {
    const savedProgress = session.progress.quiz
    if (!savedProgress) return

    sessionRef.current = session
    setMode(session.mode)
    setModeConfig(session.config)
    setStudyAttemptId(savedProgress.attemptId)
    setStudyQuestions(savedProgress.questions)
    setStudyAnswers(savedProgress.answers)
    setStudyResult(null)

    // Restore nav index
    setQuizNavIndex(savedProgress.navIndex ?? 0)
    setLearnNavIndex(savedProgress.navIndex ?? 0)

    // Restore answered set (stored as number[] indices)
    setAnsweredSet(new Set(savedProgress.answeredSet ?? []))

    // Calculate remaining time from startedAt timestamp
    setSessionStartedAt(savedProgress.startedAt ?? Date.now())
    if (session.config.timeLimit > 0 && savedProgress.startedAt) {
      const elapsed = Math.floor((Date.now() - savedProgress.startedAt) / 1000)
      const remaining = session.config.timeLimit * 60 - elapsed
      setTimeRemaining(remaining > 0 ? remaining : 0)
    } else {
      setTimeRemaining(null)
    }

    setPhase('session')
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Resume dialog
  // ─────────────────────────────────────────────────────────────────

  const handleResume = useCallback(() => {
    if (!savedSession) return
    resumeDialogDismissed.current = true
    dueQuery.refetch().then(({ data }) => {
      const allCards: DueCard[] = data?.cards ?? []
      setShowResume(false)
      setSavedSession(null)

      if (savedSession.mode === 'FLASHCARD') {
        const ok = resumeFlashcardSession(savedSession, allCards)
        if (!ok) setPhase('config')
      } else {
        resumeQuizSession(savedSession)
      }
    })
  }, [savedSession, deckRef, dueQuery, resumeFlashcardSession, resumeQuizSession])

  const handleDiscard = useCallback(() => {
    resumeDialogDismissed.current = true
    if (savedSession) clearSession(deckRef, savedSession.mode)
    sessionRef.current = null
    setShowResume(false)
    setSavedSession(null)
    setPhase('config')
  }, [savedSession, deckRef])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Start a flashcard session
  // ─────────────────────────────────────────────────────────────────

  const handleStartFlashcard = useCallback(() => {
    dueQuery.refetch().then(({ data }) => {
      console.log('[Flashcard] Backend returned:', data?.cards?.length, 'cards, dueCount:', data?.dueCount)
      console.log('[Flashcard] User requested:', modeConfig.count, 'cards')
      const allCards: DueCard[] = data?.cards ?? []
      console.log('[Flashcard] After filter (starredOnly:', modeConfig.starredOnly, '):', allCards.length, 'cards')
      const filtered = modeConfig.starredOnly ? allCards.filter((c) => c.isStarred) : allCards
      setFlashAvailableCount(filtered.length)
      const selected = modeConfig.shuffle ? shuffleArray([...filtered]) : filtered
      const sliced = selected.slice(0, modeConfig.count)
      console.log('[Flashcard] Final selected:', sliced.length, 'cards')

      if (sliced.length === 0) {
        setFlashCards([])
        setFlashIndex(0)
        setPhase('session')
        return
      }

      sessionRef.current = createSession(deckRef, 'FLASHCARD', modeConfig, sliced)
      persistSession()

      setFlashCards(sliced)
      setFlashIndex(0)
      setFlashFlipped(false)
      setFlashStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
      setStudyResult(null)
      setPhase('session')
    })
  }, [dueQuery, modeConfig, deckRef, persistSession])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Start a quiz/learn/spell session
  // ─────────────────────────────────────────────────────────────────

  const handleStartStudy = useCallback(() => {
    startMutation.mutate({ count: modeConfig.count, direction: modeConfig.direction, mode })
  }, [startMutation, modeConfig.count, modeConfig.direction, mode])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Rate a flashcard
  // ─────────────────────────────────────────────────────────────────

  const handleFlashcardRate = useCallback(
    (rating: ReviewRating) => {
      rateMutation.mutate(rating)
      setFlashFlipped(false)
      requestAnimationFrame(() => {
        const nextIndex = flashIndex + 1
        if (nextIndex >= flashCards.length) {
          clearSession(deckRef, 'FLASHCARD')
          sessionRef.current = null
          setPhase('result')
        } else {
          if (sessionRef.current?.progress.flashcard) {
            sessionRef.current.progress.flashcard.currentIndex = nextIndex
            sessionRef.current.progress.flashcard.flipped = false
            persistSession()
          }
          setFlashIndex(nextIndex)
        }
      })
    },
    [rateMutation, flashIndex, flashCards.length, deckRef, persistSession],
  )

  // ─────────────────────────────────────────────────────────────────
  // Handler: Change mode (ModeDropdown in header)
  //
  // Logic:
  //   1. Save current session (if any) — toast confirmation
  //   2. Reset UI + go to config screen
  //   3. Load saved config for the new mode (not auto-start)
  //   Resume only happens from resume dialog, not from mode tab click.
  // ─────────────────────────────────────────────────────────────────

  const handleModeChange = useCallback(
    (newMode: StudyMode) => {
      if (newMode === mode) return

      const prevSession = sessionRef.current
      const wasInSession = phase === 'session'

      // 1. Save current session (FLASHCARD/QUIZ/LEARN/SPELL all save if TTL > 0)
      if (wasInSession && prevSession) {
        saveSession(prevSession)
        toast.success(`Đã lưu tiến trình ${MODE_LABELS[mode]}`, {
          duration: 2000,
          style: { background: '#252030', color: '#F5F0FA' },
        })
      }

      // 2. Reset + go to config for the new mode
      resetUiState()
      setMode(newMode)
      setModeConfig(loadConfig(newMode))
      setPhase('config')
    },
    [mode, phase, resetUiState],
  )

  // ─────────────────────────────────────────────────────────────────
  // Handler: Config change
  // ─────────────────────────────────────────────────────────────────

  const handleConfigChange = useCallback(
    (newConfig: StudyConfig) => {
      setModeConfig(newConfig)
      saveConfig(mode, newConfig)
      if (sessionRef.current) {
        sessionRef.current.config = newConfig
        persistSession()
      }
    },
    [mode, persistSession],
  )

  // ─────────────────────────────────────────────────────────────────
  // Handler: Answer a question + track answered set
  // ─────────────────────────────────────────────────────────────────

  const handleStudyAnswer = useCallback(
    (qid: string, answer: string) => {
      // Find question index
      const idx = studyQuestions.findIndex(q => q.questionId === qid)
      setStudyAnswers((prev) => {
        const updated = { ...prev, [qid]: answer }
        if (sessionRef.current?.progress.quiz) {
          sessionRef.current.progress.quiz.answers = updated
          sessionRef.current.progress.quiz.answeredCount = Object.keys(updated).length
          // Track answered indices
          if (idx >= 0) {
            const currentSet = sessionRef.current.progress.quiz.answeredSet ?? []
            if (!currentSet.includes(idx)) {
              sessionRef.current.progress.quiz.answeredSet = [...currentSet, idx]
            }
          }
          persistSession()
        }
        return updated
      })
    },
    [persistSession, studyQuestions],
  )

  // Navigation handlers that also update session navIndex
  const handleQuizNav = useCallback((idx: number) => {
    setQuizNavIndex(idx)
    if (sessionRef.current?.progress.quiz) {
      sessionRef.current.progress.quiz.navIndex = idx
      persistSession()
    }
  }, [persistSession])

  const handleLearnNav = useCallback((idx: number) => {
    setLearnNavIndex(idx)
    if (sessionRef.current?.progress.quiz) {
      sessionRef.current.progress.quiz.navIndex = idx
      persistSession()
    }
  }, [persistSession])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Submit quiz/learn/spell
  // ─────────────────────────────────────────────────────────────────

  const handleSubmitStudy = useCallback(() => {
    submitMutation.mutate()
  }, [submitMutation])

  // ─────────────────────────────────────────────────────────────────
  // Handler: Restart (back to config)
  // ─────────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    clearAllSessions(deckRef)
    sessionRef.current = null
    resetUiState()
    setPhase('config')
  }, [deckRef, resetUiState])

  // ─────────────────────────────────────────────────────────────────
  // Keyboard shortcuts (flashcard flip + rate)
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'session' || mode !== 'FLASHCARD') return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!flashFlipped) {
          setFlashFlipped(true)
          if (sessionRef.current?.progress.flashcard) {
            sessionRef.current.progress.flashcard.flipped = true
            persistSession()
          }
        }
      } else if (flashFlipped) {
        const map: Record<string, ReviewRating> = { '1': 'AGAIN', '2': 'HARD', '3': 'GOOD', '4': 'EASY' }
        if (map[e.key]) {
          e.preventDefault()
          handleFlashcardRate(map[e.key])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, mode, flashFlipped, handleFlashcardRate, persistSession])

  // ─────────────────────────────────────────────────────────────────
  // On entering config phase: check for saved session of the new mode
  // (triggers when switching modes, not just on mount)
  // Bug fix: skip if user just dismissed a dialog
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'config') return
    // Don't show resume if user just clicked discard/resume (flag prevents re-trigger)
    if (resumeDialogDismissed.current) {
      resumeDialogDismissed.current = false
      return
    }
    if (savedSession) return
    const existing = loadSession(deckRef, mode)
    if (existing) {
      setSavedSession(existing)
      setShowResume(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckRef, phase, mode])

  // ─────────────────────────────────────────────────────────────────
  // Timer countdown (QUIZ/LEARN/SPELL with time limit)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          // Mark as expired and auto-submit
          setIsQuizExpired(true)
          if (phase === 'session' && mode !== 'FLASHCARD') {
            handleSubmitStudy()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeRemaining, phase, mode, handleSubmitStudy])

  // ─────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────

  const flashCurrent = flashCards[flashIndex]
  // Bug fix: studyIndex dựa trên số câu đã trả lời, KHÔNG phải luôn là 0
  const studyIndex = Object.keys(studyAnswers).length
  const flashProgress = flashCards.length > 0 ? flashIndex / flashCards.length : 0
  const studyProgress =
    studyQuestions.length > 0 ? studyIndex / studyQuestions.length : 0
  const currentProgress = mode === 'FLASHCARD' ? flashProgress : studyProgress
  const totalCards = mode === 'FLASHCARD' ? flashCards.length : studyQuestions.length
  const currentIndex = mode === 'FLASHCARD' ? flashIndex : studyIndex
  // Bug fix: cho phép chuyển mode ngay cả khi đang trong session
  const canChangeMode = true

  // ─────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────

  if (deckQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[#8B7A9E]">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <p className="text-[#EF4444]">Không tìm thấy deck.</p>
          <Button to={`/decks/${deckRef}`} className="mt-4">Về deck</Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Resume dialog
  // ─────────────────────────────────────────────────────────────────

  if (showResume && savedSession) {
    return (
      <ResumeDialog
        session={savedSession}
        onResume={handleResume}
        onDiscard={handleDiscard}
      />
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Empty flashcard state
  // ─────────────────────────────────────────────────────────────────

  if (phase === 'session' && mode === 'FLASHCARD' && !flashCurrent && flashCards.length === 0) {
    return (
      <StudyEmptyState
        deckRef={deckRef}
        onRestart={handleRestart}
        requestedCount={modeConfig.count}
        availableCount={flashAvailableCount}
      />
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Main layout
  // ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1A1520 0%, #252030 100%)' }}
    >
      <StudyHeader
        deckRef={deckRef}
        deckTitle={deckQuery.data.title}
        mode={mode}
        onModeChange={handleModeChange}
        currentIndex={currentIndex}
        totalCards={totalCards}
        showProgress={phase === 'session'}
        progress={currentProgress}
        canChangeMode={canChangeMode}
      />

      <main className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-6 sm:px-8 sm:py-8">

        {/* ── CONFIG ─────────────────────────────────────────── */}
        {phase === 'config' && (
          <StudyConfigView
            deckTitle={deckQuery.data.title}
            cardCount={deckQuery.data.cardCount}
            mode={mode}
            config={modeConfig}
            dueFetching={dueQuery.isFetching}
            startPending={startMutation.isPending}
            dueError={!!dueQuery.isError}
            onConfigChange={handleConfigChange}
            onStartFlashcard={handleStartFlashcard}
            onStartStudy={handleStartStudy}
          />
        )}

        {/* ── SESSION: FLASHCARD ─────────────────────────────── */}
        {phase === 'session' && mode === 'FLASHCARD' && flashCurrent && (
          <div className="relative flex w-full max-w-2xl flex-col items-center">
            <div className="h-[480px] w-full shrink-0">
              <Flashcard
                key={flashCurrent.cardId}
                card={flashCurrent}
                flipped={flashFlipped}
                onFlip={() => setFlashFlipped((v) => !v)}
              />
            </div>
            <RatingButtonGroup onRate={handleFlashcardRate} flipped={flashFlipped} />
          </div>
        )}

        {/* ── SESSION: QUIZ ─────────────────────────────────── */}
        {phase === 'session' && mode === 'QUIZ' && (
          <div className="flex h-full w-full items-start">
            <QuizView
              questions={studyQuestions}
              questionIndex={quizNavIndex}
              selected={studyAnswers[studyQuestions[quizNavIndex]?.questionId] ?? null}
              answeredSet={answeredSet}
              onSelect={(a) => {
                if (a === '__SKIP__' || isQuizExpired) return
                handleStudyAnswer(studyQuestions[quizNavIndex]?.questionId, a)
                const newSet = new Set(answeredSet)
                newSet.add(quizNavIndex)
                setAnsweredSet(newSet)
                if (sessionRef.current?.progress.quiz) {
                  sessionRef.current.progress.quiz.answeredSet = [...newSet]
                  persistSession()
                }
              }}
              onNavigate={handleQuizNav}
              onSubmit={handleSubmitStudy}
              submitPending={submitMutation.isPending}
              timeRemaining={timeRemaining}
              isExpired={isQuizExpired}
            />
          </div>
        )}

        {/* ── SESSION: LEARN ────────────────────────────────── */}
        {phase === 'session' && mode === 'LEARN' && (
          <div className="flex h-full w-full items-start">
            <LearnView
              questions={studyQuestions}
              questionIndex={learnNavIndex}
              answers={studyAnswers}
              onSelect={handleStudyAnswer}
              onNavigate={handleLearnNav}
              onSubmit={handleSubmitStudy}
              submitPending={submitMutation.isPending}
              timeRemaining={timeRemaining}
            />
          </div>
        )}

        {/* ── SESSION: SPELL ────────────────────────────────── */}
        {phase === 'session' && mode === 'SPELL' && (
          <div className="flex h-full w-full items-start">
            <SpellView
              questions={studyQuestions}
              questionIndex={learnNavIndex}
              answers={studyAnswers}
              onSelect={handleStudyAnswer}
              onNavigate={handleLearnNav}
              onSubmit={handleSubmitStudy}
              submitPending={submitMutation.isPending}
              timeRemaining={timeRemaining}
            />
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {phase === 'result' && mode === 'FLASHCARD' && (
          <FlashcardResult
            deckRef={deckRef}
            totalCards={flashCards.length}
            stats={flashStats}
            onRestart={handleRestart}
          />
        )}

        {phase === 'result' && mode !== 'FLASHCARD' && studyResult && (
          <QuizResult
            deckRef={deckRef}
            correct={studyResult.correct}
            total={studyResult.total}
            questions={studyQuestions}
            answers={studyAnswers}
            onRestart={handleRestart}
          />
        )}

      </main>
    </div>
  )
}
