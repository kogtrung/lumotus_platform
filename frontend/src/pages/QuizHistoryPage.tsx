import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  History, Trophy, Clock, Target, Zap, ChevronLeft, ChevronRight,
  CheckCircle, Timer, TrendingUp,
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3D3348] bg-[#252030]/80 text-[#8B7A9E] transition-colors hover:border-[#EC4899]/30 hover:text-[#EC4899]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
            <History className="h-3.5 w-3.5" strokeWidth={2.5} />
            Quiz
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F0FA]">Lịch sử làm quiz</h1>
          <p className="mt-0.5 text-sm text-[#8B7A9E]">
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
                ? `${Math.round(
                    attempts
                      .filter(a => a.score != null)
                      .reduce((sum, a) => sum + (a.score ?? 0), 0) /
                      attempts.filter(a => a.score != null).length * 100
                  )}%`
                : '—'
            }
            color="#10B981"
          />
          <StatCard
            icon={TrendingUp}
            label="Điểm cao nhất"
            value={
              attempts.filter(a => a.score != null).length > 0
                ? `${Math.round(Math.max(...attempts.filter(a => a.score != null).map(a => a.score ?? 0)) * 100)}%`
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
                onClick={() => navigate(`/quiz/play/${attempt.quizSlug || attempt.quizId}`)}
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
              <span className="text-sm text-[#8B7A9E]">
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
    <div className="rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B7A9E]">{label}</span>
      </div>
      <p className="text-xl font-extrabold text-[#F5F0FA]">{value}</p>
    </div>
  )
}

function AttemptCard({
  attempt,
  onClick,
}: {
  attempt: QuizAttemptSummary
  onClick: () => void
}) {
  const score = attempt.score != null ? Math.round(attempt.score * 100) : null
  const isPassing = score !== null && score >= 70

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
    <div
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4 cursor-pointer transition-all hover:border-[#EC4899]/30 hover:bg-[#252030]/80"
    >
      {/* Score indicator */}
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold',
        isPassing
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-red-500/20 text-red-400',
      )}>
        {score !== null ? `${score}%` : '?'}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[#F5F0FA] group-hover:text-[#EC4899] transition-colors">
          {attempt.quizTitle || 'Quiz không tên'}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#8B7A9E]">
          {attempt.correctAnswers !== null && attempt.totalQuestions !== null && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" />
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

      {/* Action */}
      <div className="shrink-0">
        <Button size="sm" variant="ghost" className="text-[#8B7A9E] hover:text-[#EC4899]">
          Xem lại
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D2538]">
        <History className="h-8 w-8 text-[#8B7A9E]" />
      </div>
      <p className="font-bold text-[#8B7A9E]">Chưa có lịch sử làm quiz</p>
      <p className="mt-1 text-sm text-[#8B7A9E]">
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
        <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4">
          <div className="h-12 w-12 rounded-xl bg-[#3D3348]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[#3D3348]" />
            <div className="h-3 w-1/2 rounded bg-[#3D3348]" />
          </div>
        </div>
      ))}
    </div>
  )
}
