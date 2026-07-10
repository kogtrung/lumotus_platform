import { useEffect, useRef, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { DueCard } from '@/types/review'
import { cn } from '@/utils/cn'
import CardAudioButton from '@/components/review/CardAudioButton'

interface FlashcardProps {
  card: DueCard
  flipped: boolean
  onFlip: () => void
}

export default function Flashcard({ card, flipped, onFlip }: FlashcardProps) {
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


  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchDelta.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      touchDelta.current = dx
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    touchStart.current = null
    touchDelta.current = 0
  }

  return (
    <div className="review-card-perspective animate-fade-in">
      <div
        role="button"
        tabIndex={0}
        onClick={onFlip}
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
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-1.5 flex-1">
                {card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] shadow-sm">
                    Mới
                  </span>
                )}
                {card.isStarred && !card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning)] shadow-sm">
                    ⭐
                  </span>
                )}
                <CardAudioButton audioUrl={card.audioUrl} size="sm" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              {card.imageUrl && (
                <img src={card.imageUrl} alt="" className="max-h-32 w-auto shrink-0 rounded-xl object-contain" />
              )}
              <p className="w-full text-center font-bold leading-tight text-[var(--color-text)] flashcard-front text-4xl sm:text-5xl md:text-6xl">
                {card.front}
              </p>
              {card.phonetic && (
                <p className="text-sm italic text-[var(--color-primary)] sm:text-base">{card.phonetic}</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-text)] shadow-sm">Space</kbd>
                <span>để lật thẻ</span>
              </div>
              <div className="flex gap-1">
                <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '0ms' }} />
                <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '150ms' }} />
                <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>

          {/* Back Face */}
          <div className="review-card-face review-card-back">
            <div className="flex w-full items-center justify-end">
              <CardAudioButton audioUrl={card.audioUrl} size="sm" />
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              {card.imageUrl && (
                <img src={card.imageUrl} alt="" className="max-h-28 w-auto shrink-0 rounded-xl object-contain" />
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] sm:text-sm">{card.front}</p>
              <p className="w-full text-center font-extrabold leading-tight text-[var(--color-text)] flashcard-back text-3xl sm:text-4xl md:text-5xl">
                {card.back}
              </p>
              {card.phonetic && (
                <p className="text-xs italic text-[var(--color-primary)] sm:text-sm">{card.phonetic}</p>
              )}
            </div>

            <div className="flex flex-col items-stretch justify-center gap-2 overflow-hidden">
              {card.hint && !showHint ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowHint(true) }}
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--color-warning-subtle)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-warning)] shadow-sm transition-transform hover:scale-105"
                >
                  <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Xem gợi ý
                </button>
              ) : showHint && card.hint ? (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] px-3 py-2">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-xs font-semibold text-[var(--color-warning)]">{card.hint}</p>
                </div>
              ) : <div />}

              {card.example && (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] px-3 py-2">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--color-success)]">VD</span>
                  <p className="text-xs italic font-medium leading-relaxed text-[var(--color-success)]">&ldquo;{card.example}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
