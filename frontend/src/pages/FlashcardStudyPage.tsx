import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { reviewApi } from '@/api/review'
import { decksApi } from '@/api/decks'
import Flashcard from '@/components/flashcard/Flashcard'
import RatingButtonGroup from '@/components/review/RatingButtonGroup'
import DeckProgressBar from '@/components/flashcard/DeckProgressBar'
import Button from '@/components/ui/Button'
import { shuffleArray } from '@/utils/shuffle'
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

type SessionPhase = 'config' | 'session' | 'result'

const DEFAULT_CONFIG: StudyConfig = {
  shuffle: true,
  count: 20,
  ttlHours: 1,
}

export default function FlashcardStudyPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const navigate = useNavigate()

  const sessionRef = useRef<StudySession | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('config')

  // Resume dialog
  const [showResume, setShowResume] = useState(false)
  const [savedSession, setSavedSession] = useState<StudySession | null>(null)
  const resumeDismissed = useRef(false)

  // Session state
  const [cards, setCards] = useState<DueCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
  const [availableCount, setAvailableCount] = useState(0)
  const [shuffleCards, setShuffleCards] = useState(true)
  const [cardCount, setCardCount] = useState(20)

  const current = cards[index]

  const persistSession = useCallback(() => {
    if (sessionRef.current) saveSession(sessionRef.current)
  }, [])

  // Queries
  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
  })

  const dueQuery = useQuery({
    queryKey: ['review', 'due', deckRef],
    queryFn: () => reviewApi.getDue({ deckRef, limit: 200 }).then((r) => r.data),
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
        toast.success(`+${data.xpEarned} XP`, {
          duration: 1500,
          style: { background: '#252030', color: '#F5F0FA' },
        })
      }
      dueQuery.refetch()
    },
    onError: () => toast.error('Failed to submit rating'),
  })

  // Handlers
  const handleStart = useCallback(() => {
    dueQuery.refetch().then(({ data }) => {
      const dueCards: DueCard[] = data?.cards ?? []
      let cardsToUse = dueCards

      if (dueCards.length < cardCount) {
        deckCardsQuery.refetch().then(({ data: deckCards }) => {
          if (deckCards && deckCards.length > 0) {
            const allDeckCards: DueCard[] = deckCards.map((card) => ({
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
            const dueIds = new Set(dueCards.map((c) => c.cardId))
            const newCards = allDeckCards.filter((c) => !dueIds.has(c.cardId))
            cardsToUse = [...dueCards, ...newCards]
          }
          finishInit(cardsToUse)
        })
      } else {
        finishInit(cardsToUse)
      }
    })
  }, [dueQuery, deckCardsQuery, cardCount])

  const finishInit = (cardsToUse: DueCard[]) => {
    setAvailableCount(cardsToUse.length)
    const selected = shuffleCards ? shuffleArray([...cardsToUse]) : cardsToUse
    const sliced = selected.slice(0, cardCount)

    if (sliced.length === 0) {
      setCards([])
      setIndex(0)
      setPhase('session')
      return
    }

    sessionRef.current = createSession(deckRef, 'FLASHCARD', { ...DEFAULT_CONFIG, shuffle: shuffleCards, count: cardCount }, sliced)
    persistSession()
    setCards(sliced)
    setIndex(0)
    setFlipped(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
    setPhase('session')
  }

  const handleRate = useCallback((rating: ReviewRating) => {
    rateMutation.mutate(rating)
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
  }, [rateMutation, index, cards.length, deckRef, persistSession])

  const handleResume = useCallback(() => {
    if (!savedSession) return
    resumeDismissed.current = true
    deckCardsQuery.refetch().then(({ data: deckCards }) => {
      setShowResume(false)
      setSavedSession(null)
      if (!deckCards || deckCards.length === 0) {
        clearSession(deckRef, 'FLASHCARD')
        setPhase('config')
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
        setPhase('config')
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
    setPhase('config')
  }, [savedSession, deckRef])

  const handleRestart = useCallback(() => {
    clearSession(deckRef, 'FLASHCARD')
    sessionRef.current = null
    setCards([])
    setIndex(0)
    setFlipped(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
    setPhase('config')
  }, [deckRef])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'session') return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!flipped) {
          setFlipped(true)
          if (sessionRef.current?.progress.flashcard) {
            sessionRef.current.progress.flashcard.flipped = true
            persistSession()
          }
        }
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

  // Check saved session on config phase
  useEffect(() => {
    if (phase !== 'config') return
    if (resumeDismissed.current) { resumeDismissed.current = false; return }
    if (savedSession) return
    const existing = loadSession(deckRef, 'FLASHCARD')
    if (existing) {
      setSavedSession(existing)
      setShowResume(true)
    }
  }, [deckRef, phase])

  // Derived
  const done = index >= cards.length && cards.length > 0

  // Loading
  if (deckQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[#8B7A9E]">Loading...</p>
        </div>
      </div>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <p className="text-[#EF4444]">Deck not found.</p>
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
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="w-full max-w-sm rounded-3xl border border-[#3D3348] bg-[#252030] p-6 text-center shadow-2xl">
          <h2 className="text-xl font-extrabold text-[#F5F0FA]">Continue studying?</h2>
          <p className="mt-2 text-sm text-[#8B7A9E]">Session from {agoText}.</p>
          <div className="mt-5 flex gap-2">
            <Button onClick={handleDiscard} variant="outline" className="flex-1">Start new</Button>
            <Button onClick={handleResume} className="flex-1">Continue</Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (phase === 'session' && !current && cards.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-4" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-[#F5F0FA]">No cards available!</h2>
          <p className="mt-2 text-sm text-[#8B7A9E]">
            Only {availableCount} cards ready.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={handleRestart}>Try again</Button>
            <Button to={`/decks/${deckRef}`} variant="outline">Back to deck</Button>
          </div>
        </div>
      </div>
    )
  }

  // Result
  if (phase === 'result' || done) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="flex h-screen flex-col" style={{ background: '#1A1520' }}>
        <header className="shrink-0">
          <DeckProgressBar mastered={stats.good + stats.easy} total={total} showLabel={false} size="sm" />
          <div className="flex h-14 items-center px-4">
            <button
              onClick={() => navigate(`/decks/${deckRef}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="ml-3 truncate text-sm font-bold text-[#F5F0FA]">{deck.title}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto px-4 py-6 sm:gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)] shadow-lg sm:h-20 sm:w-20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#10B981] sm:w-10 sm:h-10" style={{ width: '2rem', height: '2rem' }}>
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[#F5F0FA] sm:text-3xl">Complete!</h2>
            <p className="mt-2 text-sm text-[#8B7A9E]">
              Reviewed <span className="font-extrabold text-[#F5F0FA]">{total}</span> cards
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-4 gap-2">
            {[
              { label: 'Again', count: stats.again, color: '#EF4444' },
              { label: 'Hard', count: stats.hard, color: '#F59E0B' },
              { label: 'Good', count: stats.good, color: '#10B981' },
              { label: 'Easy', count: stats.easy, color: '#3B82F6' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 sm:py-3" style={{ background: `${color}18`, borderColor: `${color}66` }}>
                <span className="text-lg font-extrabold sm:text-xl" style={{ color }}>{count}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider sm:text-xs" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
          {stats.xp > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[rgba(236,72,153,0.4)] bg-[rgba(236,72,153,0.1)] px-5 py-2">
              <span className="text-xl">⚡</span>
              <span className="text-xl font-extrabold text-[#EC4899]">+{stats.xp} XP</span>
            </div>
          )}
          <div className="flex w-full max-w-md flex-col gap-2">
            <Button onClick={handleRestart} size="lg" className="w-full">Study more</Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button to={`/decks/${deckRef}`} variant="outline" className="flex-1">Back to deck</Button>
              <Button to="/flashcard" variant="outline" className="flex-1">Choose another deck</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Config
  if (phase === 'config') {
    return (
      <div className="flex h-screen flex-col" style={{ background: '#1A1520' }}>
        <header className="shrink-0 border-b border-[#3D3348]">
          <div className="flex h-14 items-center px-4">
            <button
              onClick={() => navigate(`/decks/${deckRef}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="ml-3 truncate text-sm font-bold text-[#F5F0FA]">{deck.title}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 sm:gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[rgba(236,72,153,0.2)] to-[rgba(249,115,22,0.2)] shadow-lg sm:h-16 sm:w-16">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#EC4899] sm:w-8 sm:h-8" style={{ width: '1.75rem', height: '1.75rem' }}>
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-[#F5F0FA] sm:text-2xl">{deck.title}</h1>
            <p className="mt-1 text-sm text-[#8B7A9E]">Flashcard · {deck.cardCount} cards</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-[#3D3348] bg-[#252030] p-4 sm:p-5">
            <div className="flex items-center justify-between text-sm font-semibold text-[#F5F0FA]">
              <span>Shuffle cards</span>
              <button
                type="button"
                onClick={() => setShuffleCards(!shuffleCards)}
                className={`relative h-6 w-11 rounded-full transition-all ${shuffleCards ? 'bg-[#EC4899]' : 'bg-[#3D3348]'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${shuffleCards ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm font-semibold text-[#F5F0FA]">
                <span>Number of cards</span>
                <span className="font-extrabold text-[#EC4899]">{cardCount}</span>
              </div>
              <input
                type="range" min={5} max={50} step={5}
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="study-range flex-1"
              />
            </div>
          </div>
          <Button onClick={handleStart} size="lg" className="w-full max-w-xs" disabled={dueQuery.isFetching}>
            {dueQuery.isFetching ? 'Loading...' : 'Start studying'}
          </Button>
        </main>
      </div>
    )
  }

  // Session
  return (
    <div className="flex h-screen flex-col" style={{ background: 'linear-gradient(180deg, #1A1520 0%, #252030 100%)' }}>
      <header className="shrink-0">
        <DeckProgressBar mastered={index} total={cards.length} showLabel={false} size="sm" />
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/decks/${deckRef}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="truncate text-sm font-bold text-[#F5F0FA]">{deck.title}</span>
          </div>
          <span className="text-sm font-semibold text-[#8B7A9E]">
            <span className="font-bold text-[#F5F0FA]">{index + 1}</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-[#F5F0FA]">{cards.length}</span>
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
        {/* Fixed height container for rating buttons - prevents layout jump */}
        <div className="mt-3 h-[100px] w-full max-w-2xl">
          <RatingButtonGroup onRate={handleRate} flipped={flipped} disabled={rateMutation.isPending} />
        </div>
      </main>
    </div>
  )
}
