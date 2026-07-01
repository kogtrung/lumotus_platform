import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Pencil,
  FileQuestion,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Upload,
  Clock,
  X,
  Users,
  Trophy,
  LayoutGrid,
  Trash2,
  EyeOff,
} from 'lucide-react'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

type QuizStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'
type TabType = 'pending' | 'approved' | 'rejected' | 'all' | 'explore'

interface QuizModeration {
  id: string
  slug?: string
  title: string
  description: string | null
  deckId: string | null
  deckTitle: string | null
  ownerId: string
  ownerUsername: string | null
  createdAt: string
  attemptCount: number
  avgScore: number | null
  quizType: string | undefined
  status: QuizStatus
  isPublic?: boolean
  questionCount?: number
  timeLimitSeconds?: number | null
}

// ============================================================
// Quiz Card
// ============================================================

function QuizCard({
  quiz,
  onApprove,
  onReject,
  onTogglePublic,
  onViewDetail,
  onDelete,
}: {
  quiz: QuizModeration
  onApprove: () => void
  onReject: () => void
  onTogglePublic: () => void
  onViewDetail: () => void
  onDelete: () => void
}) {
  const statusConfig = {
    DRAFT: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Nháp' },
    PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Chờ duyệt' },
    APPROVED: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Đã duyệt' },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Từ chối' },
  }

  const status = statusConfig[quiz.status]

  return (
    <div className="rounded-xl border border-gray-200 bg-white/60 p-5 transition-all hover:bg-white/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{quiz.title}</h3>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', status.color, status.bg)}>
              {quiz.status === 'PENDING' && <AlertCircle className="h-3 w-3" />}
              {quiz.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
              {quiz.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
              {status.label}
            </span>
            {quiz.isPublic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EC4899]/20 px-2 py-0.5 text-xs font-semibold text-[#EC4899]">
                <Globe className="h-3 w-3" />
                Khám phá
              </span>
            )}
          </div>

          {/* Description */}
          {quiz.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {quiz.ownerUsername && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {quiz.ownerUsername}
              </span>
            )}
            {quiz.deckTitle && (
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" />
                {quiz.deckTitle}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(quiz.createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {quiz.attemptCount > 0 && (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {quiz.attemptCount} lượt
              </span>
            )}
            {quiz.avgScore != null && (
              <span className="rounded bg-[#10B981]/20 px-2 py-0.5 text-[#10B981]">
                TB {Math.round(quiz.avgScore * 100)}%
              </span>
            )}
            {quiz.quizType && (
              <span className="rounded bg-gray-200 px-2 py-0.5">
                {quiz.quizType === 'IMPORTED' ? 'Import CSV' : 'Tạo từ Deck'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {quiz.status === 'PENDING' && (
            <>
              <button
                onClick={onApprove}
                title="Duyệt quiz"
                className="flex items-center justify-center rounded-lg p-2 text-[#10B981] transition-all hover:bg-[#10B981]/20"
              >
                <CheckCircle className="h-5 w-5" />
              </button>
              <button
                onClick={onReject}
                title="Từ chối"
                className="flex items-center justify-center rounded-lg p-2 text-[#EF4444] transition-all hover:bg-[#EF4444]/20"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </>
          )}
          {quiz.status === 'APPROVED' && (
            <button
              onClick={onTogglePublic}
              title={quiz.isPublic ? 'Gỡ khỏi Khám phá' : 'Đưa lên Khám phá'}
              className={cn(
                'flex items-center justify-center rounded-lg p-2 transition-all',
                quiz.isPublic
                  ? 'text-[#EC4899] hover:bg-[#EC4899]/20'
                  : 'text-[#10B981] hover:bg-[#10B981]/20',
              )}
            >
              {quiz.isPublic ? <EyeOff className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            </button>
          )}
          {quiz.status === 'REJECTED' && (
            <button
              onClick={onApprove}
              title="Duyệt lại"
              className="flex items-center justify-center rounded-lg p-2 text-[#10B981] transition-all hover:bg-[#10B981]/20"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onViewDetail}
            title="Sửa quiz"
            className="flex items-center justify-center rounded-lg p-2 text-[#EC4899] transition-all hover:bg-[#EC4899]/20"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            title="Xóa quiz"
            className="flex items-center justify-center rounded-lg p-2 text-[#EF4444] transition-all hover:bg-[#EF4444]/20"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Import Dialog with File Upload
// ============================================================

function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (data: { title: string; description?: string; csvContent: string; timeLimitSeconds?: number }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Vui lòng chọn file CSV')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      // Auto-fill title from filename if empty
      if (!title) {
        const filename = file.name.replace(/\.csv$/i, '')
        setTitle(filename)
      }
      toast.success('Đã tải file thành công')
    }
    reader.onerror = () => {
      toast.error('Lỗi khi đọc file')
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!title.trim() || !csvContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung CSV')
      return
    }
    onImport({
      title: title.trim(),
      description: description.trim() || undefined,
      csvContent: csvContent.trim(),
      timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
    })
    setTitle('')
    setDescription('')
    setCsvContent('')
    setTimeLimit('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Import Quiz từ CSV</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Định dạng: question_text, correct_answer, option1, option2, option3, option4
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Tiêu đề Quiz</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: IELTS Vocabulary Set 1"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Mô tả (tùy chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả quiz..."
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Thời gian (giây, tùy chọn)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="300"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Tải lên file CSV</label>
            <div
              className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-all hover:border-[#EC4899]/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="mt-2 text-sm text-gray-500">
                {csvContent ? 'Đã tải file - nhấn để thay đổi' : 'Nhấn để chọn file CSV'}
              </p>
              <p className="mt-1 text-xs text-gray-500/60">
                hoặc kéo thả file vào đây
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Nội dung CSV</label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="What is the capital of France?,Paris,London,Berlin,Paris,Madrid
What is 2 + 2?,4,3,4,5,6"
              rows={8}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={handleImport}
            className="rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80"
          >
            Import Quiz
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function AdminQuizManagement() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showImport, setShowImport] = useState(false)

  // Determine status filter based on active tab
  const getStatusFilter = (): string | undefined => {
    if (activeTab === 'pending') return 'PENDING'
    if (activeTab === 'approved') return 'APPROVED'
    if (activeTab === 'rejected') return 'REJECTED'
    return undefined // 'all' - no filter
  }

  // Fetch quizzes based on tab
  const {
    data: quizData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'quizzes', activeTab, page, searchQuery],
    queryFn: async () => {
      const statusFilter = getStatusFilter()
      const result = await quizApi.listAdminAll({
        page,
        size: PAGE_SIZE,
        status: statusFilter,
        q: searchQuery || undefined,
      })

      const data = result.data
      // Sort by createdAt descending (newest first)
      let sortedContent = [...data.content].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Filter by explore tab
      if (activeTab === 'explore') {
        sortedContent = sortedContent.filter((quiz: any) => quiz.isPublic)
      }

      return {
        ...data,
        content: sortedContent.map((quiz: any) => ({
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description,
          deckId: quiz.deckId,
          deckTitle: quiz.deckTitle,
          ownerId: quiz.ownerId,
          ownerUsername: quiz.ownerUsername,
          createdAt: quiz.createdAt,
          attemptCount: quiz.attemptCount,
          avgScore: quiz.avgScore,
          quizType: quiz.quizType,
          status: quiz.status,
          isPublic: quiz.isPublic,
          questionCount: quiz.questionCount,
          timeLimitSeconds: quiz.timeLimitSeconds,
        })),
      }
    },
    staleTime: 30_000,
  })

  // Fetch pending count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['admin', 'quizzes', 'pending', 'count'],
    queryFn: () => quizApi.getPendingCount().then((r) => r.data),
    staleTime: 30_000,
  })

  // Moderate mutation (approve/reject/delete)
  const moderateMutation = useMutation({
    mutationFn: async ({ quizId, action, note }: { quizId: string; action: 'APPROVE' | 'REJECT' | 'TOGGLE_PUBLIC' | 'DELETE'; note?: string }) => {
      return quizApi.moderate({ quizId, action, note })
    },
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi cập nhật')
    },
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; csvContent: string; timeLimitSeconds?: number }) => {
      return quizApi.importFromCsv(data)
    },
    onSuccess: (response) => {
      toast.success(`Import thành công! ${response.data.questionCount} câu hỏi`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi import')
    },
  })

  const handleApprove = (quizId: string) => {
    moderateMutation.mutate({ quizId, action: 'APPROVE' })
  }

  const handleReject = (quizId: string) => {
    moderateMutation.mutate({ quizId, action: 'REJECT', note: 'Không đạt yêu cầu' })
  }

  const handleTogglePublic = (quiz: QuizModeration) => {
    moderateMutation.mutate({ quizId: quiz.id, action: 'TOGGLE_PUBLIC' })
  }

  const handleDelete = (quiz: QuizModeration) => {
    if (confirm(`Xóa quiz "${quiz.title}"? Hành động không thể hoàn tác.`)) {
      moderateMutation.mutate({ quizId: quiz.id, action: 'DELETE' })
    }
  }

  const quizzes = quizData?.content ?? []
  const totalPages = quizData?.totalPages ?? 1
  const totalElements = quizData?.totalElements ?? 0

  // Helper: prefer slug if available, fallback to id
  const quizRefFor = (quiz: QuizModeration) => quiz.slug || quiz.id

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'explore', label: 'Khám phá' },
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ duyệt', count: pendingCount },
    { id: 'rejected', label: 'Từ chối' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Quiz</h1>
          <p className="mt-1 text-sm text-gray-500">
            Duyệt quiz từ user, quản lý quiz trên Khám phá, import từ CSV
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/40 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setPage(0)
              setSearchQuery('')
            }}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-500 hover:text-gray-600',
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E0B] px-1.5 text-xs font-bold text-white">
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm kiếm quiz..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(0)
          }}
          className="w-full rounded-lg border border-gray-200/60 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
        />
      </div>

      {/* Results info */}
      {!isLoading && totalElements > 0 && (
        <p className="text-sm text-gray-500">
          Hiển thị {quizzes.length} / {totalElements} quiz
        </p>
      )}

      {/* Quiz List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/60 border border-gray-200" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center">
          <FileQuestion className="mx-auto mb-3 h-12 w-12 text-gray-500/40" />
          <p className="text-gray-500">
            {activeTab === 'all'
              ? 'Không có quiz nào'
              : activeTab === 'approved'
              ? 'Không có quiz nào đã duyệt'
              : activeTab === 'pending'
              ? 'Không có quiz nào chờ duyệt'
              : activeTab === 'explore'
              ? 'Không có quiz nào trên Khám phá'
              : 'Không có quiz nào bị từ chối'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
            {quizzes.map((quiz) => {
              const ref = quizRefFor(quiz)
              return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onApprove={() => handleApprove(quiz.id)}
                onReject={() => handleReject(quiz.id)}
                onTogglePublic={() => handleTogglePublic(quiz)}
                onViewDetail={() => navigate(`/admin/quizzes/${ref}`)}
                onDelete={() => handleDelete(quiz)}
              />
              )
            })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/40 p-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              page === 0
                ? 'cursor-not-allowed text-gray-500/40'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <span className="text-sm text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              page >= totalPages - 1
                ? 'cursor-not-allowed text-gray-500/40'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
            )}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={(data) => importMutation.mutate(data)}
      />
    </div>
  )
}
