import { Timer } from 'lucide-react'
import { cn } from '@/utils/cn'

interface QuizTimerProps {
  seconds: number
  /** If true, shows "Câu X" label and resets when seconds changes from max to new value */
  perQuestion?: boolean
  questionIndex?: number
}

export default function QuizTimer({ seconds, perQuestion = false, questionIndex }: QuizTimerProps) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const color =
    seconds <= 5 ? 'text-[#EF4444]' :
    seconds <= 10 ? 'text-[#F59E0B]' :
    'text-[#10B981]'

  return (
    <div className="flex items-center gap-2">
      <Timer className={cn('h-5 w-5', color)} />
      <div className="flex flex-col">
        {perQuestion && questionIndex !== undefined && (
          <span className="text-[10px] font-semibold text-[#8B7A9E]">
            Câu {questionIndex + 1}
          </span>
        )}
        <span className={cn('text-2xl font-extrabold tabular-nums', color)}>
          {m}:{s.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
