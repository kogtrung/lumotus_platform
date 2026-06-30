import { Timer } from 'lucide-react'
import { cn } from '@/utils/cn'

interface QuizTimerProps {
  seconds: number
}

export default function QuizTimer({ seconds }: QuizTimerProps) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const color =
    seconds <= 30 ? 'text-[#EF4444]' :
    seconds <= 60 ? 'text-[#F59E0B]' :
    'text-[#10B981]'

  return (
    <div className="flex items-center gap-2">
      <Timer className={cn('h-5 w-5', color)} />
      <span className={cn('text-2xl font-extrabold tabular-nums', color)}>
        {m}:{s.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
