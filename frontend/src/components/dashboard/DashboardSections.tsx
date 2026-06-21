import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { DeckSummary } from '@/types/deck'
import { cn } from '@/utils/cn'

interface JumpBackCardProps {
  deck: DeckSummary
  dueCount?: number
  dueLoading?: boolean
  className?: string
}

export function JumpBackCard({ deck, dueCount = 0, dueLoading, className }: JumpBackCardProps) {
  const hasDue = dueCount > 0

  return (
    <article
      className={cn(
        'relative flex min-w-[260px] max-w-[300px] shrink-0 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:min-w-[280px]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--color-primary-subtle)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-8 h-16 w-16 rounded-full bg-[var(--color-accent-warm)] opacity-80"
        aria-hidden
      />

      <div className="relative min-w-0 flex-1">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[var(--color-text)]">
          {deck.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {deck.cardCount} thẻ
          {dueLoading ? (
            <> · đang tải…</>
          ) : hasDue ? (
            <> · <span className="font-semibold text-[var(--color-primary)]">{dueCount} đến hạn</span></>
          ) : null}
          {deck.sourceDeckTitle && (
            <> · copy từ {deck.sourceOwnerUsername ?? 'cộng đồng'}</>
          )}
        </p>
      </div>

      <Button
        to={hasDue ? `/decks/${deck.slug}/review` : `/decks/${deck.slug}`}
        size="md"
        className="relative mt-4 w-full"
      >
        {hasDue ? `Ôn ${dueCount} thẻ` : 'Tiếp tục'}
      </Button>
    </article>
  )
}

interface JumpBackStripProps {
  decks: DeckSummary[]
  dueCounts?: Record<string, number>
  dueLoading?: boolean
  loading?: boolean
}

export function JumpBackStrip({ decks, dueCounts, dueLoading, loading }: JumpBackStripProps) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-[148px] min-w-[260px] animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    )
  }

  if (decks.length === 0) return null

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
      {decks.slice(0, 4).map((deck) => (
        <JumpBackCard
          key={deck.id}
          deck={deck}
          dueCount={dueCounts?.[deck.slug] ?? 0}
          dueLoading={dueLoading}
        />
      ))}
    </div>
  )
}

interface RecentListProps {
  decks: DeckSummary[]
  loading?: boolean
  emptyMessage?: string
  currentUsername?: string
}

export function RecentList({ decks, loading, emptyMessage, currentUsername }: RecentListProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface)]" />
        ))}
      </div>
    )
  }

  if (decks.length === 0 && emptyMessage) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {decks.map((deck) => (
        <li key={deck.id}>
          <Link to={`/decks/${deck.slug}`} className="lumo-list-row">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)]">
              {deck.coverImageUrl ? (
                <img src={deck.coverImageUrl} alt="" className="h-full w-full rounded-[var(--radius-md)] object-cover" />
              ) : (
                <Layers className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--color-text)]">{deck.title}</p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">
                {deck.cardCount} thẻ · bởi {currentUsername ?? 'bạn'}
                {deck.sourceDeckTitle && (
                  <> · copy từ {deck.sourceOwnerUsername ?? deck.sourceDeckTitle}</>
                )}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

interface SuggestedStripProps {
  decks: DeckSummary[]
  loading?: boolean
  emptyMessage?: string
}

export function SuggestedStrip({ decks, loading, emptyMessage }: SuggestedStripProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[120px] w-[160px] shrink-0 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
        ))}
      </div>
    )
  }

  if (decks.length === 0 && emptyMessage) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {decks.map((deck) => (
        <Link
          key={deck.id}
          to={`/decks/${deck.slug}`}
          className="flex w-[152px] shrink-0 flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg)]"
        >
          <div className="mb-2 flex h-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)]">
            {deck.coverImageUrl ? (
              <img src={deck.coverImageUrl} alt="" className="h-full w-full rounded-[var(--radius-md)] object-cover" />
            ) : (
              <Layers className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={2} />
            )}
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-text)]">
            {deck.title}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
            {deck.cardCount} thẻ · {deck.ownerUsername}
          </p>
        </Link>
      ))}
    </div>
  )
}
