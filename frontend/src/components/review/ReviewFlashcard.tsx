import { useEffect, useState } from 'react'
import type { DueCard } from '@/types/review'
import { cn } from '@/utils/cn'
import CardAudioButton from '@/components/review/CardAudioButton'

interface ReviewFlashcardProps {
  card: DueCard
  flipped: boolean
  onFlip: () => void
}

export default function ReviewFlashcard({ card, flipped, onFlip }: ReviewFlashcardProps) {
  // Tắt transition một frame khi mount / đổi thẻ — tránh flash mặt sau thẻ kế
  const [instant, setInstant] = useState(true)

  useEffect(() => {
    setInstant(true)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setInstant(false))
    })
    return () => cancelAnimationFrame(id)
  }, [card.cardId])

  return (
    <div className="review-flip-scene mx-auto w-full max-w-lg">
      <button
        type="button"
        onClick={onFlip}
        className={cn(
          'review-flip-card',
          flipped && 'is-flipped',
          instant && 'review-flip-card--instant',
        )}
        aria-label={flipped ? 'Lật về mặt trước' : 'Lật thẻ'}
      >
        {/* Mặt trước */}
        <div className="review-flip-face review-flip-front">
          <div className="review-flip-inner">
            {card.audioUrl && (
              <CardAudioButton
                audioUrl={card.audioUrl}
                preload={flipped}
                className="absolute right-3 top-3"
              />
            )}
            <p className="flashcard-front line-clamp-4 text-3xl font-semibold leading-tight text-[var(--color-text)] md:text-4xl">
              {card.front}
            </p>
            {card.phonetic && (
              <p className="mt-2 text-base italic text-[var(--color-text-muted)]">{card.phonetic}</p>
            )}
            {card.imageUrl && (
              <div className="mt-4 flex h-32 w-full items-center justify-center">
                <img
                  src={card.imageUrl}
                  alt=""
                  className="max-h-full max-w-full rounded-[var(--radius-md)] object-contain"
                />
              </div>
            )}
            <p className="mt-auto pt-4 text-xs text-[var(--color-text-muted)]">Chạm để lật thẻ</p>
          </div>
        </div>

        {/* Mặt sau */}
        <div className="review-flip-face review-flip-back">
          <div className="review-flip-inner">
            {card.audioUrl && (
              <CardAudioButton
                audioUrl={card.audioUrl}
                preload
                className="absolute right-3 top-3"
              />
            )}
            <p className="flashcard-back line-clamp-6 text-2xl font-medium leading-snug text-[var(--color-text)] md:text-3xl">
              {card.back}
            </p>
            {card.example && (
              <p className="mt-4 line-clamp-3 text-sm text-[var(--color-text-secondary)]">
                {card.example}
              </p>
            )}
            {card.hint && (
              <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                Gợi ý: {card.hint}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}
