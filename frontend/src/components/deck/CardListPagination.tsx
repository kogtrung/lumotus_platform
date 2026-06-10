import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CardListPaginationProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export default function CardListPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  loading,
}: CardListPaginationProps) {
  if (totalElements === 0) return null

  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-[var(--color-text-muted)]">
        {from}–{to} / {totalElements} thẻ
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 0 || loading}
          onClick={() => onPageChange(page - 1)}
          className={navBtnClass}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-[5rem] text-center text-[var(--color-text-secondary)]">
          {page + 1} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page + 1 >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className={navBtnClass}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const navBtnClass = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)]',
  'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]',
  'disabled:pointer-events-none disabled:opacity-40',
)
