import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookCheck, Clock, Edit3, Plus, Search, Target, Timer, Trophy, TrendingUp, Users,
  History, Filter, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quizApi, type QuizSummary } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type QuizStatus = 'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'

const STATUS_FILTERS: { value: QuizStatus; label: string; icon: typeof Filter }[] = [
  { value: 'ALL', label: 'Tất cả', icon: BookCheck },
  { value: 'DRAFT', label: 'Bản nháp', icon: Edit3 },
  { value: 'PENDING', label: 'Chờ duyệt', icon: AlertCircle },
  { value: 'APPROVED', label: 'Đã duyệt', icon: CheckCircle },
  { value: 'REJECTED', label: 'Từ chối', icon: XCircle },
]

const STATUS_STYLES: Record<QuizSummary['status'], { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: 'Nháp', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  APPROVED: { label: 'Đã duyệt', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  PENDING: { label: 'Chờ duyệt', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  REJECTED: { label: 'Từ chối', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function MiniPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
    >
      <PlayIcon className="h-3 w-3" />
      Chơi
    </button>
  )
}

export default function QuizPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<QuizStatus>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const myQuery = useQuery({
    queryKey: ['quizzes', 'mine', page],
    queryFn: () => quizApi.listMine({ page, size: 20 }).then((r) => r.data),
  })

  const submitReviewMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.submitForReview({ quizId }),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu duyệt quiz!')
      qc.invalidateQueries({ queryKey: ['quizzes', 'mine'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi duyệt')
    },
  })

  const quizzes = myQuery.data?.content ?? []
  const totalPages = myQuery.data?.totalPages ?? 1

  // Filter by status and search
  const filtered = quizzes.filter((q) => {
    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter
    const matchSearch = !search.trim() || q.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Count by status
  const statusCounts = quizzes.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const quizRefFor = (quiz: QuizSummary) => quiz.slug || quiz.id

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
            Quiz
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F0FA]">Quiz của tôi</h1>
          <p className="mt-0.5 text-sm text-[#8B7A9E]">Quản lý và luyện tập quiz cá nhân</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/quiz/history')}
            className="gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Lịch sử
          </Button>
          <Button size="md" onClick={() => navigate('/quiz/create')} className="shrink-0 gap-1.5">
            <Plus className="h-4 w-4" />
            Tạo Quiz
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((filter) => {
          const count = filter.value === 'ALL'
            ? quizzes.length
            : statusCounts[filter.value] || 0
          const isActive = statusFilter === filter.value
          const Icon = filter.icon

          return (
            <button
              key={filter.value}
              onClick={() => {
                setStatusFilter(filter.value)
                setPage(0)
                setSearch('')
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'border border-[#EC4899]/30 bg-[#EC4899]/20 text-[#EC4899]'
                  : 'border border-transparent text-[#8B7A9E] hover:bg-[#2D2538]/50 hover:text-[#F5F0FA]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-[#EC4899]/30' : 'bg-[#3D3348]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Tìm kiếm quiz..."
          className="w-full rounded-xl border border-[#3D3348] bg-[#252030]/80 py-2.5 pl-11 pr-4 text-sm text-[#F5F0FA] placeholder:text-[#8B7A9E] shadow-sm transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
        />
      </div>

      {/* Content */}
      {myQuery.isLoading ? (
        <QuizSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} statusFilter={statusFilter} />
      ) : (
        <>
          {/* Compact Quiz List */}
          <div className="space-y-2">
            {filtered.map((quiz) => {
              const ref = quizRefFor(quiz)
              return (
                <QuizListItem
                  key={quiz.id}
                  quiz={quiz}
                  navigate={navigate}
                  quizRef={ref}
                  onPlay={() => navigate(`/quiz/play/${ref}`)}
                  onEdit={() => navigate(`/quiz/detail/${ref}`)}
                  onSubmitReview={() => submitReviewMutation.mutate(quiz.id)}
                  submittingReview={submitReviewMutation.isPending}
                />
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ←
              </Button>
              <span className="text-sm text-[#8B7A9E]">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function QuizListItem({
  quiz,
  quizRef,
  onPlay,
  onEdit,
  onSubmitReview,
  submittingReview,
}: {
  quiz: QuizSummary
  quizRef: string
  onPlay: () => void
  onEdit: () => void
  onSubmitReview: () => void
  submittingReview: boolean
}) {
  const status = STATUS_STYLES[quiz.status]
  const score = quiz.avgScore != null ? Math.round(quiz.avgScore * 100) : null

  // Format date with time
  const createdDate = quiz.createdAt
    ? new Date(quiz.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4 transition-all hover:border-[#EC4899]/30 hover:bg-[#252030]/80">
      {/* Cover */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#2D2538]">
        {quiz.coverImageUrl ? (
          <img src={quiz.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Trophy className="h-5 w-5 text-[#EC4899]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3
            className="cursor-pointer truncate text-sm font-semibold text-[#F5F0FA] transition-colors hover:text-[#EC4899]"
            onClick={onEdit}
          >
            {quiz.title}
          </h3>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              status.bg,
              status.color,
            )}
          >
            {quiz.status === 'PENDING' && <Clock className="h-2.5 w-2.5" />}
            {quiz.status === 'REJECTED' && <XCircle className="h-2.5 w-2.5" />}
            {quiz.status === 'APPROVED' && <CheckCircle className="h-2.5 w-2.5" />}
            {status.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B7A9E]">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3 text-[#10B981]" />
            {quiz.questionCount} câu
          </span>
          {quiz.attemptCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-[#A78BFA]" />
              {quiz.attemptCount} lượt
            </span>
          )}
          {score != null && (
            <span className="flex items-center gap-1 font-semibold text-[#F97316]">
              <TrendingUp className="h-3 w-3" />
              {score}% TB
            </span>
          )}
          {quiz.timeLimitSeconds != null && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {quiz.timeLimitSeconds / 60}p
            </span>
          )}
          {createdDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {createdDate}
            </span>
          )}
        </div>

        {/* Rejection note */}
        {quiz.status === 'REJECTED' && quiz.rejectionNote && (
          <p className="mt-1 text-[10px] text-red-400/80">Lý do: {quiz.rejectionNote}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {quiz.status === 'PENDING' ? (
          <div className="flex items-center gap-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400">
            <Clock className="h-3.5 w-3.5" />
            Đang chờ
          </div>
        ) : quiz.status === 'REJECTED' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onSubmitReview}
            disabled={submittingReview}
            className="gap-1.5 border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500/10"
          >
            {submittingReview ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Gửi lại
          </Button>
        ) : (
          <MiniPlayButton onClick={onPlay} />
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="px-2 text-[#8B7A9E] hover:text-[#F5F0FA]"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ search, statusFilter }: { search: string; statusFilter: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D2538]">
        <Trophy className="h-8 w-8 text-[#8B7A9E]" />
      </div>
      <p className="font-bold text-[#8B7A9E]">
        {search
          ? 'Không tìm thấy quiz phù hợp'
          : statusFilter === 'ALL'
            ? 'Bạn chưa tạo quiz nào'
            : `Chưa có quiz ${statusFilter.toLowerCase()}`}
      </p>
      <p className="mt-1 text-sm text-[#8B7A9E]">
        {!search && statusFilter === 'ALL' && 'Tạo quiz đầu tiên để bắt đầu'}
      </p>
    </div>
  )
}

function QuizSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4">
          <div className="h-14 w-14 rounded-lg bg-[#3D3348]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[#3D3348]" />
            <div className="h-3 w-1/2 rounded bg-[#3D3348]" />
          </div>
        </div>
      ))}
    </div>
  )
}
