import { ChevronLeft, ChevronRight, Timer, SkipForward } from 'lucide-react'
import type { Question } from '@/types/study'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'

interface QuizViewProps {
  questions: Question[]
  questionIndex: number
  selected: string | null
  answeredSet: Set<number>
  onSelect: (answer: string) => void
  onNavigate: (index: number) => void
  onSubmit: () => void
  submitPending: boolean
  timeRemaining: number | null
  isExpired?: boolean
}

export default function QuizView({
  questions,
  questionIndex,
  selected,
  answeredSet,
  onSelect,
  onNavigate,
  onSubmit,
  submitPending,
  timeRemaining,
  isExpired = false,
}: QuizViewProps) {
  const total = questions.length
  const currentQ = questions[questionIndex]
  const answeredCount = answeredSet.size
  const isLast = questionIndex === total - 1

  const handlePrev = () => {
    if (questionIndex > 0) onNavigate(questionIndex - 1)
  }

  const handleNext = () => {
    if (questionIndex < total - 1) onNavigate(questionIndex + 1)
  }

  const handleSkip = () => {
    if (selected) {
      onSelect('__SKIP__')
    }
    handleNext()
  }

  const handleSelect = (answer: string) => {
    if (answer === '__SKIP__') return
    onSelect(answer)
    // Auto advance to next question
    if (!isLast) {
      setTimeout(() => onNavigate(questionIndex + 1), 300)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeRemaining === null) return 'text-[#8B7A9E]'
    if (timeRemaining <= 30) return 'text-[#EF4444]'
    if (timeRemaining <= 60) return 'text-[#F59E0B]'
    return 'text-[#10B981]'
  }

  return (
    <div className="flex h-full w-full gap-3">
      {/* ── LEFT SIDEBAR: Info + Navigation ── */}
      <div className="flex w-52 shrink-0 flex-col gap-3">
        {/* Timer */}
        {timeRemaining !== null && (
          <div className="rounded-xl border border-[#3D3348] bg-[#252030] p-3">
            <div className="flex items-center justify-center gap-2">
              <Timer className={cn('h-4 w-4', getTimeColor())} />
              <span className={cn('text-xl font-extrabold tabular-nums', getTimeColor())}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        )}

        {/* Progress Info */}
        <div className="rounded-xl border border-[#3D3348] bg-[#252030] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#8B7A9E]">Answered</span>
            <span className="font-bold text-[#F5F0FA]">{answeredCount} / {total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#3D3348]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] transition-all"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigator */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[#3D3348] bg-[#252030] p-3">
          <div className="mb-2 text-xs font-semibold text-[#8B7A9E]">Questions</div>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((q, idx) => {
              const isAnswered = answeredSet.has(idx)
              const isCurrent = idx === questionIndex

              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => onNavigate(idx)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all',
                    isCurrent
                      ? 'bg-[#EC4899] text-white ring-1 ring-[#EC4899]'
                      : isAnswered
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#3D3348] text-[#8B7A9E] hover:bg-[#4A4060] hover:text-[#F5F0FA]',
                  )}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={questionIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={isLast}
            className="flex-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Skip Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={!selected}
          className="w-full text-xs"
        >
          <SkipForward className="mr-1.5 h-3.5 w-3.5" />
          Skip
        </Button>

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={submitPending || answeredCount === 0}
          size="sm"
          className="w-full"
        >
          {submitPending ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>

      {/* ── RIGHT: Question Content ── */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="rounded-xl border border-[#3D3348] bg-[#252030] p-5">
          {/* Question Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B7A9E]">
              Question {questionIndex + 1}
            </span>
            <span className="text-xs text-[#8B7A9E]">
              {currentQ.options?.length ?? 0} options
            </span>
          </div>

          {/* Image */}
          {currentQ.imageUrl && (
            <img
              src={currentQ.imageUrl}
              alt=""
              className="mx-auto mb-3 max-h-32 w-auto rounded-lg object-contain"
            />
          )}

          {/* Question Text */}
          <div className="mb-4 text-center">
            <p className="text-xl font-extrabold text-[#F5F0FA] sm:text-2xl">
              {currentQ.front}
            </p>
            {currentQ.phonetic && (
              <p className="mt-1 text-sm italic text-[#EC4899]">{currentQ.phonetic}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options?.map((option, idx) => {
              const isSelected = selected === option

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isExpired}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                    isExpired && 'opacity-50 cursor-not-allowed',
                    isSelected
                      ? 'border-[#EC4899] bg-[rgba(236,72,153,0.15)]'
                      : 'border-[#3D3348] bg-[#1D1A24] hover:border-[#4A4060] hover:bg-[#2D2538]',
                  )}
                >
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-extrabold',
                    isSelected
                      ? 'bg-[#EC4899] text-white'
                      : 'bg-[#3D3348] text-[#8B7A9E]',
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-sm font-bold text-[#F5F0FA]">{option}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
