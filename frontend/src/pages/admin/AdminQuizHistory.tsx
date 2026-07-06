import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Trophy,
  Check,
  Minus,
} from 'lucide-react'
import { adminApi, QuizAttemptAdmin } from '@/api/admin'
import { cn } from '@/utils/cn'

type FilterTab = 'all' | 'correct' | 'wrong' | 'skipped'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-3 w-3" />
          Hoàn thành
        </span>
      )
    case 'ABANDONED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <XCircle className="h-3 w-3" />
          Bỏ dở
        </span>
      )
    case 'IN_PROGRESS':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
          <Clock className="h-3 w-3" />
          Đang làm
        </span>
      )
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function ScoreBadge({ correct, total, status }: { correct: number; total: number; status: string }) {
  if (status !== 'COMPLETED') {
    return <span className="text-sm font-medium text-gray-400">—</span>
  }
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const color = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
  return (
    <span className={cn('text-sm font-bold', color)}>
      {correct}/{total}
    </span>
  )
}

function AttemptDetailModal({
  attempt,
  onClose,
}: {
  attempt: QuizAttemptAdmin
  onClose: () => void
}) {
  const [filter, setFilter] = useState<FilterTab>('all')

  const correctCount = attempt.answers?.filter((a) => a.correct).length ?? 0
  const wrongCount = attempt.answers?.filter((a) => !a.correct && a.userAnswer).length ?? 0
  const skippedCount = attempt.answers?.filter((a) => !a.userAnswer).length ?? 0

  const filteredAnswers = attempt.answers?.filter((a) => {
    switch (filter) {
      case 'correct': return a.correct
      case 'wrong': return !a.correct && a.userAnswer
      case 'skipped': return !a.userAnswer
      default: return true
    }
  }) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết lượt làm quiz</h2>
            <p className="text-sm text-gray-500">{attempt.quizTitle || 'Quiz đã xóa'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-all hover:border-red-500 hover:text-red-500"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-2xl font-extrabold text-gray-900">{attempt.score != null ? `${Math.round(attempt.score)}%` : '—'}</p>
            <p className="text-xs text-gray-500">Điểm</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-emerald-600" />
              <p className="text-2xl font-extrabold text-emerald-600">{correctCount}</p>
            </div>
            <p className="text-xs text-emerald-600/70">Đúng</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-2xl font-extrabold text-red-600">{wrongCount}</p>
            </div>
            <p className="text-xs text-red-600/70">Sai</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-1">
              <Minus className="h-4 w-4 text-gray-500" />
              <p className="text-2xl font-extrabold text-gray-600">{skippedCount}</p>
            </div>
            <p className="text-xs text-gray-500/70">Bỏ qua</p>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
            <User className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{attempt.username}</p>
            <p className="text-xs text-gray-500">{formatDate(attempt.startedAt)}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <StatusBadge status={attempt.status} />
            <div className="flex items-center gap-1.5 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-1.5">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-600">+{attempt.xpEarned}</span>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex-none border-b border-gray-200 bg-white px-6 py-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            {([
              { key: 'all', label: 'Tất cả', count: attempt.answers?.length ?? 0 },
              { key: 'correct', label: 'Đúng', count: correctCount, color: 'emerald' },
              { key: 'wrong', label: 'Sai', count: wrongCount, color: 'red' },
              { key: 'skipped', label: 'Bỏ qua', count: skippedCount, color: 'gray' },
            ] as const).map(({ key, label, count, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  filter === key
                    ? color === 'emerald' ? 'bg-emerald-100 text-emerald-700'
                    : color === 'red' ? 'bg-red-100 text-red-700'
                    : 'bg-white text-gray-700'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {label}
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  filter === key ? 'bg-emerald-200/50' : 'bg-white'
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Answers list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAnswers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="mb-2 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                {filter === 'all' ? 'Không có câu hỏi' :
                  filter === 'correct' ? 'Không có câu đúng' :
                  filter === 'wrong' ? 'Không có câu sai' :
                  'Không có câu bỏ qua'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredAnswers.map((answer, index) => {
                const status: 'correct' | 'wrong' | 'skipped' = answer.correct
                  ? 'correct'
                  : answer.userAnswer
                    ? 'wrong'
                    : 'skipped'
                return (
                  <div
                    key={answer.id}
                    className={cn(
                      'flex flex-col rounded-xl border overflow-hidden',
                      status === 'correct' && 'border-emerald-200 bg-emerald-50',
                      status === 'wrong' && 'border-red-200 bg-red-50',
                      status === 'skipped' && 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-between px-3 py-2 border-b shrink-0',
                      status === 'correct' && 'border-emerald-200',
                      status === 'wrong' && 'border-red-200',
                      status === 'skipped' && 'border-gray-200'
                    )}>
                      <span className="text-[11px] font-semibold text-gray-500">Câu {index + 1}</span>
                      <div className="flex items-center gap-1.5">
                        {status === 'correct' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> Đúng
                          </span>
                        )}
                        {status === 'wrong' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                            <XCircle className="h-3 w-3" /> Sai
                          </span>
                        )}
                        {status === 'skipped' && (
                          <span className="text-[10px] font-semibold text-gray-500">Bỏ qua</span>
                        )}
                      </div>
                    </div>
                    <div className="px-3 pt-2 pb-2">
                      <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-2 mb-2">
                        {answer.questionText || 'Câu hỏi đã xóa'}
                      </p>
                      <div className="space-y-1.5">
                        <div className={cn(
                          'flex items-start gap-2 rounded-lg px-2 py-1.5',
                          status === 'correct' ? 'bg-emerald-100' : status === 'wrong' ? 'bg-red-100' : 'bg-gray-100'
                        )}>
                          <span className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                            status === 'correct' ? 'bg-emerald-200 text-emerald-700' :
                            status === 'wrong' ? 'bg-red-200 text-red-700' :
                            'bg-gray-200 text-gray-600'
                          )}>
                            B
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold text-gray-500">Của bạn</p>
                            <p className={cn(
                              'text-xs leading-snug',
                              status === 'correct' && 'font-semibold text-emerald-700',
                              status === 'wrong' && 'text-red-700',
                              status === 'skipped' && 'italic text-gray-500'
                            )}>
                              {answer.userAnswer || '(Không chọn)'}
                            </p>
                          </div>
                        </div>
                        {status !== 'correct' && answer.correctAnswer && (
                          <div className="flex items-start gap-2 rounded-lg bg-emerald-100 px-2 py-1.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-200 text-[10px] font-bold text-emerald-700">Đ</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-gray-500">Đáp án đúng</p>
                              <p className="text-xs font-semibold leading-snug text-emerald-700">
                                {answer.correctAnswer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminQuizHistory() {
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptAdmin | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'ABANDONED'>('ALL')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'quiz-attempts', page, filter],
    queryKeyHashers: ['admin', 'quiz-attempts', page, filter],
    queryFn: () =>
      adminApi.getQuizAttempts({ page, size: 20 }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const attempts = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Filter client-side by search
  const filteredAttempts = searchQuery
    ? attempts.filter(
        (a) =>
          a.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.quizTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attempts

  const displayedAttempts =
    filter === 'ALL'
      ? filteredAttempts
      : filteredAttempts.filter((a) => a.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lịch sử Quiz</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalElements.toLocaleString()} lượt làm quiz
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên user hoặc quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['ALL', 'COMPLETED', 'ABANDONED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-semibold transition-colors',
              filter === f
                ? 'border-pink-500 text-pink-500'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            {f === 'ALL' ? 'Tất cả' : f === 'COMPLETED' ? 'Hoàn thành' : 'Bỏ dở'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      ) : displayedAttempts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white">
          <FileQuestion className="mb-2 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Không có lượt làm quiz nào</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Quiz
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    ✓ Đúng
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-red-600">
                    ✗ Sai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    — Bỏ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Điểm
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    XP
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedAttempts.map((attempt) => {
                  const wrongCount = attempt.totalQuestions - attempt.correctAnswers - attempt.skippedAnswers
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                            <User className="h-4 w-4 text-pink-500" />
                          </div>
                          <span className="font-medium text-gray-900">{attempt.username}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {attempt.quizTitle || (
                            <span className="italic text-gray-400">Quiz đã xóa</span>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <StatusBadge status={attempt.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-600">
                          {attempt.correctAnswers}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-sm font-bold text-red-600">
                          {wrongCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-sm font-bold text-gray-500">
                          {attempt.skippedAnswers}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <ScoreBadge correct={attempt.correctAnswers} total={attempt.totalQuestions} status={attempt.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900">
                            +{attempt.xpEarned}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="text-sm text-gray-500">
                          {formatDuration(attempt.timeTakenSeconds)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedAttempt(attempt)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <Eye className="h-3 w-3" />
                          Xem
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Trang {page + 1} / {totalPages} ({totalElements.toLocaleString()} kết quả)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                    page === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                    page >= totalPages - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading overlay */}
      {isFetching && !isLoading && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-white/50" />
      )}

      {/* Detail Modal */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  )
}
