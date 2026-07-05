import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Search, History, CheckCircle,
  Clock, Target, TrendingUp, BookCheck,
  BookOpen, Info, X,
} from 'lucide-react'
import { quizApi, type QuizSummary } from '@/api/study'
import Button from '@/components/ui/Button'
import ExitConfirmDialog from '@/components/ui/ExitConfirmDialog'
import { cn } from '@/utils/cn'

type SortOption = 'newest' | 'popular' | 'trending'

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
  { value: 'newest', label: 'Mới nhất', icon: Clock },
  { value: 'popular', label: 'Phổ biến', icon: Target },
  { value: 'trending', label: 'Xu hướng', icon: TrendingUp },
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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortOption>('newest')
  const [sessionConflict, setSessionConflict] = useState<{ open: boolean; newRef?: string; oldAttemptId?: string }>({ open: false })
  const [showRulesDialog, setShowRulesDialog] = useState(false)

  // Load all approved quizzes (Explore)
  const exploreQuery = useQuery({
    queryKey: ['quizzes', 'explore', sort, page],
    queryFn: () => quizApi.listExplore({ page, size: 20, sort }).then((r) => r.data),
    staleTime: 60_000,
  })

  // Check active sessions before starting new quiz
  const { data: activeSessions } = useQuery({
    queryKey: ['quiz', 'active-sessions'],
    queryFn: () => quizApi.getActiveSessions().then((r) => r.data),
    staleTime: 30_000,
  })

  const quizzes = exploreQuery.data?.content ?? []
  const totalPages = exploreQuery.data?.totalPages ?? 1

  // Filter by search
  const filtered = quizzes.filter((q) =>
    !search.trim() || q.title.toLowerCase().includes(search.toLowerCase())
  )

  const quizRefFor = (quiz: QuizSummary) => quiz.slug || quiz.id

  const handlePlay = (ref: string) => {
    if (activeSessions && activeSessions.length > 0) {
      setSessionConflict({ open: true, newRef: ref, oldAttemptId: activeSessions[0].attemptId })
    } else {
      navigate(`/quiz/play/${ref}`)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
            Quiz
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F0FA]">Khám phá Quiz</h1>
          <p className="mt-0.5 text-sm text-[#8B7A9E]">Luyện tập với bộ câu hỏi từ Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRulesDialog(true)}
            className="gap-1.5"
            title="Quy luật làm quiz"
          >
            <Info className="h-3.5 w-3.5" />
            Quy luật
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/quiz/history')}
            className="gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Lịch sử
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/quiz/leaderboard')}
            className="gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5" />
            Bảng xếp hạng
          </Button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
          <input
            type="text"
            placeholder="Tìm kiếm quiz..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full rounded-xl border border-[#3D3348] bg-[#252030] py-2.5 pl-10 pr-4 text-sm text-[#F5F0FA] placeholder-[#8B7A9E] outline-none transition focus:border-[#EC4899]"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[#3D3348] bg-[#252030] p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(0) }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                sort === opt.value
                  ? 'bg-[#EC4899] text-white shadow-sm'
                  : 'text-[#8B7A9E] hover:text-[#F5F0FA]'
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {exploreQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="review-loader" />
        </div>
      )}

      {/* Empty */}
      {!exploreQuery.isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#3D3348] bg-[#252030]/50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(236,72,153,0.1)]">
            <BookCheck className="h-8 w-8 text-[#EC4899]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#F5F0FA]">
              {search ? 'Không tìm thấy quiz nào' : 'Chưa có quiz nào'}
            </p>
            <p className="mt-1 text-xs text-[#8B7A9E]">
              {search ? 'Thử từ khóa khác' : 'Admin sẽ sớm tạo quiz để bạn luyện tập'}
            </p>
          </div>
        </div>
      )}

      {/* Quiz Grid */}
      {!exploreQuery.isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="group rounded-2xl border border-[#3D3348] bg-[#252030] p-4 transition-all"
            >
              {/* Cover */}
              <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#1A1520]">
                {quiz.coverImageUrl ? (
                  <img
                    src={quiz.coverImageUrl}
                    alt={quiz.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Trophy className="h-10 w-10 text-[#3D3348]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-h-0">
                <h3 className="mb-1 line-clamp-2 text-sm font-bold text-[#F5F0FA]">
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="mb-2 line-clamp-2 text-xs text-[#8B7A9E]">
                    {quiz.description}
                  </p>
                )}

                {/* Meta */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                    STATUS_STYLES[quiz.status]?.bg,
                    STATUS_STYLES[quiz.status]?.border,
                    STATUS_STYLES[quiz.status]?.color
                  )}>
                    {quiz.status === 'APPROVED' && <CheckCircle className="h-2.5 w-2.5" />}
                    {STATUS_STYLES[quiz.status]?.label}
                  </span>
                  <span className="text-[10px] text-[#8B7A9E]">
                    {quiz.questionCount} câu
                  </span>
                  {quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0 && (
                    <span className="text-[10px] text-[#8B7A9E]">
                      {quiz.timeLimitSeconds}s/câu
                    </span>
                  )}
                  <span className="text-[10px] text-[#8B7A9E]">
                    {quiz.attemptCount} lượt chơi
                  </span>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8B7A9E]">
                    {quiz.ownerUsername}
                  </span>
                  <MiniPlayButton onClick={() => handlePlay(quizRefFor(quiz))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Trước
          </Button>
          <span className="px-3 text-sm text-[#8B7A9E]">
            {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Active Session Conflict Dialog */}
      <ExitConfirmDialog
        open={sessionConflict.open}
        title="Có phiên làm bài đang hoạt động"
        body="Bạn đang có một phiên quiz chưa hoàn thành. Bạn muốn tiếp tục hay bắt đầu bài mới?"
        confirmLabel="Bắt đầu bài mới"
        confirmHint="Phiên cũ sẽ bị hủy"
        cancelLabel="Tiếp tục bài cũ"
        onConfirm={() => {
          const newRef = sessionConflict.newRef
          setSessionConflict({ open: false })
          if (newRef) navigate(`/quiz/play/${newRef}`)
        }}
        onCancel={() => {
          const oldRef = activeSessions?.[0]?.quizSlug ?? activeSessions?.[0]?.attemptId
          setSessionConflict({ open: false })
          if (oldRef) navigate(`/quiz/play/${oldRef}`)
        }}
      />

      {/* Quiz Rules Dialog */}
      {showRulesDialog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRulesDialog(false)}
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#3D3348] bg-[#1D1A24] p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#EC4899]" />
                  <h3 className="text-lg font-bold text-[#F5F0FA]">Quy luật làm Quiz</h3>
                </div>
                <button
                  onClick={() => setShowRulesDialog(false)}
                  className="text-[#8B7A9E] hover:text-[#F5F0FA]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-[#C4B8D9]">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">1</div>
                  <p><strong className="text-[#F5F0FA]">Mỗi câu hỏi có thời gian giới hạn</strong> — Hết giờ = tự động tính sai.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">2</div>
                  <p><strong className="text-[#F5F0FA]">Không quay lại câu trước</strong> — Đã trả lời hoặc hết giờ sẽ bị khóa.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">3</div>
                  <p><strong className="text-[#F5F0FA]">Chọn đáp án để tiếp tục</strong> — Hệ thống tự chuyển sang câu tiếp theo.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">4</div>
                  <p><strong className="text-[#F5F0FA]">Nộp bài khi hoàn thành</strong> — XP được tính dựa trên câu trả lời đúng.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">5</div>
                  <p><strong className="text-[#F5F0FA]">Làm lại không được</strong> — Mỗi câu hỏi chỉ có một lần trả lời duy nhất.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesDialog(false)}
                className="mt-6 w-full rounded-xl bg-[#EC4899] py-3 font-bold text-white transition-all hover:bg-[#EC4899]/80"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
