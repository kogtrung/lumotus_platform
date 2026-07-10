import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Search, History,
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
  const [consentQuizRef, setConsentQuizRef] = useState<string | null>(null)

  // Load all approved quizzes (Explore)
  const exploreQuery = useQuery({
    queryKey: ['quizzes', 'explore', sort, page],
    queryFn: () => quizApi.listExplore({ page, size: 20, sort }).then((r) => r.data),
    staleTime: 60_000,
  })

  // Load cooldown settings mapping
  const { data: cooldownConfig } = useQuery({
    queryKey: ['quiz', 'cooldown-config'],
    queryFn: () => quizApi.getCooldownConfig().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
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
    setConsentQuizRef(ref)
  }

  const handleStartQuiz = (ref: string) => {
    if (activeSessions && activeSessions.length > 0) {
      setSessionConflict({ open: true, newRef: ref, oldAttemptId: activeSessions[0].attemptId })
    } else {
      navigate(`/quiz/play/${ref}`)
    }
  }

  return (
    <div className="space-y-5">
      {/* Shared Gradient for Icons */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#FCD34D" offset="0%" />
            <stop stopColor="#F59E0B" offset="50%" />
            <stop stopColor="#EA580C" offset="100%" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-subtle)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
            Quiz
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text)]">Khám phá Quiz</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Luyện tập với bộ câu hỏi từ Admin</p>
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm quiz..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-subtle)]"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(0) }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                sort === opt.value
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-subtle)]">
            <BookCheck className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">
              {search ? 'Không tìm thấy quiz nào' : 'Chưa có quiz nào'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {search ? 'Thử từ khóa khác' : 'Admin sẽ sớm tạo quiz để bạn luyện tập'}
            </p>
          </div>
        </div>
      )}

      {/* Quiz List */}
      {!exploreQuery.isLoading && filtered.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          {filtered.map((quiz) => (
            <div key={quiz.id} className="relative group isolate">
              {/* Main Card */}
              <div className="relative z-10 flex flex-row items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm transition-all duration-300 hover:border-[var(--color-primary-subtle)] hover:shadow-md hover:-translate-y-0.5">
                {/* Cover */}
                <div className="mr-4 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-bg)]">
                  {quiz.coverImageUrl ? (
                    <img
                      src={quiz.coverImageUrl}
                      alt={quiz.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#451A03]/20 dark:to-[#78350F]/20">
                      <Trophy 
                        className="h-7 w-7 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm" 
                        style={{ stroke: 'url(#gold-gradient)', strokeWidth: 2 }}
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="truncate text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      {quiz.title}
                    </h3>

                    {/* Meta */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1 rounded bg-[var(--color-surface-hover)] px-2 py-0.5">
                        {quiz.questionCount} câu
                      </span>
                      {quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0 && (
                        <span className="flex items-center gap-1 rounded bg-[var(--color-surface-hover)] px-2 py-0.5">
                          {quiz.timeLimitSeconds}s/c
                        </span>
                      )}
                      <span className="flex items-center gap-1 rounded bg-[var(--color-surface-hover)] px-2 py-0.5">
                        {quiz.attemptCount} lượt chơi
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex items-center pr-2">
                    <MiniPlayButton onClick={() => handlePlay(quizRefFor(quiz))} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
          >
            Trước
          </Button>
          <span className="px-3 text-sm font-semibold text-[var(--color-text-muted)]">
            {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
          >
            Sau
          </Button>
        </div>
      )}

      {/* Pre-Quiz Consent Dialog */}
      {consentQuizRef && createPortal(
        <>
          <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/5 dark:bg-black/40" onClick={() => setConsentQuizRef(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-modal-in">
            <div className="pointer-events-auto w-full max-w-sm rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl relative">
              <button onClick={() => setConsentQuizRef(null)} className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X className="h-5 w-5" />
              </button>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-warning-subtle)]">
                <Info className="h-7 w-7 text-[var(--color-warning)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--color-text)] leading-snug">
                Bạn đã đọc kỹ <br/>quy luật làm quiz?
              </h3>
              <p className="mb-6 text-sm text-[var(--color-text-muted)] leading-relaxed">
                Mỗi câu hỏi đều có thời gian giới hạn và không thể quay lại. Hệ thống có tính năng chống spam (Cooldown).
              </p>
              <div className="flex flex-col gap-2.5">
                <Button 
                  onClick={() => {
                    handleStartQuiz(consentQuizRef)
                    setConsentQuizRef(null)
                  }}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[#F97316] text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Bắt đầu làm bài
                </Button>
                <Button 
                  onClick={() => setShowRulesDialog(true)}
                  variant="outline"
                  className="h-12 w-full rounded-xl text-[var(--color-text-secondary)] font-semibold border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                >
                  Đọc quy luật
                </Button>
              </div>
            </div>
          </div>
        </>,
        document.body
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
      {showRulesDialog && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 backdrop-blur-md bg-black/5 dark:bg-black/40"
            onClick={() => setShowRulesDialog(false)}
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-modal-in">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card-hover)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-lg font-bold text-[var(--color-text)]">Quy luật làm Quiz</h3>
                </div>
                <button
                  onClick={() => setShowRulesDialog(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)] leading-none">1</div>
                  <p><strong className="text-[var(--color-text)]">Mỗi câu hỏi có thời gian giới hạn</strong> — Hết giờ = tự động tính sai.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)] leading-none">2</div>
                  <p><strong className="text-[var(--color-text)]">Không quay lại câu trước</strong> — Đã trả lời hoặc hết giờ sẽ bị khóa.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)] leading-none">3</div>
                  <p><strong className="text-[var(--color-text)]">Chọn đáp án để tiếp tục</strong> — Hệ thống tự chuyển sang câu tiếp theo.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)] leading-none">4</div>
                  <p><strong className="text-[var(--color-text)]">Nộp bài khi hoàn thành</strong> — XP được tính dựa trên số câu đúng.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)] leading-none">5</div>
                  <p><strong className="text-[var(--color-text)]">Không hỗ trợ làm lại</strong> — Mỗi câu hỏi chỉ có một lần trả lời duy nhất.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-subtle)] text-xs font-bold text-[var(--color-danger)] leading-none">6</div>
                  <p>
                    <strong className="text-[var(--color-text)]">Hạn chế lượt làm</strong> —{' '}
                    {cooldownConfig?.enabled === false
                      ? 'Tính năng hạn chế đang được vô hiệu hóa, bạn có thể luyện tập thoả thích.'
                      : cooldownConfig
                      ? `Tối đa ${cooldownConfig.maxAttemptsPerQuizPerDay} lượt/quiz mỗi ngày (tổng ${cooldownConfig.maxTotalAttemptsPerDay} lượt). Thời gian chờ: ${Math.round(cooldownConfig.minSecondsBetweenAttempts / 60)} phút.`
                      : 'Khóa làm bài nếu nộp bài quá nhanh hoặc làm cùng 1 quiz quá 2 lần trong vòng 5 phút.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesDialog(false)}
                className="mt-6 w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold text-white transition-all hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
