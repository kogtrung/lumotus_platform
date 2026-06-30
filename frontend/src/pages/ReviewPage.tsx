import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Settings2, Shuffle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewApi } from '@/api/review'
import { decksApi } from '@/api/decks'
import Flashcard from '@/components/flashcard/Flashcard'
import Button from '@/components/ui/Button'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { shuffleArray } from '@/utils/shuffle'
import {
  loadSession,
  saveSession,
  clearSession,
  relativeTime,
  createSession,
  resolveSessionCards,
} from '@/utils/studySession'
import { cn } from '@/utils/cn'
import type { DueCard } from '@/types/review'
import type { ReviewRating } from '@/types/review'
import type { StudySession } from '@/utils/studySession'

const SHUFFLE_KEY = 'lumotus:study-shuffle'

/* ─── Settings panel ─────────────────────────────────────────── */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const shuffle = localStorage.getItem(SHUFFLE_KEY) !== 'false'

  const handleShuffle = (v: boolean) => {
    localStorage.setItem(SHUFFLE_KEY, String(v))
    toast.success(v ? 'Đã bật xáo trộn' : 'Đã tắt xáo trộn', {
      duration: 1500,
      style: { background: '#252030', color: '#F5F0FA' },
    })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="review-menu absolute right-0 top-12 z-50 w-48 rounded-2xl border border-[#3D3348] bg-[#252030] p-2 shadow-2xl">
        <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#8B7A9E]">Xáo trộn</p>
        {[{ label: 'Bật', value: true }, { label: 'Tắt', value: false }].map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => handleShuffle(o.value)}
            className={cn(
              'review-menu-item w-full',
              shuffle === o.value && 'review-menu-item--active',
            )}
          >
            <Shuffle className="h-4 w-4" strokeWidth={2.25} />
            <span>Xáo trộn {o.label}</span>
            {shuffle === o.value && <span className="ml-auto text-[10px] font-bold text-[#EC4899]">ON</span>}
          </button>
        ))}
      </div>
    </>
  )
}

/* ─── Progress bar ─────────────────────────────────────────── */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#3D3348]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] transition-all duration-500"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}

/* ─── Rating buttons ──────────────────────────────────────── */
function RatingButtons({
  onRate,
  disabled,
}: {
  onRate: (r: ReviewRating) => void
  disabled: boolean
}) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-4 gap-2">
      {([
        { rating: 'AGAIN' as ReviewRating, label: 'Lại', color: '#EF4444' },
        { rating: 'HARD' as ReviewRating, label: 'Khó', color: '#F59E0B' },
        { rating: 'GOOD' as ReviewRating, label: 'Tốt', color: '#10B981' },
        { rating: 'EASY' as ReviewRating, label: 'Dễ', color: '#EC4899' },
      ] as const).map(({ rating, label, color }) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onRate(rating)}
          className="flex flex-col items-center gap-0.5 rounded-2xl border py-3 text-center transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: `${color}18`, borderColor: `${color}66` }}
        >
          <span className="text-base font-extrabold sm:text-lg" style={{ color }}>
            {label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            [{rating === 'AGAIN' ? '1' : rating === 'HARD' ? '2' : rating === 'GOOD' ? '3' : '4'}]
          </span>
        </button>
      ))}
    </div>
  )
}

