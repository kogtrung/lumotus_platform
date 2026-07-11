import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lumotoast } from '@/components/ui/Toast'
import { X } from 'lucide-react'
import { reviewApi } from '@/api/review'
import { decksApi } from '@/api/decks'
import Flashcard from '@/components/flashcard/Flashcard'
import RatingButtonGroup from '@/components/review/RatingButtonGroup'
import DeckProgressBar from '@/components/flashcard/DeckProgressBar'
import Button from '@/components/ui/Button'
import { useOfflineSyncQueue } from '@/hooks/useOfflineSyncQueue'
import {
  type StudySession,
  type StudyConfig,
  loadSession,
  saveSession,
  clearSession,
  createSession,
  mergeRating,
} from '@/utils/studySession'
import type { DueCard, ReviewRating } from '@/types/review'

type SessionPhase = 'session' | 'result'

const FLASHCARD_CONFIG: StudyConfig = {
  shuffle: false,
  count: 500,
  ttlHours: 1,
}

export default function FlashcardStudyPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const navigate = useNavigate()

  const queryClient = useQueryClient()
  const sessionRef = useRef<StudySession | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('session')

  // Resume dialog
  const [showResume, setShowResume] = useState(false)
  const [savedSession, setSavedSession] = useState<StudySession | null>(null)
  const resumeDismissed = useRef(false)

  // Dev Toggle
  const [simulatedOffline, setSimulatedOffline] = useState(false)

  // Offline Sync
  const { addToQueue, processSync } = useOfflineSyncQueue()

  // Session state
  const [cards, setCards] = useState<DueCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
  const [availableCount, setAvailableCount] = useState(0)

  const current = cards[index]

  const persistSession = useCallback(() => {
    if (sessionRef.current) {
      saveSession(sessionRef.current)
    }
  }, [])

  // Queries
  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
  })

  const dueQuery = useQuery({
    queryKey: ['review', 'due', deckRef],
    queryFn: () => reviewApi.getDue({ deckRef, limit: 500 }).then((r) => r.data),
    enabled: false,
  })

  const deckCardsQuery = useQuery({
    queryKey: ['deck', deckRef, 'cards', 'all'],
    queryFn: () => decksApi.listCards(deckRef, { page: 0, size: 500 }).then((r) => r.data.content),
    enabled: false,
  })

  // Mutations
  const rateMutation = useMutation({
    mutationFn: (rating: ReviewRating) =>
      reviewApi.rate(cards[index]!.cardId, rating).then((r) => r.data),
    onSuccess: (data, rating) => {
      if (sessionRef.current) {
        sessionRef.current = mergeRating(sessionRef.current, rating, data.xpEarned)
        persistSession()
      }
      setStats((s) => {
        const next = { ...s }
        if (rating === 'AGAIN') next.again++
        else if (rating === 'HARD') next.hard++
        else if (rating === 'GOOD') next.good++
        else if (rating === 'EASY') next.easy++
        next.xp += data.xpEarned
        return next
      })
      if (data.xpEarned > 0) {
        lumotoast.success(`+${data.xpEarned} XP`, 1500)
      }
      queryClient.invalidateQueries({ queryKey: ['progress', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'weekly'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'activity'] })
      dueQuery.refetch()
    },
    onError: () => lumotoast.error('Failed to submit rating'),
  })

  const initSession = useCallback(() => {
    dueQuery.refetch().then(({ data }) => {
      const dueCards: DueCard[] = data?.cards ?? []
      const ordered = dueCards
      setAvailableCount(ordered.length)

      if (ordered.length === 0) {
        setCards([])
        setIndex(0)
        setPhase('session')
        return
      }

      sessionRef.current = createSession(deckRef, 'FLASHCARD', FLASHCARD_CONFIG, ordered)
      persistSession()
      setCards(ordered)
      setIndex(0)
      setFlipped(false)
      setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
      setPhase('session')
    })
  }, [dueQuery, deckRef, persistSession])

  const handleRate = useCallback((rating: ReviewRating) => {
    if (!navigator.onLine || simulatedOffline) {
      addToQueue(cards[index]!.cardId, rating)
      const multiplier = deckQuery.data?.xpMultiplier ?? 1;
      const baseOfflineXp = rating === 'AGAIN' ? 0 : rating === 'HARD' ? 5 : rating === 'GOOD' ? 10 : 12;
      const offlineXp = Math.ceil(baseOfflineXp * multiplier);
      
      setStats((s) => {
        const next = { ...s }
        if (rating === 'AGAIN') next.again++
        else if (rating === 'HARD') next.hard++
        else if (rating === 'GOOD') next.good++
        else if (rating === 'EASY') next.easy++
        next.xp += offlineXp
        return next
      })
      if (offlineXp > 0) {
        lumotoast.success(`+${offlineXp} XP (Tạm tính)`, 1500)
      }
    } else {
      rateMutation.mutate(rating)
    }

    setFlipped(false)
    requestAnimationFrame(() => {
      const next = index + 1
      if (next >= cards.length) {
        clearSession(deckRef, 'FLASHCARD')
        sessionRef.current = null
        setPhase('result')
      } else {
        if (sessionRef.current?.progress.flashcard) {
          sessionRef.current.progress.flashcard.currentIndex = next
          sessionRef.current.progress.flashcard.flipped = false
          persistSession()
        }
        setIndex(next)
      }
    })
  }, [rateMutation, index, cards.length, deckRef, persistSession, addToQueue])

  const handleResume = useCallback(() => {
    if (!savedSession) return
    resumeDismissed.current = true
    deckCardsQuery.refetch().then(({ data: deckCards }) => {
      setShowResume(false)
      setSavedSession(null)
      if (!deckCards || deckCards.length === 0) {
        clearSession(deckRef, 'FLASHCARD')
        setPhase('session')
        return
      }

      const allCards: DueCard[] = deckCards.map((card) => ({
        cardId: card.id,
        deckId: card.deckId,
        front: card.front,
        back: card.back,
        phonetic: card.phonetic ?? null,
        example: card.example ?? null,
        hint: card.hint ?? null,
        imageUrl: card.imageUrl ?? null,
        audioUrl: card.audioUrl ?? null,
        isNew: true,
        isStarred: false,
        repetitions: null,
        intervalDays: null,
        nextReviewAt: null,
      }))

      const cardMap = new Map(allCards.map((c) => [c.cardId, c]))
      const resolved = (savedSession.sessionCardIds ?? [])
        .map((id) => cardMap.get(id))
        .filter((c): c is DueCard => c != null)

      if (resolved.length === 0) {
        clearSession(deckRef, 'FLASHCARD')
        setPhase('session')
        return
      }

      sessionRef.current = savedSession
      setCards(resolved)
      setIndex(savedSession.progress.flashcard?.currentIndex ?? 0)
      setFlipped(savedSession.progress.flashcard?.flipped ?? false)
      setStats(savedSession.progress.stats)
      setPhase('session')
    })
  }, [savedSession, deckCardsQuery, deckRef])

  const handleDiscard = useCallback(() => {
    resumeDismissed.current = true
    if (savedSession) clearSession(deckRef, 'FLASHCARD')
    sessionRef.current = null
    setShowResume(false)
    setSavedSession(null)
    setPhase('session')
  }, [savedSession, deckRef])

  const handleRestart = useCallback(() => {
    clearSession(deckRef, 'FLASHCARD')
    sessionRef.current = null
    setCards([])
    setIndex(0)
    setFlipped(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
    setPhase('session')
  }, [deckRef])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'session') return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(prev => {
          const newFlipped = !prev
          if (sessionRef.current?.progress.flashcard) {
            sessionRef.current.progress.flashcard.flipped = newFlipped
            persistSession()
          }
          return newFlipped
        })
      } else if (flipped) {
        const map: Record<string, ReviewRating> = { '1': 'AGAIN', '2': 'HARD', '3': 'GOOD', '4': 'EASY' }
        if (map[e.key]) {
          e.preventDefault()
          handleRate(map[e.key])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, flipped, handleRate, persistSession])

  // Persist on index/flip change
  useEffect(() => {
    if (!current || cards.length === 0) return
    if (sessionRef.current?.progress.flashcard) {
      sessionRef.current.progress.flashcard.currentIndex = index
      sessionRef.current.progress.flashcard.flipped = flipped
      persistSession()
    }
  }, [index, flipped, cards.length, current, persistSession])

  // Clear on completion
  useEffect(() => {
    const done = index >= cards.length && cards.length > 0
    if (done && sessionRef.current) {
      clearSession(deckRef, 'FLASHCARD')
      sessionRef.current = null
    }
  }, [index, cards.length, deckRef])

  // Check saved session on session phase
  useEffect(() => {
    if (phase !== 'session') return
    if (resumeDismissed.current) {
      resumeDismissed.current = false
      return
    }
    if (savedSession) return
    const existing = loadSession(deckRef, 'FLASHCARD')
    if (existing) {
      setSavedSession(existing)
      setShowResume(true)
    }
  }, [deckRef, phase])

  // Auto-start when entering session phase with no cards and no resume dialog
  useEffect(() => {
    if (phase !== 'session') return
    if (showResume) return
    if (cards.length > 0) return
    initSession()
  }, [phase, showResume, cards.length, initSession])

  // Derived
  const done = index >= cards.length && cards.length > 0

  // Loading
  if (deckQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-[var(--color-danger)]">Deck not found.</p>
          <Button to={`/decks/${deckRef}`} className="mt-4">Back to deck</Button>
        </div>
      </div>
    )
  }

  const deck = deckQuery.data

  // Resume dialog
  if (showResume && savedSession) {
    const savedAt = new Date(savedSession.savedAt)
    const ago = Math.floor((Date.now() - savedAt.getTime()) / 60000)
    const agoText = ago < 1 ? 'just now' : ago < 60 ? `${ago} min ago` : `${Math.floor(ago / 60)} hours ago`
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-2xl">
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">Tiếp tục học chứ?</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Phiên học từ {agoText}.</p>
          <div className="mt-5 flex gap-2">
            <Button onClick={handleDiscard} variant="outline" className="flex-1">Bắt đầu mới</Button>
            <Button onClick={handleResume} className="flex-1">Tiếp tục</Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (phase === 'session' && !current && cards.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-4 bg-[var(--color-bg)]">
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">Không còn thẻ nào!</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Chỉ có {availableCount} thẻ sẵn sàng.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={handleRestart}>Thử lại</Button>
            <Button to={`/decks/${deckRef}`} variant="outline">Về bộ thẻ</Button>
          </div>
        </div>
      </div>
    )
  }

  // Result
  if (phase === 'result' || done) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="flex h-screen flex-col bg-[var(--color-bg)]">
        <header className="shrink-0 bg-[var(--color-surface)] shadow-header">
          <DeckProgressBar mastered={stats.good + stats.easy} total={total} showLabel={false} size="sm" />
          <div className="flex h-14 items-center px-4">
            <button
              onClick={() => navigate(`/decks/${deckRef}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="ml-3 truncate text-sm font-bold text-[var(--color-text)]">{deck.title}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto px-4 py-6 sm:gap-6 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-subtle)] shadow-lg sm:h-20 sm:w-20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-success)] sm:w-10 sm:h-10" style={{ width: '2rem', height: '2rem' }}>
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">Hoàn thành!</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Đã ôn tập <span className="font-extrabold text-[var(--color-text)]">{total}</span> thẻ
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-4 gap-2">
            {[
              { label: 'Again', count: stats.again, color: 'var(--color-danger)' },
              { label: 'Hard', count: stats.hard, color: 'var(--color-warning)' },
              { label: 'Good', count: stats.good, color: 'var(--color-success)' },
              { label: 'Easy', count: stats.easy, color: '#3B82F6' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 sm:py-3" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                <span className="text-lg font-extrabold sm:text-xl" style={{ color }}>{count}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider sm:text-xs" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
          {stats.xp > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)] px-5 py-2 hover:scale-105 transition-transform">
              <span className="text-xl">⚡</span>
              <span className="text-xl font-extrabold text-[var(--color-primary)]">+{stats.xp} XP</span>
            </div>
          )}
          <div className="flex w-full max-w-md flex-col gap-2">
            <Button onClick={handleRestart} size="lg" className="w-full">Học tiếp</Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button to={`/decks/${deckRef}`} variant="outline" className="flex-1">Về bộ thẻ</Button>
              <Button to="/flashcard" variant="outline" className="flex-1">Chọn bộ thẻ khác</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Session
  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <header className="shrink-0 bg-[var(--color-surface)] shadow-header">
        <DeckProgressBar mastered={index} total={cards.length} showLabel={false} size="sm" />
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/decks/${deckRef}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="truncate text-sm font-bold text-[var(--color-text)]">{deck.title}</span>
            <button 
              onClick={() => {
                if (simulatedOffline) {
                  setSimulatedOffline(false);
                  processSync();
                } else {
                  setSimulatedOffline(true);
                }
              }}
              className={`px-2 py-0.5 ml-2 rounded text-xs font-semibold border transition-colors ${simulatedOffline ? 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30' : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]'}`}
            >
              {simulatedOffline ? '[DEV] Đang Rớt Mạng' : '[DEV] Test Offline'}
            </button>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-muted)]">
            <span className="font-bold text-[var(--color-text)]">{index + 1}</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-[var(--color-text)]">{cards.length}</span>
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="h-[380px] w-full max-w-2xl shrink-0 sm:h-[420px] md:h-[480px]">
          {current && (
            <Flashcard
              key={current.cardId}
              card={current}
              flipped={flipped}
              onFlip={() => setFlipped((v) => !v)}
            />
          )}
        </div>
        <div className="mt-3 h-[100px] w-full max-w-2xl animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <RatingButtonGroup onRate={handleRate} flipped={flipped} disabled={rateMutation.isPending} />
        </div>
      </main>
    </div>
  )
}
