import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookCheck, Clock, Crown, Edit3, Plus, Search, Target, Timer, Trophy, TrendingUp, Users, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quizApi } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { QuizSummary } from '@/api/study'

type Tab = 'explore' | 'mine'

const STATUS_LABELS: Record<QuizSummary['status'], { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Bản nháp', color: 'text-slate-400', bg: 'bg-slate-500/15' },
  APPROVED: { label: 'Đã duyệt', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  PENDING: { label: 'Chờ duyệt', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  REJECTED: { label: 'Từ chối', color: 'text-red-400', bg: 'bg-red-500/15' },
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function QuizPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('mine')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const exploreQuery = useQuery({
    queryKey: ['quizzes', 'explore', page],
    queryFn: () => quizApi.listExplore({ page, size: 12 }).then((r) => r.data),
  })

  const myQuery = useQuery({
    queryKey: ['quizzes', 'mine', page],
    queryFn: () => quizApi.listMine({ page, size: 12 }).then((r) => r.data),
    enabled: tab === 'mine',
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

  const currentData = tab === 'explore' ? exploreQuery.data : myQuery.data
  const currentQuery = tab === 'explore' ? exploreQuery : myQuery
  const quizzes = currentData?.content ?? []
  const totalPages = currentData?.totalPages ?? 1

  const filtered = search.trim()
    ? quizzes.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))
    : quizzes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
          <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
          Quiz
        </div>
        <h1 className="text-3xl font-extrabold text-[#F5F0FA]">Quiz thi đua</h1>
        <p className="mt-1 text-sm text-[#8B7A9E]">
          {tab === 'mine'
            ? 'Quản lý quiz cá nhân — tập luyện hoặc gửi lên Khám phá'
            : 'Thi đua top — chỉ quiz đã duyệt mới tính XP'}
        </p>
      </div>

      {/* Tabs + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-[#3D3348] bg-[#1A1520] p-1">
          {([
            ['mine', 'Của tôi', BookCheck],
            ['explore', 'Khám phá', Trophy],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(0); setSearch('') }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                tab === key
                  ? 'bg-[#EC4899]/20 text-[#EC4899] shadow-sm'
                  : 'text-[#8B7A9E] hover:text-[#F5F0FA]',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <Button size="md" onClick={() => navigate('/quiz/create')} className="shrink-0">
          <Plus className="h-4 w-4" />
          Tạo Quiz
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={tab === 'explore' ? 'Tìm quiz...' : 'Tìm quiz của bạn...'}
          className="w-full rounded-xl border border-[#3D3348] bg-[#252030]/80 py-2.5 pl-11 pr-4 text-sm text-[#F5F0FA] placeholder-[#8B7A9E] shadow-sm transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
        />
      </div>

      {/* Content */}
      {currentQuery.isLoading ? (
        <QuizSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} search={search} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                tab={tab}
                navigate={navigate}
                onPlay={() => navigate(`/quiz/play/${quiz.id}`)}
                onSubmitReview={() => submitReviewMutation.mutate(quiz.id)}
                submittingReview={submitReviewMutation.isPending}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ←
              </Button>
              <span className="text-sm text-[#8B7A9E]">{page + 1} / {totalPages}</span>
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

function QuizCard({
  quiz, tab, navigate, onPlay, onSubmitReview, submittingReview,
}: {
  quiz: QuizSummary
  tab: Tab
  navigate: ReturnType<typeof useNavigate>
  onPlay: () => void
  onSubmitReview: () => void
  submittingReview: boolean
}) {
  const score = quiz.avgScore != null ? Math.round(quiz.avgScore * 100) : null
  const statusInfo = STATUS_LABELS[quiz.status]

  const xpPerAttempt = quiz.attemptCount && quiz.attemptCount > 0
    ? Math.round((quiz.avgScore ?? 0) * quiz.attemptCount * 10)
    : null

  const createdDate = quiz.createdAt
    ? new Date(quiz.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
    : null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#3D3348] bg-[#252030]/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:shadow-xl hover:shadow-[#EC4899]/5">
      {/* Cover image */}
      {quiz.coverImageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={quiz.coverImageUrl}
            alt={quiz.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#252030] to-transparent" />
        </div>
      )}

      {/* Accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316] opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-1 flex-col p-5">
        {/* Status badge + date row */}
        <div className="mb-2 flex items-start justify-between gap-2">
          {tab === 'mine' && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', statusInfo.bg, statusInfo.color)}>
              {quiz.status === 'PENDING' && <Clock className="h-3 w-3" />}
              {quiz.status === 'REJECTED' && <span>✕</span>}
              {statusInfo.label}
            </span>
          )}
          {tab === 'explore' && xpPerAttempt != null && xpPerAttempt > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[rgba(236,72,153,0.12)] px-2.5 py-1 text-xs font-semibold text-[#EC4899]">
              <Zap className="h-3 w-3" />
              {xpPerAttempt.toLocaleString()} XP
            </span>
          )}
          {createdDate && (
            <span className={cn('ml-auto text-xs text-[#8B7A9E]', tab === 'mine' ? '' : 'hidden')}>
              {createdDate}
            </span>
          )}
        </div>

        {/* Title — clickable to detail */}
        <button
          type="button"
          onClick={() => tab === 'mine' && navigate(`/quiz/detail/${quiz.id}`)}
          className={cn(
            'mb-1 text-left text-base font-bold line-clamp-2 transition-colors',
            tab === 'mine'
              ? 'cursor-pointer text-[#F5F0FA] hover:text-[#EC4899]'
              : 'text-[#F5F0FA] group-hover:text-[#EC4899]',
          )}
        >
          {quiz.title}
        </button>

        {/* Description */}
        {quiz.description && (
          <p className="mb-2 text-xs text-[#8B7A9E] line-clamp-2">{quiz.description}</p>
        )}

        {/* Owner */}
        {tab === 'explore' && quiz.ownerUsername && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-[#8B7A9E]">
            <Users className="h-3 w-3" />
            <span>{quiz.ownerUsername}</span>
          </div>
        )}

        {/* Rejection note */}
        {tab === 'mine' && quiz.status === 'REJECTED' && (
          <div className="mb-3 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2">
            <p className="text-xs font-semibold text-[#EF4444]">Lý do từ chối</p>
            <p className="mt-0.5 text-xs text-[#8B7A9E]">{quiz.rejectionNote || 'Không có ghi chú'}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
          <div className="flex items-center gap-1 text-xs text-[#8B7A9E]">
            <Target className="h-3.5 w-3.5 text-[#10B981]" />
            <span>{quiz.questionCount} câu</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#8B7A9E]">
            <Users className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span>{quiz.attemptCount} lượt</span>
          </div>
          {score != null && (
            <div className="flex items-center gap-1 text-xs text-[#8B7A9E]">
              <TrendingUp className="h-3.5 w-3.5 text-[#F97316]" />
              <span>{score}% TB</span>
            </div>
          )}
          {quiz.timeLimitSeconds != null && (
            <div className="flex items-center gap-1 text-xs text-[#8B7A9E]">
              <Timer className="h-3.5 w-3.5" />
              <span>{quiz.timeLimitSeconds / 60}p</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {tab === 'explore' ? (
            <>
              <Button size="sm" className="flex-1 gap-1.5" onClick={onPlay}>
                <PlayIcon className="h-3.5 w-3.5" />
                Chơi
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/quiz/leaderboard/${quiz.id}`)} className="px-3">
                <Trophy className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onPlay}
                disabled={quiz.status === 'PENDING'}
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Luyện tập
              </Button>

              {/* Manage button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/quiz/detail/${quiz.id}`)}
                className="px-2.5"
                title="Quản lý quiz"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>

              {quiz.status === 'PENDING' && (
                <span className="flex items-center gap-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 text-xs font-semibold text-yellow-400">
                  <Clock className="h-3.5 w-3.5" />
                </span>
              )}

              {quiz.status === 'REJECTED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSubmitReview}
                  disabled={submittingReview}
                  className="gap-1.5 border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:border-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
                >
                  {submittingReview ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#EF4444] border-t-transparent" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Gửi lại
                </Button>
              )}

              {quiz.status === 'APPROVED' && (
                <span className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400">
                  <Crown className="h-3.5 w-3.5" />
                  Top
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab, search }: { tab: Tab; search: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D2538]">
        <Trophy className="h-8 w-8 text-[#8B7A9E]" />
      </div>
      <p className="font-bold text-[#8B7A9E]">
        {search ? 'Không tìm thấy quiz phù hợp' : tab === 'explore' ? 'Chưa có quiz nào trong Khám phá' : 'Bạn chưa tạo quiz nào'}
      </p>
      <p className="mt-1 text-sm text-[#8B7A9E]">
        {tab === 'mine' && !search ? 'Tạo quiz đầu tiên để bắt đầu' : ''}
      </p>
    </div>
  )
}

function QuizSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-5">
          <div className="mb-3 h-5 w-3/4 rounded bg-[#3D3348]" />
          <div className="mb-4 h-4 w-1/2 rounded bg-[#3D3348]" />
          <div className="flex gap-3">
            <div className="h-4 w-16 rounded bg-[#3D3348]" />
            <div className="h-4 w-16 rounded bg-[#3D3348]" />
          </div>
          <div className="mt-4 h-9 w-full rounded-lg bg-[#3D3348]" />
        </div>
      ))}
    </div>
  )
}
