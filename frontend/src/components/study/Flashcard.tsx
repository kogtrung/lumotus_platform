import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Lightbulb, Sparkles } from 'lucide-react'
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onFlip()
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
    <div className="review-card-perspective">
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
          {/* ── Front Face ── */}
          <div className="review-card-face review-card-front">
            {/* Row 1: label + audio button (top-right) */}
            <div className="flex w-full items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(236,72,153,0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#EC4899]">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                Câu hỏi
              </span>
              <div className="flex items-center gap-1.5">
                {card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(249,115,22,0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F97316] shadow-sm">
                    Mới
                  </span>
                )}
                {card.isStarred && !card.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] shadow-sm">
                    ⭐
                  </span>
                )}
                {/* Audio button in top-right corner */}
                <CardAudioButton audioUrl={card.audioUrl} size="sm" />
              </div>
            </div>

            {/* Row 2: main content — image + word + phonetic */}
            <div className="flex flex-col items-center justify-center gap-3">
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt=""
                  className="max-h-32 w-auto shrink-0 rounded-xl object-contain"
                />
              )}
              <p className="w-full text-center font-bold leading-tight text-[#F5F0FA] flashcard-front text-4xl sm:text-5xl md:text-6xl">
                {card.front}
              </p>
              {card.phonetic && (
                <p className="text-sm italic text-[#EC4899] sm:text-base">
                  {card.phonetic}
                </p>
              )}
            </div>

            {/* Row 3: tap hint (fixed height) */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8B7A9E]">
                <kbd className="rounded-md border border-[#3D3348] bg-[#2D2538] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#F5F0FA] shadow-sm">
                  Space
                </kbd>
                <span>để lật thẻ</span>
              </div>
              <div className="flex gap-1">
                <div className="h-1 w-1 animate-bounce rounded-full bg-[#EC4899]" style={{ animationDelay: '0ms' }} />
                <div className="h-1 w-1 animate-bounce rounded-full bg-[#EC4899]" style={{ animationDelay: '150ms' }} />
                <div className="h-1 w-1 animate-bounce rounded-full bg-[#EC4899]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>

          {/* ── Back Face ── */}
          <div className="review-card-face review-card-back">
            {/* Row 1: label + audio button */}
            <div className="flex w-full items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                ✓ Đáp án
              </span>
              <CardAudioButton audioUrl={card.audioUrl} size="sm" />
            </div>

            {/* Row 2: main content */}
            <div className="flex flex-col items-center justify-center gap-2">
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt=""
                  className="max-h-28 w-auto shrink-0 rounded-xl object-contain"
                />
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7A9E] sm:text-sm">
                {card.front}
              </p>
              <p className="w-full text-center font-extrabold leading-tight text-[#F5F0FA] flashcard-back text-3xl sm:text-4xl md:text-5xl">
                {card.back}
              </p>
              {card.phonetic && (
                <p className="text-xs italic text-[#EC4899] sm:text-sm">
                  {card.phonetic}
                </p>
              )}
            </div>

            {/* Row 3: hint + example (fixed height) */}
            <div className="flex flex-col items-stretch justify-center gap-2 overflow-hidden">
              {card.hint && !showHint ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowHint(true) }}
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-[rgba(245,158,11,0.2)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F59E0B] shadow-sm transition-transform hover:scale-105"
                >
                  <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Xem gợi ý
                </button>
              ) : showHint && card.hint ? (
                <div className="flex items-start gap-2 rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] px-3 py-2">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                  <p className="text-xs font-medium text-[#F5F0FA]">{card.hint}</p>
                </div>
              ) : <div />}

              {card.example && (
                <div className="flex items-start gap-2 rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)] px-3 py-2">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#10B981]">VD</span>
                  <p className="text-xs italic leading-relaxed text-[#C4B8D9]">
                    &ldquo;{card.example}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
