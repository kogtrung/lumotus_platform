import { RotateCcw, Clock, Check, Zap } from 'lucide-react'
import type { ReviewRating } from '@/types/review'
import { cn } from '@/utils/cn'

const ratings: {
  value: ReviewRating
  label: string
  hint: string
  preview: string
  shortcut: string
  icon: typeof Check
  variant: 'again' | 'hard' | 'good' | 'easy'
}[] = [
  { value: 'AGAIN', label: 'Lại', hint: 'Quên', preview: '<1 ngày', shortcut: '1', icon: RotateCcw, variant: 'again' },
  { value: 'HARD', label: 'Khó', hint: 'Nhớ lờ', preview: '~3 ngày', shortcut: '2', icon: Clock, variant: 'hard' },
  { value: 'GOOD', label: 'Đúng', hint: 'Nhớ được', preview: '~7 ngày', shortcut: '3', icon: Check, variant: 'good' },
  { value: 'EASY', label: 'Dễ', hint: 'Rất tốt', preview: '~14 ngày', shortcut: '4', icon: Zap, variant: 'easy' },
]

interface RatingButtonGroupProps {
  onRate: (rating: ReviewRating) => void
  disabled?: boolean
  inactive?: boolean
}

export default function RatingButtonGroup({ onRate, disabled, inactive }: RatingButtonGroupProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3',
        inactive && 'pointer-events-none opacity-40',
      )}
    >
      {ratings.map(({ value, label, hint, preview, shortcut, icon: Icon, variant }) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onRate(value)}
          className={cn('review-rate-btn', `review-rate-btn--${variant}`)}
          aria-label={`${label} - ${hint}`}
        >
          <div className="flex w-full items-center justify-between gap-1">
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            <kbd className="hidden rounded border border-current/30 bg-white/30 px-1 font-mono text-[10px] font-bold opacity-70 sm:inline-block">
              {shortcut}
            </kbd>
          </div>
          <div className="flex w-full flex-col items-center">
            <span className="text-sm font-extrabold leading-tight sm:text-base">{label}</span>
            <span className="text-[10px] font-medium uppercase leading-tight opacity-75">
              {hint}
            </span>
            <span className="review-rate-preview mt-1 text-[10px] font-bold">
              {preview}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}