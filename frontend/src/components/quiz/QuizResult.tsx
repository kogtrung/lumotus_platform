import { useMemo, useState } from 'react'
import { Check, X, Zap, Clock, Target, Timer } from 'lucide-react'
import { cn } from '@/utils/cn'

type FilterTab = 'all' | 'correct' | 'wrong' | 'skipped'

interface QuizResultDetail {
  questionId: string
  questionText: string
  correctAnswer: string  // Format: "A. going" or "going"
  selectedAnswer: string | null  // Format: "A. going" or "(bỏ qua)"
  correct: boolean
  options?: string[]  // Original options for reference
  selectedLetter?: string | null  // Just the letter A/B/C/D
}

interface QuizResultProps {
  deckRef: string
  quizId?: string | null
  quizSlug?: string | null
  totalQuestions?: number
  timeLimitSeconds?: number | null
  correct: number
  total: number
  xpEarned: number
  quizTitle: string
  startedAt: string
  finishedAt: string
  details: QuizResultDetail[]
  onRestart: () => void
  score?: number  // Decimal score from backend (e.g., 0.85)
}

function QuestionCard({ d, idx }: { d: QuizResultDetail; idx: number }) {
  const status: 'correct' | 'wrong' | 'skipped' = d.correct ? 'correct' : d.selectedAnswer && d.selectedAnswer !== '(bỏ qua)' ? 'wrong' : 'skipped'

  // Display answer - backend returns with format "C. washes" or "(bỏ qua)"
  const displayAnswer = (answer: string | null) => {
    if (!answer || answer === '(bỏ qua)') return '(Không chọn)'
    return answer
  }

  // Extract letter from answer string like "A. going" -> "A"
  const getLetter = (answer: string | null) => {
    if (!answer || answer === '(bỏ qua)') return '—'
    const match = answer.match(/^([A-D])\./)
    return match ? match[1] : '—'
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border overflow-hidden',
        status === 'correct' && 'border-emerald-500/40 bg-emerald-500/5',
        status === 'wrong' && 'border-red-500/40 bg-red-500/5',
        status === 'skipped' && 'border-[#8B7A9E]/30 bg-[#8B7A9E]/3'
      )}
    >
      {/* Card header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b shrink-0',
        status === 'correct' && 'border-emerald-500/20',
        status === 'wrong' && 'border-red-500/20',
        status === 'skipped' && 'border-[#8B7A9E]/20'
      )}>
        <div className="flex items-center gap-2">
          <span className={cn(
            'flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold',
            status === 'correct' && 'bg-emerald-500/25 text-emerald-400',
            status === 'wrong' && 'bg-red-500/25 text-red-400',
            status === 'skipped' && 'bg-[var(--color-bg)]/20 text-[var(--color-text-muted)]'
          )}>
            {idx + 1}
          </span>
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Câu {idx + 1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'correct' && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> Đúng
            </span>
          )}
          {status === 'wrong' && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
              <X className="h-3.5 w-3.5" strokeWidth={3} /> Sai
            </span>
          )}
          {status === 'skipped' && (
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">Bỏ qua</span>
          )}
        </div>
      </div>

      {/* Question text */}
      <div className="px-3 pt-2.5 pb-2 shrink-0">
        <p className="text-xs font-semibold leading-snug text-[var(--color-text)] line-clamp-2">{d.questionText || ''}</p>
      </div>

      {/* Answer rows */}
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {/* Selected answer */}
        <div className={cn(
          'flex items-start gap-2 rounded-xl border px-2.5 py-2',
          status === 'correct' && 'border-emerald-500/50 bg-emerald-500/10',
          status === 'wrong' && 'border-red-500/50 bg-red-500/10',
          status === 'skipped' && 'border-[#3D3348]/40 bg-[#3D3348]/15'
        )}>
          <span className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
            status === 'correct' && 'bg-emerald-500/20 text-[var(--color-success)]',
            status === 'wrong' && 'bg-red-500/20 text-[var(--color-danger)]',
            status === 'skipped' && 'bg-[var(--color-bg)]/20 text-[var(--color-text-muted)]'
          )}>
            {getLetter(d.selectedAnswer)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">Đáp án của bạn</p>
            <p className={cn(
              'mt-0.5 text-xs leading-snug',
              status === 'correct' && 'font-semibold text-[var(--color-success)]',
              status === 'wrong' && 'text-[var(--color-danger)]',
              status === 'skipped' && 'italic text-[var(--color-text-muted)]'
            )}>
              {displayAnswer(d.selectedAnswer)}
            </p>
          </div>
          {status === 'correct' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={3} />}
          {status === 'wrong' && <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={3} />}
        </div>

        {/* Correct answer (only show if wrong or skipped) */}
        {status !== 'correct' && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
              {getLetter(d.correctAnswer)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">Đáp án đúng</p>
              <p className="mt-0.5 text-xs font-semibold leading-snug text-[var(--color-success)]">
                {d.correctAnswer}
              </p>
            </div>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={3} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuizResult({
  deckRef: _deckRef,
  correct: _correct,
  total,
  xpEarned,
  quizTitle,
  startedAt,
  finishedAt,
  details,
  onRestart: _onRestart,
  totalQuestions,
  timeLimitSeconds,
  score,
}: QuizResultProps) {
  const [filter, setFilter] = useState<FilterTab>('all')

  const correctCount = details.filter((d) => d.correct).length
  const wrong = details.filter((d) => d.selectedAnswer && d.selectedAnswer !== '(bỏ qua)' && !d.correct).length
  const skipped = details.filter((d) => !d.selectedAnswer || d.selectedAnswer === '(bỏ qua)').length
  const pct = correctCount > 0 ? Math.round((correctCount / total) * 100) : 0
  const isPass = pct >= 70
  const answeredCount = details.filter((d) => d.selectedAnswer).length
  const displayScore = score != null ? (score * 10).toFixed(1) : pct.toString()

  const fmtDuration = (iso1?: string, iso2?: string) => {
    if (!iso1 || !iso2) return '—'
    const s = Math.round((new Date(iso2).getTime() - new Date(iso1).getTime()) / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  // Filter details based on selected tab
  const filteredDetails = useMemo(() => {
    switch (filter) {
      case 'correct':
        return details.filter((d) => d.correct)
      case 'wrong':
        return details.filter((d) => !d.correct && d.selectedAnswer && d.selectedAnswer !== '(bỏ qua)')
      case 'skipped':
        return details.filter((d) => !d.selectedAnswer || d.selectedAnswer === '(bỏ qua)')
      default:
        return details
    }
  }, [filter, details])

  // Split into 2 columns
  const leftColumn = useMemo(() => filteredDetails.filter((_, i) => i % 2 === 0), [filteredDetails])
  const rightColumn = useMemo(() => filteredDetails.filter((_, i) => i % 2 === 1), [filteredDetails])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-none border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Quiz info */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-[var(--color-text)]">{quizTitle}</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />{totalQuestions ?? total} câu
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-[var(--color-success)]" />
                <span className="text-[var(--color-success)]">{answeredCount}</span>
                <span className="text-[var(--color-text-muted)]">/{total} đã làm</span>
              </span>
              {timeLimitSeconds != null && timeLimitSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />{Math.round(timeLimitSeconds / 60)}p
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{fmtDuration(startedAt, finishedAt)}
              </span>
            </div>
          </div>

          {/* Center: Score */}
          <div className={cn(
            'flex items-center gap-3 rounded-2xl border px-5 py-2',
            isPass ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
          )}>
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isPass ? 'bg-emerald-500/20' : 'bg-red-500/20'
            )}>
              {isPass
                ? <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
                : <X className="h-5 w-5 text-red-400" strokeWidth={3} />
              }
            </div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: isPass ? '#10B981' : '#EF4444' }}>
                {displayScore}
              </p>
              <p className="text-[10px] text-[#8B7A9E]">
                {isPass ? 'Đạt ·' : 'Chưa đạt ·'} {correctCount}/{total} đúng
              </p>
            </div>
          </div>

          {/* Right: Stats + XP + Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                <span className="text-sm font-extrabold text-emerald-400">{correctCount}</span>
                <span className="text-[10px] text-emerald-400/60">đúng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X className="h-3.5 w-3.5 text-red-400" strokeWidth={3} />
                <span className="text-sm font-extrabold text-red-400">{wrong}</span>
                <span className="text-[10px] text-red-400/60">sai</span>
              </div>
              {skipped > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-[var(--color-text-muted)]">—</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]/60">bỏ {skipped}</span>
                </div>
              )}
            </div>

            {/* XP Badge */}
            {xpEarned > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/15 px-3 py-1.5">
                <Zap className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="text-base font-extrabold text-[var(--color-primary)]">+{xpEarned}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex-none border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2">
        <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface)] p-1 w-fit">
          {([
            { key: 'all', label: 'Tất cả', count: details.length, color: 'none' },
            { key: 'correct', label: 'Đúng', count: correctCount, color: 'emerald' },
            { key: 'wrong', label: 'Sai', count: wrong, color: 'red' },
            { key: 'skipped', label: 'Bỏ qua', count: skipped, color: 'gray' },
          ] as const).map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                filter === key
                  ? color === 'emerald' ? 'bg-emerald-500/20 text-[var(--color-success)]'
                  : color === 'red' ? 'bg-red-500/20 text-[var(--color-danger)]'
                  : color === 'gray' ? 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {label}
              <span className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold',
                filter === key
                  ? color === 'emerald' ? 'bg-emerald-500/30'
                  : color === 'red' ? 'bg-red-500/30'
                  : 'bg-[var(--color-surface)]'
                  : 'bg-[var(--color-bg)]'
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Question grid - 2 columns, scrollable */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex w-full gap-3 p-4">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-3">
            {leftColumn.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-[var(--color-text-muted)]">
                  {filter === 'all' ? 'Không có câu hỏi' :
                    filter === 'correct' ? 'Không có câu đúng' :
                    filter === 'wrong' ? 'Không có câu sai' :
                    'Không có câu bỏ qua'}
                </p>
              </div>
            ) : leftColumn.map((d, localIdx) => (
              <QuestionCard key={d.questionId ?? localIdx} d={d} idx={localIdx * 2} />
            ))}
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0 space-y-3">
            {rightColumn.map((d, localIdx) => (
              <QuestionCard key={d.questionId ?? localIdx} d={d} idx={localIdx * 2 + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
