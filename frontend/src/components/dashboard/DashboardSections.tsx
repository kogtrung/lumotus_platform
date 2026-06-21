import { Link } from 'react-router-dom'
import { ArrowRight, Layers, Flame, Clock } from 'lucide-react'
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
        'group relative flex min-w-[260px] max-w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-br from-white to-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#EC4899]/30 hover:shadow-[var(--shadow-card-hover)] sm:min-w-[280px]',
        hasDue && 'border-[#EC4899]/50',
        className,
      )}
    >
      {/* Gradient accent line */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-all duration-300',
          hasDue ? 'bg-gradient-to-r from-[#EC4899] to-[#FBCFE8]' : 'bg-gradient-to-r from-slate-200 to-slate-300',
        )}
      />

      {/* Glow effect when has due */}
      {hasDue && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#EC4899]/10 blur-2xl" />
      )}

      {/* Decorative shapes */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: 'linear-gradient(135deg, #FDF2F8, #FBCFE8)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-8 h-16 w-16 rounded-full opacity-20"
        style={{ background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)' }}
        aria-hidden
      />

      <div className="relative min-w-0 flex-1 pt-2">
        {/* Due badge */}
        {hasDue && !dueLoading && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-xs font-semibold text-[#DC2626]">
            <Flame className="h-3 w-3" />
            {dueCount} thẻ đến hạn
          </div>
        )}

        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[#EC4899]">
          {deck.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
          <span>{deck.cardCount} thẻ</span>
          {dueLoading && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 animate-pulse" />
              đang tải…
            </span>
          )}
          {deck.sourceDeckTitle && (
            <>· copy từ {deck.sourceOwnerUsername ?? 'cộng đồng'}</>
          )}
        </p>
      </div>

      <Button
        to={hasDue ? `/decks/${deck.slug}/review` : `/decks/${deck.slug}`}
        size="md"
        className={cn(
          'relative mt-4 w-full transition-all',
          hasDue && 'bg-[#EC4899] hover:bg-[#4F46E5]',
        )}
      >
        {hasDue ? (
          <>
            <Flame className="h-4 w-4" />
            Ôn {dueCount} thẻ
          </>
        ) : (
          <>
            Tiếp tục
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
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
            className="h-[160px] min-w-[260px] rounded-2xl bg-gradient-to-br from-white to-slate-50 p-5 sm:min-w-[280px]"
          >
            <div className="h-6 w-3/4 rounded-lg bg-[#E2E8F0] animate-pulse mb-2" />
            <div className="h-4 w-1/2 rounded-lg bg-[#F1F5F9] animate-pulse mb-4" />
            <div className="h-10 w-full rounded-full bg-[#E2E8F0] animate-pulse mt-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (decks.length === 0) return null

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
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
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-white to-slate-50 p-3">
            <div className="h-10 w-10 rounded-lg bg-[#E2E8F0] animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-3/4 rounded-lg bg-[#F1F5F9] animate-pulse mb-1" />
              <div className="h-3 w-1/2 rounded-lg bg-[#F1F5F9] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (decks.length === 0 && emptyMessage) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50 p-8 text-center">
        <p className="font-semibold text-[var(--color-text)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[#E2E5EC] rounded-2xl border border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50 overflow-hidden">
      {decks.map((deck) => (
        <li key={deck.id}>
          <Link
            to={`/decks/${deck.slug}`}
            className="group flex items-center gap-3 p-4 transition-all hover:bg-[#FDF2F8]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FDF2F8] to-[#FBCFE8] transition-transform group-hover:scale-105">
              {deck.coverImageUrl ? (
                <img
                  src={deck.coverImageUrl}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <Layers className="h-5 w-5 text-[#EC4899]" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--color-text)] transition-colors group-hover:text-[#EC4899]">
                {deck.title}
              </p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">
                {deck.cardCount} thẻ · bởi {currentUsername ?? 'bạn'}
                {deck.sourceDeckTitle && (
                  <> · copy từ {deck.sourceOwnerUsername ?? deck.sourceDeckTitle}</>
                )}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-1 group-hover:text-[#EC4899]" />
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
          <div key={i} className="flex w-[152px] shrink-0 flex-col rounded-xl border border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50 p-3">
            <div className="mb-2 flex h-14 items-center justify-center rounded-lg bg-[#E2E8F0] animate-pulse" />
            <div className="h-4 w-3/4 rounded-lg bg-[#F1F5F9] animate-pulse mb-1" />
            <div className="h-3 w-1/2 rounded-lg bg-[#F1F5F9] animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (decks.length === 0 && emptyMessage) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50 p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide">
      {decks.map((deck) => (
        <Link
          key={deck.id}
          to={`/decks/${deck.slug}`}
          className="group flex w-[152px] shrink-0 flex-col rounded-xl border border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50 p-3 transition-all hover:-translate-y-1 hover:border-[#EC4899]/50 hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="mb-2 flex h-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#FDF2F8] to-[#FBCFE8] transition-transform group-hover:scale-105">
            {deck.coverImageUrl ? (
              <img
                src={deck.coverImageUrl}
                alt=""
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Layers className="h-6 w-6 text-[#EC4899]" strokeWidth={2} />
            )}
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[#EC4899]">
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
