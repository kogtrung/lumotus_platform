import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, Shuffle, Star, X, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewApi } from '@/api/review'
import { decksApi } from '@/api/decks'
import RatingButtonGroup from '@/components/review/RatingButtonGroup'
import ReviewFlashcard from '@/components/review/ReviewFlashcard'
import Button from '@/components/ui/Button'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { shuffleArray } from '@/utils/shuffle'
import { cn } from '@/utils/cn'
import type { DueCard } from '@/types/review'
import type { ReviewRating } from '@/types/review'

export default function ReviewPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  const [sessionCards, setSessionCards] = useState<DueCard[]>([])
  const [shuffleOn, setShuffleOn] = useState(true)
  const [starredOnly, setStarredOnly] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })

  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
  })

  const dueQuery = useQuery({
    queryKey: ['review', 'due', deckRef, starredOnly],
    queryFn: () =>
      reviewApi.getDue({ deckRef, limit: 50, starredOnly: starredOnly || undefined }).then((r) => r.data),
    enabled: !!deckRef,
  })

  useEffect(() => {
    const source = dueQuery.data?.cards ?? []
    if (source.length === 0) {
      setSessionCards([])
      return
    }
    setSessionCards(shuffleOn ? shuffleArray(source) : [...source])
    setIndex(0)
    setFlipped(false)
  }, [dueQuery.dataUpdatedAt, shuffleOn, starredOnly, deckRef])

  const cards = sessionCards
  const current = cards[index]
  const finished = !dueQuery.isLoading && cards.length === 0
  const sessionDone = !dueQuery.isLoading && index >= cards.length && cards.length > 0
  const progress = cards.length > 0 ? Math.min(index, cards.length) / cards.length : 0

  const goNext = useCallback(() => {
    setFlipped(false)
    requestAnimationFrame(() => {
      setIndex((i) => i + 1)
    })
  }, [])

  const goPrev = useCallback(() => {
    if (index === 0) return
    setFlipped(false)
    setIndex((i) => i - 1)
  }, [index])

  const rateMutation = useMutation({
    mutationFn: (rating: ReviewRating) =>
      reviewApi.rate(current!.cardId, rating).then((r) => r.data),
    onSuccess: async (data, rating) => {
      setSessionStats((s) => ({
        again: rating === 'AGAIN' ? s.again + 1 : s.again,
        hard: rating === 'HARD' ? s.hard + 1 : s.hard,
        good: rating === 'GOOD' ? s.good + 1 : s.good,
        easy: rating === 'EASY' ? s.easy + 1 : s.easy,
        xp: s.xp + data.xpEarned,
      }))

      if (data.xpEarned > 0) {
        toast.success(`+${data.xpEarned} XP`, {
          duration: 1500,
          position: 'top-center',
          style: { fontSize: '14px', padding: '8px 16px' },
        })
        try {
          const me = await authApi.me()
          if (accessToken) setAuth(accessToken, me.data)
        } catch {
          // ignore
        }
      }
      queryClient.invalidateQueries({ queryKey: ['review', 'due', deckRef, starredOnly] })
      goNext()
    },
    onError: () => toast.error('Không gửi được đánh giá'),
  })

  const starMutation = useMutation({
    mutationFn: () => reviewApi.star(current!.cardId),
    onSuccess: (res) => {
      const starred = res.data.starred
      setSessionCards((prev) =>
        prev.map((c) => (c.cardId === current?.cardId ? { ...c, isStarred: starred } : c)),
      )
      if (starredOnly && !starred) {
        setSessionCards((prev) => prev.filter((c) => c.cardId !== current?.cardId))
      }
      toast.success(starred ? 'Đã gắn sao ⭐' : 'Đã bỏ sao', { duration: 1200 })
    },
  })

  // Phím tắt: Space lật, 1-4 rate, S star, ← prev
  useEffect(() => {
    if (!current || finished || sessionDone) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!flipped) setFlipped(true)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (flipped) {
        const map: Record<string, ReviewRating> = {
          '1': 'AGAIN',
          '2': 'HARD',
          '3': 'GOOD',
          '4': 'EASY',
        }
        if (map[e.key]) {
          e.preventDefault()
          rateMutation.mutate(map[e.key])
        }
      }
      if (e.key.toLowerCase() === 's' && flipped) {
        e.preventDefault()
        starMutation.mutate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, flipped, finished, sessionDone, goPrev, rateMutation, starMutation])

  const toggleStarredOnly = () => {
    setStarredOnly((prev) => {
      toast.success(prev ? 'Ôn tất cả thẻ' : 'Chỉ ôn thẻ đã gắn sao', { duration: 1500 })
      return !prev
    })
    setMenuOpen(false)
  }

  const toggleShuffle = () => {
    setShuffleOn((prev) => {
      toast.success(prev ? 'Đã tắt xáo trộn' : 'Đã bật xáo trộn', { duration: 1500 })
      return !prev
    })
    setMenuOpen(false)
  }

  const restartSession = () => {
    const source = dueQuery.data?.cards ?? []
    setSessionCards(shuffleOn ? shuffleArray(source) : [...source])
    setIndex(0)
    setFlipped(false)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 })
    dueQuery.refetch()
    setMenuOpen(false)
  }

  if (dueQuery.isLoading || deckQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-bg)] to-[#F1F3F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="review-loader" />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">Đang tải thẻ...</p>
        </div>
      </div>
    )
  }

  if (dueQuery.isError || deckQuery.isError) {
    return (
      <div className="review-empty mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger-subtle)]">
          <X className="h-10 w-10 text-[var(--color-danger)]" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Không tải được phiên ôn</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Kiểm tra backend đã restart sau khi thêm API review chưa.
        </p>
        <Button to={`/decks/${deckRef}`} className="mt-6">
          Quay lại deck
        </Button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="review-empty mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-primary-subtle)] to-[var(--color-accent-warm)] shadow-lg">
          <Star className="h-12 w-12 fill-[var(--color-warning)] text-[var(--color-warning)]" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Không có thẻ cần ôn</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Thêm thẻ mới hoặc quay lại sau khi đến hạn.
        </p>
        <Button to={`/decks/${deckRef}`} className="mt-6">
          Quay lại deck
        </Button>
      </div>
    )
  }

  if (sessionDone) {
    return (
      <div className="review-empty mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#10B981] to-[#34D399] shadow-2xl shadow-[#10B981]/30">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-text)]">Hoàn thành phiên ôn!</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Bạn đã ôn {cards.length} thẻ trong lượt này.
        </p>

        {/* Stats */}
        <div className="mt-6 grid w-full grid-cols-4 gap-2">
          {[
            { label: 'Quên', value: sessionStats.again, color: 'text-[#B91C1C]', bg: 'bg-red-50' },
            { label: 'Khó', value: sessionStats.hard, color: 'text-[#B45309]', bg: 'bg-amber-50' },
            { label: 'Đúng', value: sessionStats.good, color: 'text-[#047857]', bg: 'bg-emerald-50' },
            { label: 'Dễ', value: sessionStats.easy, color: 'text-[#1D4ED8]', bg: 'bg-blue-50' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-2xl p-3', s.bg)}>
              <div className={cn('text-2xl font-extrabold', s.color)}>{s.value}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {sessionStats.xp > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FEF3C7] to-[#FED7AA] px-4 py-2 text-sm font-bold text-[#92400E] shadow-sm">
            <span>✨</span>
            <span>+{sessionStats.xp} XP đã nhận</span>
          </div>
        )}

        <div className="mt-8 flex w-full gap-2">
          <Button onClick={restartSession} className="flex-1">
            Ôn tiếp
          </Button>
          <Button to={`/decks/${deckRef}`} variant="outline" className="flex-1">
            Về deck
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="review-session relative flex min-h-screen flex-col bg-gradient-to-br from-[var(--color-bg)] via-[#F8F9FC] to-[var(--color-bg)]">
      {/* Top bar - clean, chỉ progress + nút thoát */}
      <header className="sticky top-0 z-30 shrink-0 bg-[var(--color-bg)]/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to={`/decks/${deckRef}`}
            className="review-icon-btn"
            aria-label="Quay lại deck"
            title="Quay lại deck"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span className="truncate">{deckQuery.data?.title ?? 'Ôn tập'}</span>
              <span className="ml-2 shrink-0 tabular-nums">
                {index + 1} / {cards.length}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[#F97316] transition-all duration-500 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="review-icon-btn"
              aria-label="Tuỳ chọn"
              title="Tuỳ chọn"
            >
              <MoreVertical className="h-5 w-5" strokeWidth={2.5} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="review-menu absolute right-0 top-12 z-40 w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    className={cn('review-menu-item', shuffleOn && 'review-menu-item--active')}
                  >
                    <Shuffle className="h-4 w-4" strokeWidth={2.25} />
                    <span>Xáo trộn thẻ</span>
                    {shuffleOn && <span className="ml-auto text-[10px] font-bold text-[var(--color-primary)]">ON</span>}
                  </button>
                  <button
                    type="button"
                    onClick={toggleStarredOnly}
                    className={cn('review-menu-item', starredOnly && 'review-menu-item--active')}
                  >
                    <Star className="h-4 w-4" strokeWidth={2.25} />
                    <span>Chỉ ôn thẻ sao</span>
                    {starredOnly && <span className="ml-auto text-[10px] font-bold text-[var(--color-warning)]">ON</span>}
                  </button>
                  <div className="my-1 h-px bg-[var(--color-border)]" />
                  <button
                    type="button"
                    onClick={restartSession}
                    className="review-menu-item"
                  >
                    <Settings2 className="h-4 w-4" strokeWidth={2.25} />
                    <span>Ôn lại từ đầu</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main: card centered */}
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:py-8">
        {current && (
          <ReviewFlashcard
            key={current.cardId}
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
            onPrev={goPrev}
            hasPrev={index > 0}
          />
        )}
      </main>

      {/* Footer: actions */}
      <footer className="shrink-0 bg-[var(--color-surface)] px-4 pb-4 pt-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] sm:px-6">
        <div className="mx-auto max-w-2xl">
          {!flipped ? (
            // Trước khi lật: 1 nút lật lớn + star
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => starMutation.mutate()}
                disabled={starMutation.isPending}
                className={cn(
                  'review-icon-btn review-icon-btn--lg',
                  current?.isStarred && 'review-icon-btn--starred',
                )}
                aria-label={current?.isStarred ? 'Bỏ gắn sao' : 'Gắn sao'}
                title={current?.isStarred ? 'Bỏ gắn sao (S)' : 'Gắn sao (S)'}
              >
                <Star
                  className="h-5 w-5"
                  strokeWidth={2.25}
                  fill={current?.isStarred ? 'currentColor' : 'none'}
                />
              </button>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="review-flip-cta group"
                aria-label="Lật thẻ"
              >
                <span className="text-base font-extrabold sm:text-lg">Lật thẻ</span>
                <kbd className="ml-2 hidden rounded border border-white/30 bg-white/20 px-2 py-0.5 font-mono text-xs font-bold backdrop-blur-sm sm:inline-block">
                  Space
                </kbd>
              </button>
            </div>
          ) : (
            // Sau khi lật: 4 nút rating
            <RatingButtonGroup
              inactive={!flipped}
              disabled={rateMutation.isPending}
              onRate={(rating) => rateMutation.mutate(rating)}
            />
          )}
        </div>
      </footer>
    </div>
  )
}
