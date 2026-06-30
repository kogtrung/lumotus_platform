import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import type { Question } from '@/types/study'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import QuizTimer from './QuizTimer'

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
  const isFirst = questionIndex === 0

  const handlePrev = () => {
    if (questionIndex > 0) onNavigate(questionIndex - 1)
  }

  const handleNext = () => {
    if (questionIndex < total - 1) onNavigate(questionIndex + 1)
  }

  const handleSkip = () => {
    if (selected) onSelect('__SKIP__')
    handleNext()
  }

  const handleSelect = (answer: string) => {
    if (answer === '__SKIP__') return
    onSelect(answer)
    if (!isLast) setTimeout(() => onNavigate(questionIndex + 1), 300)
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 lg:flex-row">
      {/* LEFT SIDEBAR - horizontal on mobile, vertical on desktop */}
      <div className="flex flex-row gap-2 overflow-x-auto pb-2 lg:order-none lg:h-auto lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
        {/* Timer */}
        {timeRemaining !== null && (
          <div className="w-full shrink-0 rounded-xl border border-[#3D3348] bg-[#252030] p-3 lg:w-auto">
            <QuizTimer seconds={timeRemaining} />
          </div>
        )}

        {/* Progress */}
        <div className="min-w-0 flex-1 rounded-xl border border-[#3D3348] bg-[#252030] p-3 lg:min-w-0 lg:flex-1">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#8B7A9E]">Đã trả lời</span>
            <span className="font-bold text-[#F5F0FA]">{answeredCount} / {total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#3D3348]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] transition-all"
              style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Navigator - scrollable on mobile */}
        <div className="min-w-0 flex-[2] overflow-x-auto rounded-xl border border-[#3D3348] bg-[#252030] p-3 lg:min-w-0 lg:flex-1 lg:overflow-y-auto">
          <div className="mb-2 text-nowrap text-xs font-semibold text-[#8B7A9E]">
            Câu hỏi
          </div>
          <div className="flex flex-wrap gap-1 lg:grid lg:grid-cols-5 lg:gap-1">
            {questions.map((q, idx) => {
              const isAnswered = answeredSet.has(idx)
              const isCurrent = idx === questionIndex
              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => onNavigate(idx)}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-all',
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

        {/* Nav buttons */}
        <div className="flex gap-2 lg:flex-col">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={isFirst}
            className="flex-1 lg:flex-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={isLast}
            className="flex-1 lg:flex-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={!selected}
          className="hidden lg:flex w-full text-xs"
        >
          <SkipForward className="mr-1.5 h-3.5 w-3.5" />
          Bỏ qua
        </Button>

        <Button
          onClick={onSubmit}
          disabled={submitPending || answeredCount === 0}
          size="sm"
          className="w-full lg:w-auto"
        >
          {submitPending ? 'Đang nộp...' : 'Nộp bài'}
        </Button>
      </div>

      {/* RIGHT: Question Content */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="rounded-xl border border-[#3D3348] bg-[#252030] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B7A9E]">
              Câu {questionIndex + 1}
            </span>
            <span className="text-xs text-[#8B7A9E]">
              {currentQ.options?.length ?? 0} đáp án
            </span>
          </div>

          {currentQ.imageUrl && (
            <img
              src={currentQ.imageUrl}
              alt=""
              className="mx-auto mb-3 max-h-32 w-auto rounded-lg object-contain"
            />
          )}

          <div className="mb-4 text-center">
            <p className="text-lg font-extrabold text-[#F5F0FA] sm:text-xl md:text-2xl">
              {currentQ.front}
            </p>
            {currentQ.phonetic && (
              <p className="mt-1 text-sm italic text-[#EC4899]">{currentQ.phonetic}</p>
            )}
          </div>

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
                    'flex w-full items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all sm:gap-3 sm:p-3',
                    isExpired && 'opacity-50 cursor-not-allowed',
                    isSelected
                      ? 'border-[#EC4899] bg-[rgba(236,72,153,0.15)]'
                      : 'border-[#3D3348] bg-[#1D1A24] hover:border-[#4A4060] hover:bg-[#2D2538]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold sm:h-7 sm:w-7',
                      isSelected ? 'bg-[#EC4899] text-white' : 'bg-[#3D3348] text-[#8B7A9E]',
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-sm font-bold text-[#F5F0FA] sm:text-base">
                    {option}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Mobile action buttons */}
          <div className="mt-4 flex gap-2 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={!selected}
              className="flex-1"
            >
              <SkipForward className="mr-1.5 h-3.5 w-3.5" />
              Bỏ qua
            </Button>
            <Button
              onClick={onSubmit}
              disabled={submitPending || answeredCount === 0}
              size="sm"
              className="flex-1"
            >
              {submitPending ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
