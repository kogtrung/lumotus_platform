import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  History, Trophy, Clock, Target, Zap, ChevronLeft, ChevronRight,
  CheckCircle, Timer, TrendingUp, Play,
} from 'lucide-react'
import { quizApi, QuizAttemptSummary } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export default function QuizHistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-history', page],
    queryFn: () => quizApi.getMyHistory({ page, size: 20 }).then((r) => r.data),
  })

  const attempts = (data?.content ?? []) as QuizAttemptSummary[]
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/quiz')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-subtle)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            <History className="h-3.5 w-3.5" strokeWidth={2.5} />
            Quiz
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text)]">Lịch sử làm quiz</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Xem lại kết quả các bài quiz đã làm
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Target}
            label="Tổng lượt"
            value={data?.totalElements ?? 0}
            color="#EC4899"
          />
          <StatCard
            icon={CheckCircle}
            label="Điểm TB"
            value={
              attempts.filter(a => a.score != null).length > 0
                ? (attempts
                    .filter(a => a.score != null)
                    .reduce((sum, a) => sum + (a.score ?? 0), 0) /
                    attempts.filter(a => a.score != null).length * 10
                  ).toFixed(1)
                : '—'
            }
            color="#10B981"
          />
          <StatCard
            icon={TrendingUp}
            label="Điểm cao nhất"
            value={
              attempts.filter(a => a.score != null).length > 0
                ? (Math.max(...attempts.filter(a => a.score != null).map(a => a.score ?? 0)) * 10).toFixed(1)
                : '—'
            }
            color="#F97316"
          />
          <StatCard
            icon={Zap}
            label="Tổng XP"
            value={attempts.reduce((sum, a) => sum + (a.xpEarned ?? 0), 0).toLocaleString()}
            color="#A78BFA"
          />
        </div>
      )}

      {/* History List */}
      {isLoading ? (
        <HistorySkeleton />
      ) : attempts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <AttemptCard
                key={attempt.attemptId}
                attempt={attempt}
                onViewResult={() => navigate(`/quiz/result/${attempt.attemptId}`)}
                onReplay={() => navigate(`/quiz/play/${attempt.quizSlug || attempt.quizId}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[var(--color-text-muted)]">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Target
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</span>
      </div>
      <p className="text-xl font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  )
}

function AttemptCard({
  attempt,
  onViewResult,
  onReplay,
}: {
  attempt: QuizAttemptSummary
  onViewResult: () => void
  onReplay: () => void
}) {
  const score = attempt.score != null ? (attempt.score * 10).toFixed(1) : null
  const scoreNum = score !== null ? parseFloat(score) : null
  const isPassing = scoreNum !== null && scoreNum >= 7

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm p-4 transition-all hover:border-[var(--color-border-strong)]">
      {/* Score indicator */}
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold',
        isPassing
          ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]'
          : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
      )}>
        {score !== null ? score : '?'}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
          {attempt.quizTitle || 'Quiz không tên'}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
          {attempt.correctAnswers !== null && attempt.totalQuestions !== null && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-[var(--color-success)]" />
              {attempt.correctAnswers}/{attempt.totalQuestions} đúng
            </span>
          )}
          {attempt.timeTakenSeconds !== null && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {formatTime(attempt.timeTakenSeconds)}
            </span>
          )}
          {attempt.xpEarned !== null && attempt.xpEarned > 0 && (
            <span className="flex items-center gap-1 font-semibold text-[#A78BFA]">
              <Zap className="h-3 w-3" />
              +{attempt.xpEarned} XP
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(attempt.startedAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col gap-2">
        <Button size="sm" variant="ghost" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] min-w-[80px]" onClick={onViewResult}>
          Xem lại
        </Button>
        <Button size="sm" className="min-w-[80px]" onClick={onReplay}>
          <Play className="mr-1 h-3 w-3" />
          Làm lại
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg)]">
        <History className="h-8 w-8 text-[var(--color-text-muted)]" />
      </div>
      <p className="font-bold text-[var(--color-text-muted)]">Chưa có lịch sử làm quiz</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Hãy làm quiz đầu tiên để xem kết quả tại đây
      </p>
      <Button size="sm" className="mt-4 gap-1.5" onClick={() => navigate('/quiz')}>
        <Trophy className="h-3.5 w-3.5" />
        Làm quiz ngay
      </Button>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-hover)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--color-surface-hover)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--color-surface-hover)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