/* ─── Review page ─────────────────────────────────────────── */
export default function ReviewPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)

  const sessionRef = useRef<StudySession | null>(null)
  const [cards, setCards] = useState<DueCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [savedSession, setSavedSession] = useState<StudySession | null>(null)

  const current = cards[index]
  const finished = cards.length === 0
  const sessionDone = index >= cards.length && cards.length > 0
  const progress = cards.length > 0 ? Math.min(index, cards.length) / cards.length : 0

  const persistSession = useCallback(() => {
    if (sessionRef.current) saveSession(sessionRef.current)
  }, [])

  // ── Queries ────────────────────────────────────────────────
  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
  })

  const dueQuery = useQuery({
    queryKey: ['review', 'due', deckRef],
    queryFn: () => reviewApi.getDue({ deckRef, limit: 50 }).then((r) => r.data),
    enabled: false,
  })

  // ── Init: check for saved session ──────────────────────────
  useEffect(() => {
    if (!dueQuery.data || dueQuery.isLoading) return
    const saved = loadSession(deckRef, 'FLASHCARD')
    if (saved) {
      setSavedSession(saved)
      setShowResume(true)
    } else {
      initFresh(dueQuery.data.cards ?? [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueQuery.dataUpdatedAt])

  const initFresh = useCallback((allCards: DueCard[]) => {
    if (allCards.length === 0) { setCards([]); return }
    const shuffleOn = localStorage.getItem(SHUFFLE_KEY) !== 'false'
    const selected = shuffleOn ? shuffleArray([...allCards]) : [...allCards]
    const session = createSession(deckRef, 'FLASHCARD', {
      shuffle: shuffleOn, count: 50, ttlHours: 0.5,
    }, selected)
    sessionRef.current = session
    persistSession()
    setCards(selected)
    setIndex(0)
    setFlipped(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
  }, [deckRef, persistSession])

  const handleResume = useCallback(() => {
    if (!savedSession) return
    const allCards: DueCard[] = dueQuery.data?.cards ?? []
    const shuffledIds = shuffleArray([...allCards.map((c) => c.cardId)])
    const resolved = resolveSessionCards(savedSession, allCards, shuffledIds)
    sessionRef.current = savedSession
    setCards(resolved)
    setIndex(savedSession.progress.flashcard?.currentIndex ?? 0)
    setFlipped(savedSession.progress.flashcard?.flipped ?? false)
    setStats(savedSession.progress.stats)
    setShowResume(false)
    setSavedSession(null)
  }, [savedSession, dueQuery.data])

  const handleDiscard = useCallback(() => {
    clearSession(deckRef, 'FLASHCARD')
    sessionRef.current = null
    setShowResume(false)
    setSavedSession(null)
    initFresh(dueQuery.data?.cards ?? [])
  }, [deckRef, initFresh, dueQuery.data])

  // ── Persist on index/flip change ───────────────────────────
  useEffect(() => {
    if (!current || cards.length === 0) return
    if (sessionRef.current?.progress.flashcard) {
      sessionRef.current.progress.flashcard.currentIndex = index
      sessionRef.current.progress.flashcard.flipped = flipped
      persistSession()
    }
  }, [index, flipped, cards.length, current, persistSession])

  // ── Clear on completion ─────────────────────────────────────
  useEffect(() => {
    if ((sessionDone || (finished && cards.length > 0)) && sessionRef.current) {
      clearSession(deckRef, 'FLASHCARD')
      sessionRef.current = null
    }
  }, [sessionDone, finished, cards.length, deckRef])

  // ── Rate mutation ───────────────────────────────────────────
  const rateMutation = useMutation({
    mutationFn: (rating: ReviewRating) =>
      reviewApi.rate(current!.cardId, rating).then((r) => r.data),
    onSuccess: async (data, rating) => {
      if (sessionRef.current) {
        const s = sessionRef.current.progress.stats
        const next = { ...s }
        if (rating === 'AGAIN') next.again++
        else if (rating === 'HARD') next.hard++
        else if (rating === 'GOOD') next.good++
        else if (rating === 'EASY') next.easy++
        next.xp += data.xpEarned
        sessionRef.current.progress.stats = next
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
          position: 'top-center',
          style: { fontSize: '14px', padding: '8px 16px', background: '#252030', color: '#F5F0FA' },
        })
        try {
          const me = await authApi.me()
          if (accessToken) setAuth(accessToken, me.data)
        } catch { /* ignore */ }
      }
      dueQuery.refetch()
      setFlipped(false)
      requestAnimationFrame(() => setIndex((i) => i + 1))
    },
    onError: () => toast.error('Không gửi được đánh giá'),
  })

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    if (!current || finished || sessionDone) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!flipped) setFlipped(true)
      } else if (flipped) {
        const map: Record<string, ReviewRating> = {
          '1': 'AGAIN', '2': 'HARD', '3': 'GOOD', '4': 'EASY',
        }
        if (map[e.key]) {
          e.preventDefault()
          rateMutation.mutate(map[e.key])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, flipped, finished, sessionDone, rateMutation])

  // ── Loading ────────────────────────────────────────────────
  if (dueQuery.isLoading || deckQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[#8B7A9E]">Đang tải thẻ...</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────
  if (dueQuery.isError || deckQuery.isError) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <p className="text-[#EF4444]">Không tải được phiên ôn.</p>
          <Button to="/decks" className="mt-4">Về trang chủ</Button>
        </div>
      </div>
    )
  }

  // ── Empty / done ─────────────────────────────────────────
  if (finished || sessionDone) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#10B981]">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F5F0FA]">
            {sessionDone ? 'Hoàn thành!' : 'Không có thẻ nào'}
          </h2>
          {total > 0 && (
            <div className="mt-3 flex justify-center gap-3 text-sm font-bold text-[#8B7A9E]">
              <span className="text-[#EF4444]">Lại {stats.again}</span>
              <span className="text-[#F59E0B]">Khó {stats.hard}</span>
              <span className="text-[#10B981]">Tốt {stats.good}</span>
              <span className="text-[#EC4899]">Dễ {stats.easy}</span>
            </div>
          )}
          {stats.xp > 0 && (
            <p className="mt-2 text-xl font-extrabold text-[#EC4899]">+{stats.xp} XP</p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button to={`/decks/${deckRef}`} variant="outline">Về deck</Button>
            <Button onClick={handleDiscard}>Ôn lại</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Resume dialog ────────────────────────────────────────
  if (showResume && savedSession) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
        <div className="w-full max-w-sm rounded-3xl border border-[#3D3348] bg-[#252030] p-6 text-center shadow-2xl">
          <h2 className="text-xl font-extrabold text-[#F5F0FA]">Tiếp tục phiên ôn?</h2>
          <p className="mt-2 text-sm text-[#8B7A9E]">
            Phiên dở từ {relativeTime(savedSession.savedAt)}.
          </p>
          <div className="mt-5 flex gap-2">
            <Button onClick={handleDiscard} variant="outline" className="flex-1">
              Bắt đầu mới
            </Button>
            <Button onClick={handleResume} className="flex-1">
              Tiếp tục
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main layout ──────────────────────────────────────────
  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1A1520 0%, #252030 100%)' }}
    >
      {/* Header */}
      <header className="shrink-0">
        {progress > 0 && <ProgressBar progress={progress} />}
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: back */}
          <div className="flex items-center gap-3">
            <Link
              to={`/decks/${deckRef}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
              aria-label="Quay lại deck"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <span className="truncate text-sm font-bold text-[#F5F0FA]">
              {deckQuery.data?.title ?? 'Ôn tập'}
            </span>
          </div>

          {/* Right: index + settings */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#8B7A9E]">
              <span className="font-bold text-[#F5F0FA]">{index + 1}</span>
              <span className="mx-1">/</span>
              <span className="font-bold text-[#F5F0FA]">{cards.length}</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
                aria-label="Cài đặt"
              >
                <Settings2 className="h-4 w-4" strokeWidth={2.25} />
              </button>
              {settingsOpen && (
                <SettingsPanel onClose={() => setSettingsOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Card area */}
      <main className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-6 sm:px-8 sm:py-8">
        {current && (
          <>
            {/* Card: fixed height prevents layout shift when rating buttons appear */}
            <div className="h-[520px] w-full max-w-2xl shrink-0">
              <Flashcard
                key={current.cardId}
                card={current}
                flipped={flipped}
                onFlip={() => setFlipped((v) => !v)}
              />
            </div>

            {/* Rating buttons — only when flipped */}
            {flipped && (
              <RatingButtons onRate={rateMutation.mutate} disabled={rateMutation.isPending} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
