import { Link } from 'react-router-dom'
import { Copy, Eye, GitBranch, Globe, Layers, Lock, User, ArrowRight } from 'lucide-react'
import type { DeckSummary } from '@/types/deck'
import { cn } from '@/utils/cn'

interface DeckCardProps {
  deck: DeckSummary
  variant?: 'library' | 'explore'
  currentUserId?: string
  className?: string
}

export default function DeckCard({
  deck,
  variant = 'library',
  currentUserId,
  className,
}: DeckCardProps) {
  const isOwn = currentUserId === deck.ownerId
  const sourceRef = deck.sourceDeckSlug ?? deck.sourceDeckId

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl',
        'lumo-card lumo-card-hover',
        className,
      )}
    >
      <Link to={`/decks/${deck.slug}`} className="flex flex-1 flex-col p-4">
        {/* Cover thumbnail */}
        {deck.coverImageUrl ? (
          <div className="mb-3 overflow-hidden rounded-lg">
            <img
              src={deck.coverImageUrl}
              alt=""
              className="h-20 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] transition-transform duration-300 group-hover:scale-105">
            <Layers className="h-5 w-5 text-[#EC4899]/50" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges row */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {variant === 'library' && (
            <>
              {deck.isPublic ? (
                <span className="inline-flex items-center gap-1 rounded-full lumo-badge lumo-badge-success">
                  <Globe className="h-2.5 w-2.5" />
                  Công khai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                  <Lock className="h-2.5 w-2.5" />
                  Riêng tư
                </span>
              )}
            </>
          )}
          {variant === 'explore' && isOwn && (
            <span className="inline-flex items-center gap-1 rounded-full lumo-badge lumo-badge-gold">
              Của bạn
            </span>
          )}
          {deck.topics.slice(0, 1).map((t) => (
            <span
              key={t.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: t.colorHex ? `${t.colorHex}15` : 'rgba(167, 139, 250, 0.1)',
                color: t.colorHex ?? '#A78BFA',
              }}
            >
              {t.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-primary)] leading-snug">
          {deck.title}
        </h3>

        {/* Owner info (explore only) */}
        {variant === 'explore' && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary-subtle)]">
              <User className="h-2.5 w-2.5 text-[var(--color-primary)]" />
            </div>
            {deck.ownerUsername}
          </div>
        )}

        {/* Description */}
        {deck.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
            {deck.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {deck.cardCount} thẻ
          </span>
          {variant === 'explore' && (
            <>
              <span className="flex items-center gap-1 opacity-70">
                <Eye className="h-3 w-3" />
                {deck.viewCount}
              </span>
              <span className="flex items-center gap-1 opacity-70">
                <Copy className="h-3 w-3" />
                {deck.copyCount}
              </span>
            </>
          )}
        </div>
      </Link>

      {/* Source deck link */}
      {variant === 'library' && deck.sourceDeckId && deck.sourceDeckTitle && sourceRef && (
        <Link
          to={`/decks/${sourceRef}`}
          className="group/sourse flex items-center gap-2 border-t border-[var(--color-border)] px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)]/50 hover:text-[var(--color-primary)]"
        >
          <GitBranch className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1 flex-1">
            Copy từ {deck.sourceDeckTitle}
            {deck.sourceOwnerUsername ? ` · ${deck.sourceOwnerUsername}` : ''}
          </span>
          <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover/sourse:translate-x-1" />
        </Link>
      )}
    </article>
  )
}
