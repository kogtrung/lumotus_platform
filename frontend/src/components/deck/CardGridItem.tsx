import { Pencil, Trash2 } from 'lucide-react'
import type { Card } from '@/types/deck'
import { cn } from '@/utils/cn'

interface CardGridItemProps {
  card: Card
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function CardGridItem({ card, isOwner, onEdit, onDelete }: CardGridItemProps) {
  return (
    <article className="lumo-card lumo-card-hover group relative p-2">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="flashcard-front line-clamp-1 text-xs font-semibold leading-tight text-[var(--color-text)]">
              {card.front}
            </p>
            {card.icon && (
              <span className="shrink-0 text-sm leading-none" title="icon">
                {card.icon}
              </span>
            )}
          </div>
          {card.phonetic && (
            <p className="mt-0.5 line-clamp-1 text-[10px] italic leading-tight text-[var(--color-text-muted)]">
              {card.phonetic}
            </p>
          )}
        </div>
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded object-cover"
          />
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--color-text-secondary)]">
        {card.back}
      </p>

      {card.example && (
        <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-[var(--color-text-muted)]">
          &ldquo;{card.example}&rdquo;
        </p>
      )}

      {isOwner && (
        <div
          className={cn(
            'mt-1 flex justify-end gap-0.5 border-t border-[var(--color-border)] pt-1',
            'opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={onEdit}
            className={actionBtnClass}
            aria-label="Sửa thẻ"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(actionBtnClass, 'text-[var(--color-danger)] hover:bg-red-50')}
            aria-label="Xóa thẻ"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </article>
  )
}

const actionBtnClass =
  'rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
