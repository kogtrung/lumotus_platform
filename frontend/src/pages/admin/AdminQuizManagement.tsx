import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Pencil, FileQuestion, CheckCircle,
  RefreshCw, Globe, Upload, Clock, X,
  Trash2, EyeOff, HelpCircle, Plus, Search,
  Rocket,
} from 'lucide-react'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'
import { lumotoast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const PAGE_SIZE = 10

type TabType = 'explore' | 'published' | 'drafts' | 'all'

interface QuizItem {
  id: string
  slug?: string | null
  title: string
  description: string | null
  status: 'DRAFT' | 'APPROVED' | 'PENDING' | 'REJECTED'
  isPublic: boolean
  questionCount: number
  attemptCount: number
  avgScore: number | null
  createdAt: string
  updatedAt: string
}

// ─── Quiz Card ──────────────────────────────────────────────────────────────

function QuizCard({ quiz, onView, onDelete, onApprove, onPublish, onTogglePublic }: {
  quiz: QuizItem
  onView: () => void
  onDelete: () => void
  onApprove: () => void
  onPublish: () => void
  onTogglePublic: () => void
}) {
  const statusLabels: Record<string, string> = {
    APPROVED: 'Đã duyệt',
    PENDING: 'Chờ duyệt',
    DRAFT: 'Nháp',
    REJECTED: 'Từ chối',
  }
  const statusColors: Record<string, string> = {
    APPROVED: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    PENDING: 'bg-amber-50 border-amber-200 text-amber-600',
    DRAFT: 'bg-slate-50 border-slate-200 text-slate-500',
    REJECTED: 'bg-red-50 border-red-200 text-red-500',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white/60 p-5 transition-all hover:bg-white/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{quiz.title}</h3>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
              statusColors[quiz.status] || 'bg-slate-50 border-slate-200 text-slate-500'
            )}>
              {statusLabels[quiz.status] || quiz.status}
            </span>
            {quiz.isPublic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-2 py-0.5 text-[10px] font-bold text-pink-600">
                <Globe className="h-2.5 w-2.5" />
                Khám phá
              </span>
            )}
          </div>

          {quiz.description && (
            <p className="mt-1 line-clamp-1 text-xs text-gray-500">{quiz.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {quiz.questionCount} câu
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
            </span>
            {quiz.attemptCount > 0 && (
              <span className="text-orange-500">{quiz.attemptCount} lượt</span>
            )}
            {quiz.avgScore != null && (
              <span className="text-emerald-600">TB {Math.round(quiz.avgScore * 100)}%</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button onClick={onView} title="Sửa quiz"
            className="flex items-center justify-center rounded-lg p-2 text-pink-600 transition-all hover:bg-pink-50">
            <Pencil className="h-4 w-4" />
          </button>
          {quiz.status === 'DRAFT' && (
            <button onClick={onApprove} title="Duyệt quiz"
              className="flex items-center justify-center rounded-lg p-2 text-emerald-600 transition-all hover:bg-emerald-50">
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {!quiz.isPublic && quiz.status === 'APPROVED' && (
            <button onClick={onPublish} title="Publish lên Khám phá"
              className="flex items-center justify-center rounded-lg p-2 text-emerald-600 transition-all hover:bg-emerald-50">
              <Rocket className="h-4 w-4" />
            </button>
          )}
          {quiz.isPublic && (
            <button onClick={onTogglePublic} title="Gỡ khỏi Khám phá"
              className="flex items-center justify-center rounded-lg p-2 text-pink-600 transition-all hover:bg-pink-50">
              <EyeOff className="h-4 w-4" />
            </button>
          )}
          <button onClick={onDelete} title="Xóa"
            className="flex items-center justify-center rounded-lg p-2 text-red-500 transition-all hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Import Dialog ──────────────────────────────────────────────────────────

function ImportDialog({ open, onClose, onImport }: {
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
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      lumotoast.error('Vui lòng chọn file CSV')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      if (!title) setTitle(file.name.replace(/\.csv$/i, ''))
      lumotoast.success('Đã tải file thành công')
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!title.trim() || !csvContent.trim()) {
      lumotoast.error('Vui lòng nhập tiêu đề và nội dung CSV')
      return
    }
    onImport({
      title: title.trim(),
      description: description.trim() || undefined,
      csvContent: csvContent.trim(),
      timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
    })
    setTitle(''); setDescription(''); setCsvContent(''); setTimeLimit('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10, 8, 20, 0.85)', backdropFilter: 'blur(4px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-pink-500 to-orange-500" />
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Import Quiz từ CSV</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-gray-500">Định dạng: question_text, correct_answer, option1, option2, option3, option4</p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề Quiz *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: IELTS Vocabulary Set 1"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả quiz..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Thời gian mỗi câu (giây)</label>
              <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="30"
                min={5}
                max={300}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
              <p className="mt-1 text-xs text-gray-400">5-300 giây cho mỗi câu hỏi</p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tải file CSV</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition-all hover:border-pink-400">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">{csvContent ? 'Đã tải file ✓' : 'Chọn file CSV'}</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung CSV</label>
            <textarea value={csvContent} onChange={(e) => setCsvContent(e.target.value)}
              placeholder="What is the capital of France?,Paris,London,Berlin,Madrid,New York"
              rows={8}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={handleImport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md">
            Import Quiz
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Manual Create Dialog ────────────────────────────────────────────────────

function CreateQuizDialog({ open, onClose, onCreate }: {
  open: boolean
  onClose: () => void
  onCreate: (data: { title: string; description?: string; timeLimitSeconds?: number }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')

  if (!open) return null

  const handleCreate = () => {
    if (!title.trim()) { lumotoast.error('Vui lòng nhập tiêu đề'); return }
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
    })
    setTitle(''); setDescription(''); setTimeLimit('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10, 8, 20, 0.85)', backdropFilter: 'blur(4px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-pink-500 to-orange-500" />
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Tạo Quiz mới</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề Quiz *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: TOEIC Reading Part 5"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả quiz..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Thời gian mỗi câu (giây)</label>
            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}
              placeholder="30"
              min={5}
              max={300}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">5-300 giây cho mỗi câu hỏi</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md">
            Tạo Quiz
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminQuizManagement() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showImport, setShowImport] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; body?: string; onConfirm: (() => void) | null
  }>({ open: false, title: '', body: '', onConfirm: null })

  const getStatusFilter = (): string | undefined => {
    if (activeTab === 'explore') return undefined // APPROVED + isPublic (handle in component)
    if (activeTab === 'published') return 'APPROVED'
    if (activeTab === 'drafts') return 'DRAFT'
    return undefined // all
  }

  const { data: quizData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'quizzes', activeTab, page],
    queryFn: async () => {
      const result = await quizApi.listAdminAll({ page, size: PAGE_SIZE, status: getStatusFilter() })
      const data = result.data
      let quizzes = data.content.map((q: any) => ({
        id: q.id, slug: q.slug, title: q.title, description: q.description,
        status: q.status as QuizItem['status'],
        isPublic: q.isPublic ?? false,
        questionCount: q.questionCount ?? 0,
        attemptCount: q.attemptCount ?? 0,
        avgScore: q.avgScore,
        createdAt: q.createdAt, updatedAt: q.updatedAt,
      }))
      // For explore tab, filter to only APPROVED + isPublic
      if (activeTab === 'explore') {
        quizzes = quizzes.filter((q: QuizItem) => q.status === 'APPROVED' && q.isPublic)
      }
      return { ...data, content: quizzes }
    },
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.deleteAdminQuiz(quizId),
    onSuccess: () => {
      lumotoast.success('Đã xóa quiz')
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi xóa')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.moderate({ quizId, action: 'APPROVE' }),
    onSuccess: () => {
      lumotoast.success('Đã duyệt quiz!')
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi duyệt')
    },
  })

  const publishMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.moderate({ quizId, action: 'PUBLISH' }),
    onSuccess: () => {
      lumotoast.success('Đã publish quiz lên Khám phá!')
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi publish')
    },
  })

  const togglePublicMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.moderate({ quizId, action: 'TOGGLE_PUBLIC' }),
    onSuccess: () => {
      lumotoast.success('Đã cập nhật trạng thái Khám phá')
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi cập nhật')
    },
  })

  const importMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; csvContent: string; timeLimitSeconds?: number }) =>
      quizApi.importFromCsv(data),
    onSuccess: (response: any) => {
      const { quizId, slug, questionCount } = response.data
      lumotoast.success(`Import thành công! ${questionCount} câu hỏi`)
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      const ref = slug || quizId
      navigate(`/admin/quizzes/${ref}`)
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi import')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; timeLimitSeconds?: number }) =>
      quizApi.createEmpty(data),
    onSuccess: (response: any) => {
      lumotoast.success('Đã tạo quiz mới!')
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      const ref = response.data?.slug || response.data?.id
      navigate(`/admin/quizzes/${ref}`)
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi tạo')
    },
  })

  const quizzes: QuizItem[] = quizData?.content ?? []
  const totalPages = quizData?.totalPages ?? 1

  const quizRefFor = (quiz: QuizItem) => quiz.slug || quiz.id

  const handleDelete = (quiz: QuizItem) => {
    setConfirmDialog({
      open: true, title: `Xóa quiz "${quiz.title}"?`,
      body: 'Hành động không thể hoàn tác. Tất cả câu hỏi và lịch sử làm bài sẽ bị xóa.',
      onConfirm: () => deleteMutation.mutate(quiz.id),
    })
  }

  const tabs: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'explore', label: 'Khám phá', icon: <Globe className="h-3.5 w-3.5" /> },
    { id: 'published', label: 'Đã duyệt', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    { id: 'drafts', label: 'Nháp', icon: <FileQuestion className="h-3.5 w-3.5" /> },
    { id: 'all', label: 'Tất cả', icon: <Search className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Quiz</h1>
          <p className="mt-0.5 text-sm text-gray-500">Tạo và quản lý quiz cho người dùng luyện tập</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50">
            <Plus className="h-4 w-4" /> Tạo Quiz
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/40 p-1">
        {tabs.map((tab) => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(0) }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-500 hover:text-gray-600',
            )}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/60 border border-gray-200" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && quizzes.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center">
          <FileQuestion className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-sm font-semibold text-gray-600">Chưa có quiz nào</p>
          <p className="mt-1 text-xs text-gray-400">Tạo quiz đầu tiên hoặc import từ CSV</p>
        </div>
      )}

      {/* Quiz List */}
      {!isLoading && quizzes.length > 0 && (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onView={() => navigate(`/admin/quizzes/${quizRefFor(quiz)}`)}
              onDelete={() => handleDelete(quiz)}
              onApprove={() => approveMutation.mutate(quiz.id)}
              onPublish={() => publishMutation.mutate(quiz.id)}
              onTogglePublic={() => togglePublicMutation.mutate(quiz.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className={cn('rounded-lg px-4 py-2 text-sm font-semibold', page === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100')}>
            Trước
          </button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className={cn('rounded-lg px-4 py-2 text-sm font-semibold', page >= totalPages - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100')}>
            Sau
          </button>
        </div>
      )}

      {/* Dialogs */}
      <ImportDialog open={showImport} onClose={() => setShowImport(false)} onImport={(d) => importMutation.mutate(d)} />
      <CreateQuizDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={(d) => createMutation.mutate(d)} />

      {/* Confirm Dialog - always rendered, visibility controlled by open prop */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        body={confirmDialog.body}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm()
          setConfirmDialog((p) => ({ ...p, open: false }))
        }}
        onCancel={() => setConfirmDialog((p) => ({ ...p, open: false }))}
      />
    </div>
  )
}
