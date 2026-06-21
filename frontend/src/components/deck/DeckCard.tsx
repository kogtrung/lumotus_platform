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
        'lumo-card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-[#E2E5EC] bg-gradient-to-br from-white to-slate-50',
        className,
      )}
    >
      {/* Gradient accent line on top */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#EC4899] to-[#F472B6] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link to={`/decks/${deck.slug}`} className="flex flex-1 flex-col p-5">
        {/* Cover */}
        {deck.coverImageUrl ? (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <img
              src={deck.coverImageUrl}
              alt=""
              className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ) : (
          <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-[#FDF2F8] to-[#FBCFE8] transition-transform duration-300 group-hover:scale-105">
            <Layers className="h-10 w-10 text-[#EC4899]" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-2">
          {variant === 'library' && (
            <>
              {deck.isPublic ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] px-2.5 py-1 text-xs font-semibold text-[#059669] shadow-sm">
                  <Globe className="h-3 w-3" />
                  Công khai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#F1F5F9] to-[#E2E8F0] px-2.5 py-1 text-xs font-semibold text-[#64748B] shadow-sm">
                  <Lock className="h-3 w-3" />
                  Riêng tư
                </span>
              )}
            </>
          )}
          {variant === 'explore' && isOwn && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] px-2.5 py-1 text-xs font-semibold text-[#D97706] shadow-sm">
              Của bạn
            </span>
          )}
          {deck.topics.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: t.colorHex ? `${t.colorHex}22` : 'var(--color-secondary-subtle)',
                color: t.colorHex ?? 'var(--color-secondary)',
              }}
            >
              {t.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[#EC4899]">
          {deck.title}
        </h3>

        {/* Owner info (explore only) */}
        {variant === 'explore' && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899]/20 to-[#F472B6]/20">
              <User className="h-3 w-3 text-[#EC4899]" />
            </div>
            {deck.ownerUsername}
          </p>
        )}

        {/* Description */}
        {deck.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-[var(--color-text-muted)]">
            {deck.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1 font-medium">
            <Layers className="h-3.5 w-3.5" />
            {deck.cardCount} thẻ
          </span>
          {variant === 'explore' && (
            <>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {deck.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5" />
                {deck.copyCount}
              </span>
            </>
          )}
          {variant === 'library' && deck.isPublic && (
            <span className="text-[#EC4899]">Hiển thị trên Khám phá</span>
          )}
        </div>
      </Link>

      {/* Source deck link */}
      {variant === 'library' && deck.sourceDeckId && deck.sourceDeckTitle && sourceRef && (
        <Link
          to={`/decks/${sourceRef}`}
          className="group/sourse flex items-center gap-2 border-t border-[#E2E5EC] px-5 py-3 text-xs text-[var(--color-text-muted)] transition-all hover:bg-[#FDF2F8] hover:text-[#EC4899]"
        >
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1 flex-1">
            Copy từ {deck.sourceDeckTitle}
            {deck.sourceOwnerUsername ? ` · ${deck.sourceOwnerUsername}` : ''}
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/sourse:translate-x-1" />
        </Link>
      )}
    </article>
  )
}
