import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb, Sparkles, Volume2 } from 'lucide-react'
import type { DueCard } from '@/types/review'
import { cn } from '@/utils/cn'
import CardAudioButton from '@/components/review/CardAudioButton'

interface ReviewFlashcardProps {
  card: DueCard
  flipped: boolean
  onFlip: () => void
  onPrev?: () => void
  hasPrev?: boolean
}

export default function ReviewFlashcard({
  card,
  flipped,
  onFlip,
  onPrev,
  hasPrev = false,
}: ReviewFlashcardProps) {
  const [instant, setInstant] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchDelta = useRef(0)

  useEffect(() => {
    setInstant(true)
    setShowHint(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setInstant(false))
    })
    return () => cancelAnimationFrame(id)
  }, [card.cardId])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onFlip()
    } else if (event.key === 'ArrowLeft' && onPrev && hasPrev) {
      event.preventDefault()
      onPrev()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchDelta.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    // Chỉ tracking nếu swipe ngang rõ ràng
    if (Math.abs(dx) > Math.abs(dy)) {
      touchDelta.current = dx
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart.current) return
    const dx = touchDelta.current
    // Swipe left > 80px = next card (handled by parent), swipe right > 80px = prev
    if (dx > 80 && onPrev && hasPrev) {
      onPrev()
    }
    touchStart.current = null
    touchDelta.current = 0
  }

  return (
    <div className="relative mx-auto w-full max-w-xl px-2 sm:px-0">
      {/* Audio button - góc phải, không đè lên content */}
      <div className="absolute right-2 top-0 z-20 sm:right-4">
        <CardAudioButton
          audioUrl={card.audioUrl}
          preload={flipped}
          size="md"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'review-card',
          flipped && 'is-flipped',
          instant && 'review-card--instant',
        )}
        aria-label={flipped ? 'Lật về mặt trước' : 'Lật thẻ'}
      >
        <div className="review-card-track">
          {/* Front Face */}
          <div className="review-card-face review-card-front">
            <div className="review-card-inner">
              {/* Top label */}
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                  Câu hỏi
                </span>
                {card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FBCFE8] to-[#F9A8D4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#831843] shadow-sm">
                    Mới
                  </span>
                )}
                {card.isStarred && !card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-warm)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning)] shadow-sm">
                    ⭐ Đã gắn sao
                  </span>
                )}
              </div>

              {/* Image - ưu tiên hiển thị nếu có */}
              {card.imageUrl && (
                <div className="mt-4 flex w-full items-center justify-center">
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="max-h-40 w-auto rounded-2xl object-contain shadow-md sm:max-h-48"
                  />
                </div>
              )}

              {/* Word - text lớn */}
              <p className="mt-4 line-clamp-4 text-center font-bold leading-tight text-[var(--color-text)] flashcard-front text-3xl sm:text-4xl md:text-5xl">
                {card.front}
              </p>

              {/* Phonetic */}
              {card.phonetic && (
                <p className="mt-3 flex items-center justify-center gap-2 text-base italic text-[var(--color-primary)] sm:text-lg">
                  <Volume2 className="h-4 w-4" />
                  {card.phonetic}
                </p>
              )}

              {/* Tap hint */}
              <div className="mt-auto flex w-full flex-col items-center gap-1.5 pt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                  <kbd className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--color-text)] shadow-sm">
                    Space
                  </kbd>
                  <span>để lật thẻ</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '0ms' }} />
                  <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '150ms' }} />
                  <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Back Face */}
          <div className="review-card-face review-card-back">
            <div className="review-card-inner review-card-inner--back">
              {/* Top label - đáp án */}
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  ✓ Đáp án
                </span>
                {card.hint && !showHint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHint(true)
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-warm)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning)] shadow-sm transition-transform hover:scale-105"
                  >
                    <Lightbulb className="h-3 w-3" strokeWidth={2.5} />
                    Xem gợi ý
                  </button>
                )}
              </div>

              {/* Word recap */}
              <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] sm:text-base">
                {card.front}
              </p>

              {/* Meaning - text lớn nhất */}
              <p className="mt-3 line-clamp-4 text-center font-extrabold leading-tight text-[var(--color-text)] flashcard-back text-2xl sm:text-3xl md:text-4xl">
                {card.back}
              </p>

              {/* Phonetic */}
              {card.phonetic && (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm italic text-[var(--color-primary)] sm:text-base">
                  {card.phonetic}
                </p>
              )}

              {/* Hint revealed */}
              {showHint && card.hint && (
                <div className="mt-4 flex w-full items-start gap-2 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-accent-warm)] px-3 py-2.5">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-xs font-medium text-[var(--color-warning)] sm:text-sm">
                    {card.hint}
                  </p>
                </div>
              )}

              {/* Example */}
              {card.example && (
                <div className="mt-4 w-full rounded-2xl border border-[#10B981]/20 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#047857]">
                    Ví dụ
                  </p>
                  <p className="text-sm italic leading-relaxed text-[#166534] sm:text-base">
                    "{card.example}"
                  </p>
                </div>
              )}

              {/* Choose rating hint */}
              <div className="mt-auto flex w-full flex-col items-center gap-1.5 pt-4">
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  Chọn mức độ nhớ của bạn
                </p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-text-muted)]">
                  <kbd className="rounded border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-0.5 font-bold">1</kbd>
                  <span>·</span>
                  <kbd className="rounded border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-0.5 font-bold">2</kbd>
                  <span>·</span>
                  <kbd className="rounded border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-0.5 font-bold">3</kbd>
                  <span>·</span>
                  <kbd className="rounded border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-0.5 font-bold">4</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      {onPrev && hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="review-nav-arrow review-nav-arrow--left"
          aria-label="Thẻ trước"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
      <div className="review-nav-arrow review-nav-arrow--right" aria-hidden>
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </div>
    </div>
  )
}