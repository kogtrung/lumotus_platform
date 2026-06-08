import { Link } from 'react-router-dom'
import { Copy, Eye, Layers } from 'lucide-react'
import type { DeckSummary } from '@/types/deck'
import { cn } from '@/utils/cn'

interface DeckCardProps {
  deck: DeckSummary
  className?: string
}

export default function DeckCard({ deck, className }: DeckCardProps) {
  return (
    <Link
      to={`/decks/${deck.slug}`}
      className={cn('lumo-card lumo-card-hover group flex flex-col p-4', className)}
    >
      {deck.coverImageUrl ? (
        <img
          src={deck.coverImageUrl}
          alt=""
          className="mb-3 h-28 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)]">
          <Layers className="h-8 w-8 text-[var(--color-primary)]" strokeWidth={1.75} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {deck.isPublic && (
          <span className="rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
            Công khai
          </span>
        )}
        {deck.topics.slice(0, 2).map((t) => (
          <span
            key={t.id}
            className="rounded-full px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]"
            style={{ backgroundColor: t.colorHex ? `${t.colorHex}22` : 'var(--color-bg)' }}
          >
            {t.name}
          </span>
        ))}
      </div>

      <h3 className="mt-2 line-clamp-2 font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
        {deck.title}
      </h3>

      {deck.description && (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{deck.description}</p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-[var(--color-text-muted)]">
        <span>{deck.cardCount} thẻ</span>
        {deck.isPublic && (
          <>
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3.5 w-3.5" />
              {deck.viewCount}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Copy className="h-3.5 w-3.5" />
              {deck.copyCount}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}
