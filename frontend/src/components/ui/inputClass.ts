import { cn } from '@/utils/cn'

export function inputClass(hasError?: boolean) {
  return cn(
    'w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors',
    'placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]',
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
  )
}
