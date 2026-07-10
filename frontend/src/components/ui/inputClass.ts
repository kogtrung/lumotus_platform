import { cn } from '@/utils/cn'

export function inputClass(hasError?: boolean) {
  return cn(
    'w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors',
    'placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]',
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
  )
}

export function inputClassLight(hasError?: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white outline-none transition-colors',
    'placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10',
    hasError ? 'border-red-500' : 'border-gray-200 focus:border-pink-500',
  )
}

export function searchInputClass(className?: string) {
  return cn('lumo-search', className)
}
