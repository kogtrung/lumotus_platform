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
    <article className="lumo-card lumo-card-hover group relative flex min-h-[168px] flex-col p-4">
      {card.icon && (
        <span className="absolute right-3 top-3 text-xl" title="icon">
          {card.icon}
        </span>
      )}

      {card.imageUrl && (
        <img
          src={card.imageUrl}
          alt=""
          className="mb-3 h-20 w-full rounded-lg object-cover"
        />
      )}

      <div className="min-w-0 flex-1 pr-6">
        <p className="flashcard-front line-clamp-2 text-base font-semibold leading-snug text-[var(--color-text)]">
          {card.front}
        </p>
        {card.phonetic && (
          <p className="mt-1 line-clamp-1 text-sm italic text-[var(--color-text-muted)]">
            {card.phonetic}
          </p>
        )}
        <div className="my-2 h-px bg-[var(--color-border)]" />
        <p className="flashcard-back line-clamp-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {card.back}
        </p>
        {card.example && (
          <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-muted)]">
            &ldquo;{card.example}&rdquo;
          </p>
        )}
      </div>

      {isOwner && (
        <div
          className={cn(
            'mt-3 flex justify-end gap-1 border-t border-[var(--color-border)] pt-2',
            'opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={onEdit}
            className={actionBtnClass}
            aria-label="Sửa thẻ"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-xs">Sửa</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(actionBtnClass, 'text-[var(--color-danger)] hover:bg-red-50')}
            aria-label="Xóa thẻ"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-xs">Xóa</span>
          </button>
        </div>
      )}
    </article>
  )
}

const actionBtnClass =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
