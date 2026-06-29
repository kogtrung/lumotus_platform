import { useState, useEffect } from 'react'
import { Check, X, ChevronLeft, ChevronRight, Timer, Volume2 } from 'lucide-react'
import type { Question } from '@/types/study'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import CardAudioButton from '@/components/review/CardAudioButton'

interface SpellViewProps {
  questions: Question[]
  questionIndex: number
  answers: Record<string, string>
  onSelect: (qid: string, answer: string) => void
  onNavigate: (idx: number) => void
  onSubmit: () => void
  submitPending: boolean
  timeRemaining: number | null
  /** Callback fired after answering */
  onAnswered?: () => void
}

export default function SpellView({
  questions,
  questionIndex,
  answers,
  onSelect,
  onNavigate,
  onSubmit,
  submitPending,
  timeRemaining,
  onAnswered,
}: SpellViewProps) {
  const currentQ = questions[questionIndex]
  const total = questions.length
  const isLast = questionIndex === total - 1
  const userAnswer = answers[currentQ.questionId]
  const isSubmitted = !!userAnswer

  const [input, setInput] = useState('')

  useEffect(() => {
    setInput('')
  }, [currentQ.questionId])

  const handleCheck = () => {
    if (input.trim() && !isSubmitted) {
      onSelect(currentQ.questionId, input.trim())
      onAnswered?.()
      // Auto advance to next question
      if (!isLast) {
        setTimeout(() => onNavigate(questionIndex + 1), 800)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && !isSubmitted) {
      handleCheck()
    }
  }

  const isPartiallyCorrect = userAnswer?.toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()
  const answeredCount = Object.keys(answers).length

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
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigator */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[#3D3348] bg-[#252030] p-3">
          <div className="mb-2 text-xs font-semibold text-[#8B7A9E]">Questions</div>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === questionIndex
              const hasAnswer = !!answers[q.questionId]

              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => onNavigate(idx)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all',
                    isCurrent
                      ? 'bg-[#EC4899] text-white ring-1 ring-[#EC4899]'
                      : hasAnswer
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
            onClick={() => onNavigate(questionIndex - 1)}
            disabled={questionIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(questionIndex + 1)}
            disabled={isLast}
            className="flex-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Submit */}
        <Button
          onClick={onSubmit}
          disabled={submitPending || answeredCount === 0}
          size="sm"
          className="w-full"
        >
          {submitPending ? 'Submitting...' : 'Submit'}
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
            {isSubmitted && (
              <span className={cn(
                'text-xs font-bold',
                isPartiallyCorrect ? 'text-[#10B981]' : 'text-[#EF4444]'
              )}>
                {isPartiallyCorrect ? 'Correct' : 'Incorrect'}
              </span>
            )}
          </div>

          {/* Audio + hint */}
          <div className="mb-3 flex flex-col items-center gap-2">
            <CardAudioButton audioUrl={currentQ.audioUrl} size="lg" />
            {currentQ.phonetic && (
              <p className="text-sm italic text-[#EC4899]">{currentQ.phonetic}</p>
            )}
            {currentQ.hint && !isSubmitted && (
              <p className="text-xs text-[#8B7A9E]">Hint: {currentQ.hint}</p>
            )}
          </div>

          {/* What to spell */}
          <div className="mb-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7A9E]">
              Listen and spell
            </p>
          </div>

          {/* Input or Feedback */}
          <div className="mt-2">
            {!isSubmitted ? (
              <div className={cn(
                'flex items-center gap-3 rounded-xl border-2 bg-[#1D1A24] p-3 transition-all',
                'border-[#3D3348] focus-within:border-[#EC4899] focus-within:shadow-[0_0_0_3px_rgba(236,72,153,0.15)]',
              )}>
                <Volume2 className="h-4 w-4 shrink-0 text-[#8B7A9E]" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type what you hear..."
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent text-lg font-bold uppercase tracking-wider text-[#F5F0FA] placeholder-[#8B7A9E] outline-none sm:text-xl"
                />
                <button
                  type="button"
                  disabled={!input.trim()}
                  onClick={handleCheck}
                  className="rounded-xl bg-[#EC4899] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#DB2777] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check
                </button>
              </div>
            ) : (
              <div className={cn(
                'flex flex-col gap-3 rounded-xl border-2 p-4',
                isPartiallyCorrect
                  ? 'border-[#10B981] bg-[rgba(16,185,129,0.15)]'
                  : 'border-[#EF4444] bg-[rgba(239,68,68,0.15)]',
              )}>
                <div className="flex items-center gap-3">
                  {isPartiallyCorrect
                    ? <Check className="h-5 w-5 text-[#10B981]" strokeWidth={3} />
                    : <X className="h-5 w-5 text-[#EF4444]" strokeWidth={3} />}
                  <span className={cn('text-base font-bold', isPartiallyCorrect ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                    {isPartiallyCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {!isPartiallyCorrect && (
                  <div className="text-sm">
                    <span className="text-[#8B7A9E]">Correct spelling: </span>
                    <span className="font-bold uppercase tracking-wider text-[#F5F0FA]">{currentQ.correctAnswer}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
