import { RotateCcw, Check, Clock, Zap } from 'lucide-react'
import type { ReviewRating } from '@/types/review'
import { cn } from '@/utils/cn'

const ratings: {
  value: ReviewRating
  label: string
  hint: string
  icon: typeof Check
  variant: 'again' | 'hard' | 'good' | 'easy'
}[] = [
  { value: 'AGAIN', label: 'Again', hint: 'Quên', icon: RotateCcw, variant: 'again' },
  { value: 'HARD', label: 'Hard', hint: 'Khó', icon: Clock, variant: 'hard' },
  { value: 'GOOD', label: 'Good', hint: 'Đúng', icon: Check, variant: 'good' },
  { value: 'EASY', label: 'Easy', hint: 'Dễ', icon: Zap, variant: 'easy' },
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
        'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4',
        inactive && 'pointer-events-none opacity-45',
      )}
    >
      {ratings.map(({ value, label, hint, icon: Icon, variant }) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onRate(value)}
          className={cn('review-rate-btn', `review-rate-btn--${variant}`)}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          <span className="text-base font-bold leading-none">{label}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{hint}</span>
        </button>
      ))}
    </div>
  )
}
