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
      <Link to={`/decks/${deck.slug}`} className="flex flex-1 flex-col p-3 relative z-0">
        
        {/* ABSOLUTE BADGES: Riêng tư/Công khai */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          {variant === 'library' && (
            deck.isPublic ? (
              <span title="Công khai" className="text-emerald-500 bg-emerald-50 p-1.5 rounded-full border border-emerald-100 shadow-sm">
                <Globe className="h-3 w-3" />
              </span>
            ) : (
              <span title="Riêng tư" className="text-slate-400 bg-slate-50 p-1.5 rounded-full border border-slate-200 shadow-sm">
                <Lock className="h-3 w-3" />
              </span>
            )
          )}
        </div>

        {/* Thumbnail + Title Row */}
        <div className="flex gap-2.5 mb-2 pr-10 items-center">
          {deck.coverImageUrl ? (
            <div className="shrink-0 overflow-hidden rounded-lg">
              <img
                src={deck.coverImageUrl}
                alt=""
                className="h-10 w-10 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] transition-transform duration-300 group-hover:scale-105">
              <Layers className="h-5 w-5 text-[var(--color-primary)]/50" strokeWidth={1.5} />
            </div>
          )}
          <h3 className="line-clamp-2 text-sm font-bold text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-primary)] leading-tight">
            {deck.title}
          </h3>
        </div>

        {/* Topics row */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {deck.topics.map((t) => (
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

        {/* Description */}
        {deck.description && (
          <p className="mb-2.5 line-clamp-2 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            {deck.description}
          </p>
        )}

        <div className="flex-1" />

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-text-muted)] mb-2 mt-auto">
          <span className="flex items-center gap-1 font-semibold text-[var(--color-primary)]/80 bg-[var(--color-primary)]/10 px-1 py-0.5 rounded">
            <Layers className="h-2.5 w-2.5" />
            {deck.cardCount} thẻ
          </span>
          {variant === 'explore' && (
            <>
              <span className="flex items-center gap-1 opacity-70 border-l border-[var(--color-border)] pl-1.5">
                <Eye className="h-2.5 w-2.5" />
                {deck.viewCount}
              </span>
              <span className="flex items-center gap-1 opacity-70 border-l border-[var(--color-border)] pl-1.5">
                <Copy className="h-2.5 w-2.5" />
                {deck.copyCount}
              </span>
            </>
          )}
        </div>

        {/* Owner info (explore only) */}
        {variant === 'explore' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-medium bg-[var(--color-bg)] w-max pr-2 rounded-full">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary-subtle)]">
                <User className="h-2.5 w-2.5 text-[var(--color-primary)]" />
              </div>
              {deck.ownerUsername}
            </div>
            {isOwn && (
              <span className="text-[var(--color-primary)] text-[9px] font-bold uppercase tracking-wider">
                Của bạn
              </span>
            )}
          </div>
        )}

      </Link>

      {/* Source deck link */}
      {variant === 'library' && deck.sourceDeckId && deck.sourceDeckTitle && sourceRef && (
        <Link
          to={`/decks/${sourceRef}`}
          className="group/sourse flex items-center gap-1.5 border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)]/50 hover:text-[var(--color-primary)]"
        >
          <GitBranch className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1 flex-1">
            Copy từ {deck.sourceDeckTitle}
            {deck.sourceOwnerUsername ? ` · ${deck.sourceOwnerUsername}` : ''}
          </span>
          <ArrowRight className="h-2.5 w-2.5 shrink-0 transition-transform group-hover/sourse:translate-x-1" />
        </Link>
      )}
    </article>
  )
}
