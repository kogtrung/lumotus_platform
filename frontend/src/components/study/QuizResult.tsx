import { Link } from 'react-router-dom'
import { Check, X, RotateCcw, Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Question } from '@/types/study'
import { cn } from '@/utils/cn'

interface QuizResultProps {
  deckRef: string
  correct: number
  total: number
  questions: Question[]
  answers: Record<string, string>
  onRestart: () => void
}

export function QuizResult({ deckRef, correct, total, questions, answers, onRestart }: QuizResultProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const isPass = pct >= 70
  const wrongCount = total - correct

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-4 py-4">
      {/* Score Header */}
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className={cn(
          'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full shadow-lg',
          isPass ? 'bg-[rgba(16,185,129,0.2)]' : 'bg-[rgba(239,68,68,0.2)]'
        )}>
          {isPass ? (
            <Check className="h-10 w-10 text-[#10B981]" strokeWidth={3} />
          ) : (
            <X className="h-10 w-10 text-[#EF4444]" strokeWidth={3} />
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-[#F5F0FA]">
          {isPass ? 'Great job!' : 'Keep practicing!'}
        </h2>
        <p className="mt-2 text-lg text-[#8B7A9E]">
          <span className={cn('font-extrabold', isPass ? 'text-[#10B981]' : 'text-[#EF4444]')}>{correct}</span>
          <span> / {total} correct</span>
        </p>
        <p className={cn('mt-1 text-3xl font-extrabold', isPass ? 'text-[#10B981]' : 'text-[#EF4444]')}>
          {pct}%
        </p>
        {wrongCount > 0 && (
          <p className="mt-2 text-sm text-[#8B7A9E]">
            {wrongCount} question{wrongCount > 1 ? 's' : ''} to review
          </p>
        )}
      </div>

      {/* Questions Grid */}
      <div className="w-full">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#8B7A9E]">
          Question Review
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {questions.map((q, idx) => {
            const userAnswer = answers[q.questionId]
            const isCorrect = userAnswer === q.correctAnswer

            return (
              <div
                key={q.questionId}
                className={cn(
                  'flex flex-col rounded-xl border-2 p-3',
                  isCorrect
                    ? 'border-[#10B981] bg-[rgba(16,185,129,0.1)]'
                    : 'border-[#EF4444] bg-[rgba(239,68,68,0.1)]'
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8B7A9E]">#{idx + 1}</span>
                  <div className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full',
                    isCorrect ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                  )}>
                    {isCorrect ? (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    ) : (
                      <X className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <p className="mb-1 text-sm font-bold text-[#F5F0FA] line-clamp-2">{q.front}</p>
                <p className={cn(
                  'mt-auto text-xs',
                  isCorrect ? 'text-[#10B981]' : 'text-[#EF4444]'
                )}>
                  {isCorrect ? (
                    <span className="font-semibold">{userAnswer}</span>
                  ) : (
                    <>
                      <span className="line-through opacity-60">{userAnswer || '(skipped)'}</span>
                      <span className="mx-1 opacity-40">→</span>
                      <span className="font-semibold">{q.correctAnswer}</span>
                    </>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <div className="flex gap-2">
          <Button onClick={onRestart} size="lg" className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Study Again
          </Button>
          <Button to="/" variant="outline" size="lg" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
        <Button to={`/decks/${deckRef}`} variant="ghost" size="sm" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deck
        </Button>
      </div>
    </div>
  )
}
