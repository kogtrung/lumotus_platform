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
  { value: 'HARD', label: 'Khó', hint: 'Vất vả', preview: '~3 ngày', shortcut: '2', icon: Clock, variant: 'hard' },
  { value: 'GOOD', label: 'Tốt', hint: 'Nhớ', preview: '~7 ngày', shortcut: '3', icon: Check, variant: 'good' },
  { value: 'EASY', label: 'Dễ', hint: 'Ngay', preview: '~14 ngày', shortcut: '4', icon: Zap, variant: 'easy' },
]

interface RatingButtonsProps {
  onRate: (rating: ReviewRating) => void
  flipped?: boolean
  disabled?: boolean
}

export default function RatingButtons({ onRate, flipped, disabled }: RatingButtonsProps) {
  return (
    <div
      className={cn(
        'grid w-full max-w-2xl grid-cols-4 gap-2 transition-opacity duration-300',
        flipped ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {ratings.map(({ value, label, hint, preview, shortcut, icon: Icon, variant }) => (
        <button
          key={value}
          type="button"
          disabled={disabled || !flipped}
          onClick={() => onRate(value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'again' && 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20',
            variant === 'hard' && 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
            variant === 'good' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
            variant === 'easy' && 'border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20',
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
            <span className="text-[10px] font-medium uppercase leading-tight opacity-75">{hint}</span>
            <span className="mt-1 text-[10px] font-bold opacity-70">{preview}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
