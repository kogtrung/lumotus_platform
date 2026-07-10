import { RotateCcw, Clock, Check, Zap } from 'lucide-react'
import type { ReviewRating } from '@/types/review'
import { cn } from '@/utils/cn'

const ratings: {
  value: ReviewRating
  label: string
  hint: string
  shortcut: string
  icon: typeof Check
  variant: 'again' | 'hard' | 'good' | 'easy'
}[] = [
  {
    value: 'AGAIN',
    label: 'Again',
    hint: 'Quên',
    shortcut: '1',
    icon: RotateCcw,
    variant: 'again',
  },
  {
    value: 'HARD',
    label: 'Hard',
    hint: 'Khó',
    shortcut: '2',
    icon: Clock,
    variant: 'hard',
  },
  {
    value: 'GOOD',
    label: 'Good',
    hint: 'Nhớ',
    shortcut: '3',
    icon: Check,
    variant: 'good',
  },
  {
    value: 'EASY',
    label: 'Easy',
    hint: 'Quá dễ',
    shortcut: '4',
    icon: Zap,
    variant: 'easy',
  },
]

interface RatingButtonGroupProps {
  onRate: (rating: ReviewRating) => void
  flipped?: boolean
  disabled?: boolean
}

export default function RatingButtonGroup({ onRate, flipped, disabled }: RatingButtonGroupProps) {
  return (
    <div
      className={cn(
        'mt-3 grid w-full grid-cols-4 gap-2 transition-opacity duration-300',
        flipped ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {ratings.map(({ value, label, hint, shortcut, icon: Icon, variant }) => (
        <button
          key={value}
          type="button"
          disabled={disabled || !flipped}
          onClick={() => onRate(value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Color variants matching the flashcard rating colors
            variant === 'again' && 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20',
            variant === 'hard'  && 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
            variant === 'good'  && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
            variant === 'easy'  && 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
          )}
          aria-label={`${label} — ${hint}`}
        >
          <div className="flex w-full items-center justify-between gap-1">
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            <kbd className="rounded border border-current/30 bg-white/10 px-1 font-mono text-[10px] font-bold opacity-70">
              {shortcut}
            </kbd>
          </div>
          <div className="flex w-full flex-col items-center">
            <span className="text-sm font-extrabold leading-tight">{label}</span>
            <span className="text-[10px] font-medium uppercase leading-tight opacity-75">
              {hint}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
