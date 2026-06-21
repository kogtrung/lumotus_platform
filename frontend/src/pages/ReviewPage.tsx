import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Shuffle, Star, X } from 'lucide-react'
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

  const [sessionCards, setSessionCards] = useState<DueCard[]>([])
  const [shuffleOn, setShuffleOn] = useState(true)
  const [starredOnly, setStarredOnly] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

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
  const progress = cards.length > 0 ? Math.min(index + 1, cards.length) / cards.length : 0

  const rateMutation = useMutation({
    mutationFn: (rating: ReviewRating) =>
      reviewApi.rate(current!.cardId, rating).then((r) => r.data),
    onSuccess: async (data) => {
      if (data.xpEarned > 0) {
        toast.success(`+${data.xpEarned} XP`)
        try {
          const me = await authApi.me()
          if (accessToken) setAuth(accessToken, me.data)
        } catch {
          // ignore
        }
      }
      setFlipped(false)
      // Chờ reset flip trước khi đổi thẻ — tránh animation 180°→0° với nội dung thẻ mới
      requestAnimationFrame(() => {
        setIndex((i) => i + 1)
      })
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
    },
  })

  const toggleStarredOnly = () => {
    setStarredOnly((prev) => {
      toast.success(prev ? 'Ôn tất cả thẻ' : 'Chỉ ôn thẻ đã gắn sao')
      return !prev
    })
  }

  const toggleShuffle = () => {
    setShuffleOn((prev) => {
      toast.success(prev ? 'Tắt xáo trộn' : 'Bật xáo trộn thẻ')
      return !prev
    })
  }

  if (dueQuery.isLoading || deckQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)]">
        Đang tải thẻ...
      </div>
    )
  }

  if (dueQuery.isError || deckQuery.isError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
        <p className="text-xl font-bold text-[var(--color-text)]">Không tải được phiên ôn</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Kiểm tra backend đã restart sau khi thêm API review chưa.
        </p>
        <Button to={`/decks/${deckRef}`} className="mt-6">
          Về deck
        </Button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
        <p className="text-xl font-bold text-[var(--color-text)]">Không có thẻ cần ôn</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Thêm thẻ hoặc quay lại sau khi đến hạn SRS.
        </p>
        <Button to={`/decks/${deckRef}`} className="mt-6">
          Về deck
        </Button>
      </div>
    )
  }

  if (sessionDone) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
        <p className="text-xl font-bold text-[var(--color-text)]">Hoàn thành phiên ôn!</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Bạn đã ôn {cards.length} thẻ trong lượt này.
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => {
              const source = dueQuery.data?.cards ?? []
              setSessionCards(shuffleOn ? shuffleArray(source) : [...source])
              setIndex(0)
              setFlipped(false)
              dueQuery.refetch()
            }}
          >
            Ôn tiếp
          </Button>
          <Button to={`/decks/${deckRef}`} variant="outline">
            Về deck
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="review-session relative flex min-h-screen flex-col bg-[var(--color-bg)]">
      <Link
        to={`/decks/${deckRef}`}
        className="review-exit-btn fixed right-4 top-4 z-50"
        aria-label="Thoát ôn tập"
      >
        <X className="h-5 w-5" strokeWidth={2.25} />
      </Link>

      <header className="shrink-0 px-4 pt-4 pb-2">
        <div className="mx-auto max-w-lg pr-10">
          <p className="truncate text-center text-sm font-bold text-[var(--color-text)]">
            {deckQuery.data?.title ?? 'Ôn tập'}
          </p>
          <p className="mt-0.5 text-center text-xs text-[var(--color-text-muted)]">
            {index + 1} / {cards.length}
            {dueQuery.data && dueQuery.data.dueCount > cards.length && (
              <> · {dueQuery.data.dueCount} đến hạn</>
            )}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                shuffleOn
                  ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
              )}
              aria-pressed={shuffleOn}
            >
              <Shuffle className="h-3.5 w-3.5" strokeWidth={2.25} />
              Xáo trộn
            </button>
            <button
              type="button"
              onClick={toggleStarredOnly}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                starredOnly
                  ? 'bg-[var(--color-accent-warm)] text-[var(--color-warning)] shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
              )}
              aria-pressed={starredOnly}
            >
              <Star className="h-3.5 w-3.5" fill={starredOnly ? 'currentColor' : 'none'} strokeWidth={2.25} />
              Chỉ sao
            </button>
            <button
              type="button"
              onClick={() => starMutation.mutate()}
              disabled={!current || starMutation.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                current?.isStarred
                  ? 'bg-[var(--color-accent-warm)] text-[var(--color-warning)] shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
              )}
              aria-label="Đánh dấu sao"
            >
              <Star
                className="h-3.5 w-3.5"
                fill={current?.isStarred ? 'currentColor' : 'none'}
                strokeWidth={2.25}
              />
              Sao
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-4">
        {current && (
          <ReviewFlashcard
            key={current.cardId}
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
          />
        )}
      </main>

      <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-[var(--shadow-bar-top)]">
        <div className="mx-auto max-w-2xl">
          {!flipped && (
            <p className="mb-3 text-center text-xs font-medium text-[var(--color-text-muted)]">
              Lật thẻ để hiện đáp án, rồi chọn mức nhớ bên dưới
            </p>
          )}
          <RatingButtonGroup
            inactive={!flipped}
            disabled={rateMutation.isPending || !flipped}
            onRate={(rating) => rateMutation.mutate(rating)}
          />
        </div>
      </footer>
    </div>
  )
}
