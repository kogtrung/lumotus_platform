import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  X,
  Check,
  Pencil,
  FileQuestion,
  Users,
  Globe,
  EyeOff,
  Plus,
  Trash2,
  Lock,
  Loader2,
} from 'lucide-react'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'
import { lumotoast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

// ─── StatBox Component ────────────────────────────────────────────────────────
function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="rounded-lg bg-white p-3 text-center">
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminQuizEditPage() {
  const { quizRef } = useParams<{ quizRef: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ref = quizRef || ''

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [quizStatus, setQuizStatus] = useState<string>('')

  // Question editing state
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [editForm, setEditForm] = useState({
    questionText: '',
    correctAnswer: '',
    options: ['', '', '', ''],
  })

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    body?: string
    onConfirm: (() => void) | null
  }>({ open: false, title: '', body: '', onConfirm: null })

  // Fetch quiz data
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['admin', 'quiz', ref],
    queryFn: () => quizApi.getAdminQuiz(ref).then((r) => r.data),
    enabled: !!ref,
  })

  // Track quiz id to detect when quiz changes completely
  const prevQuizIdRef = useRef<string | null>(null)

  // Sync form when quiz loads - only on first load or when quiz changes
  useEffect(() => {
    if (!quiz) return

    const currentQuizId = quiz.id || null
    const isNewQuiz = currentQuizId !== prevQuizIdRef.current

    if (isNewQuiz) {
      prevQuizIdRef.current = currentQuizId
      setTitle(quiz.title || '')
      setDescription(quiz.description || '')
      setTimeLimit(quiz.timeLimitSeconds)
      setIsPublic(quiz.isPublic || false)
      setQuizStatus(quiz.status || '')
      setEditQuestionId(null)
      setAddingQuestion(false)
    }
  }, [quiz?.id])

  // Mutations
  const updateQuizMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string; timeLimitSeconds?: number }) =>
      quizApi.updateAdminQuiz(ref, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      lumotoast.success('Đã lưu thay đổi quiz')
    },
    onError: (err: any) => {
      lumotoast.error(err?.message || 'Lỗi khi lưu')
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: (data: {
      questionId: string
      questionText: string
      correctAnswer: string
      options: string[]
      questionType: string
    }) =>
      quizApi.updateAdminQuestion(ref, data.questionId, {
        questionText: data.questionText,
        correctAnswer: data.correctAnswer,
        options: data.options,
        questionType: data.questionType,
      }),
    onSuccess: () => {
      // Clear edit state FIRST, then invalidate queries
      setEditQuestionId(null)
      setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
      // Use setTimeout to ensure DOM updates before refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      }, 0)
      lumotoast.success('Đã cập nhật câu hỏi')
    },
    onError: (err: any) => {
      lumotoast.error(err?.message || 'Lỗi khi cập nhật câu hỏi')
    },
  })

  const addQuestionMutation = useMutation({
    mutationFn: (data: {
      questionText: string
      correctAnswer: string
      options: string[]
      questionType: string
    }) => quizApi.addAdminQuestion(ref, data),
    onSuccess: () => {
      // Clear form state FIRST, then invalidate queries
      setAddingQuestion(false)
      setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
      // Use setTimeout to ensure DOM updates before refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      }, 0)
      lumotoast.success('Đã thêm câu hỏi')
    },
    onError: (err: any) => {
      lumotoast.error(err?.message || 'Lỗi khi thêm câu hỏi')
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => quizApi.deleteAdminQuestion(ref, questionId),
    onSuccess: () => {
      // Clear edit state if deleting the question being edited
      if (editQuestionId) {
        setEditQuestionId(null)
        setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
      }
      // Use setTimeout to ensure DOM updates before refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] })
      }, 0)
      lumotoast.success('Đã xóa câu hỏi')
    },
    onError: (err: any) => {
      lumotoast.error(err?.message || 'Lỗi khi xóa câu hỏi')
    },
  })

  // Handlers
  const handleSaveQuiz = useCallback(() => {
    if (!title.trim()) {
      lumotoast.error('Tiêu đề không được để trống')
      return
    }
    updateQuizMutation.mutate({
      title,
      description,
      timeLimitSeconds: timeLimit ?? undefined,
    })
  }, [title, description, timeLimit, updateQuizMutation])

  const handleTogglePublic = useCallback(() => {
    if (quizStatus !== 'APPROVED') {
      lumotoast.error('Quiz phải được duyệt trước khi đưa lên Khám phá')
      return
    }
    const newIsPublic = !isPublic
    const action = newIsPublic ? 'PUBLISH' : 'UNPUBLISH'
    setIsPublic(newIsPublic)
    if (quiz) {
      quizApi
        .moderate({ quizId: quiz.id, action })
        .then(() => {
          lumotoast.success(newIsPublic ? 'Đã đưa lên Khám phá' : 'Đã gỡ khỏi Khám phá')
          queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
        })
        .catch(() => {
          setIsPublic(!newIsPublic)
          lumotoast.error('Lỗi khi thay đổi trạng thái')
        })
    }
  }, [isPublic, quiz, quizStatus, queryClient, ref])

  const handleApprove = useCallback(() => {
    if (quiz) {
      quizApi
        .moderate({ quizId: quiz.id, action: 'APPROVE' })
        .then(() => {
          setQuizStatus('APPROVED')
          queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
          lumotoast.success('Đã duyệt quiz')
        })
        .catch(() => lumotoast.error('Lỗi khi duyệt quiz'))
    }
  }, [quiz, queryClient, ref])

  const startEditQuestion = useCallback((q: any) => {
    const options = q.options || []
    const correctAnswer = q.correctAnswer || ''

    let correctLetter = correctAnswer
    const idx = options.findIndex(
      (opt: string) => opt.toLowerCase() === correctAnswer.toLowerCase()
    )
    if (idx >= 0) {
      correctLetter = String.fromCharCode(65 + idx)
    }

    setEditQuestionId(q.id)
    setEditForm({
      questionText: q.questionText,
      correctAnswer: correctLetter,
      options: [...options, '', '', '', ''].slice(0, 4),
    })
  }, [])

  const handleSaveQuestion = useCallback((questionId: string) => {
    const validOptions = editForm.options.filter((o) => o.trim() !== '')
    if (
      !editForm.questionText.trim() ||
      !editForm.correctAnswer.trim() ||
      validOptions.length < 2
    ) {
      lumotoast.error('Cần ít nhất 2 đáp án và đáp án đúng')
      return
    }
    updateQuestionMutation.mutate({
      questionId,
      questionText: editForm.questionText,
      correctAnswer: editForm.correctAnswer,
      options: validOptions,
      questionType: 'MULTIPLE_CHOICE',
    })
  }, [editForm, updateQuestionMutation])

  const cancelEditQuestion = useCallback(() => {
    setEditQuestionId(null)
    setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
  }, [])

  const startAddQuestion = useCallback(() => {
    setAddingQuestion(true)
    setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
  }, [])

  const handleSaveNewQuestion = useCallback(() => {
    const validOptions = editForm.options.filter((o) => o.trim() !== '')
    if (
      !editForm.questionText.trim() ||
      !editForm.correctAnswer.trim() ||
      validOptions.length < 2
    ) {
      lumotoast.error('Cần ít nhất 2 đáp án và đáp án đúng')
      return
    }
    addQuestionMutation.mutate({
      questionText: editForm.questionText,
      correctAnswer: editForm.correctAnswer,
      options: validOptions,
      questionType: 'MULTIPLE_CHOICE',
    })
  }, [editForm, addQuestionMutation])

  const pendingDeleteIdRef = useRef<string | null>(null)

  const handleDeleteQuestion = useCallback((questionId: string) => {
    pendingDeleteIdRef.current = questionId
    setConfirmDialog({
      open: true,
      title: 'Xóa câu hỏi này?',
      body: 'Hành động không thể hoàn tác.',
      onConfirm: () => {
        if (pendingDeleteIdRef.current) {
          deleteQuestionMutation.mutate(pendingDeleteIdRef.current)
          pendingDeleteIdRef.current = null
        }
      },
    })
  }, [deleteQuestionMutation])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EC4899]" />
      </div>
    )
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Không tìm thấy quiz hoặc có lỗi xảy ra</p>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="mt-4 text-[#EC4899] hover:underline"
        >
          Quay lại
        </button>
      </div>
    )
  }

  const questionList = quiz.questions || []
  const isPending =
    updateQuizMutation.isPending ||
    updateQuestionMutation.isPending ||
    addQuestionMutation.isPending

  // Locked state when public
  const isLocked = isPublic

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Chỉnh sửa Quiz
            </h1>
            <p className="mt-1 text-sm text-gray-500">Quiz: {quiz.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Lock badge when public */}
          {isLocked && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-500">
              <Lock className="h-4 w-4" />
              Đang khóa
            </div>
          )}

          {/* Approve button - only show when not approved */}
          {quizStatus !== 'APPROVED' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-600"
            >
              <Check className="h-4 w-4" />
              Duyệt
            </button>
          )}

          {/* Add question button */}
          <button
            onClick={startAddQuestion}
            disabled={isLocked}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              isLocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
            )}
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </button>

          {/* Toggle public button - only show when approved */}
          {quizStatus === 'APPROVED' && (
            <button
              onClick={handleTogglePublic}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                isPublic
                  ? 'bg-[#EC4899]/20 text-[#EC4899] hover:bg-[#EC4899]/30'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-600'
              )}
            >
              {isPublic ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {isPublic ? 'Gỡ khỏi Khám phá' : 'Đưa lên Khám phá'}
            </button>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveQuiz}
            disabled={isLocked || isPending}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              isLocked || isPending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#EC4899] text-white hover:bg-[#EC4899]/80'
            )}
          >
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="rounded-xl border border-gray-200 bg-white/60 p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin Quiz</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLocked}
              className={cn(
                'w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none',
                isLocked ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Thời gian mỗi câu (giây)
            </label>
            <input
              type="number"
              value={timeLimit ?? ''}
              onChange={(e) =>
                setTimeLimit(e.target.value ? parseInt(e.target.value) : null)
              }
              disabled={isLocked}
              placeholder="30"
              min={5}
              max={300}
              className={cn(
                'w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none',
                isLocked ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'
              )}
            />
            <p className="mt-1 text-xs text-gray-400">
              Thời gian trả lời cho mỗi câu hỏi (5-300 giây)
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLocked}
              rows={2}
              className={cn(
                'w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none',
                isLocked ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'
              )}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox
            label="Câu hỏi"
            value={questionList.length}
            color="#EC4899"
          />
          <StatBox
            label="Lượt chơi"
            value={quiz.attemptCount || 0}
            color="#A78BFA"
          />
          <StatBox
            label="Điểm TB"
            value={
              quiz.avgScore != null
                ? `${Math.round(quiz.avgScore * 100)}%`
                : 'N/A'
            }
            color="#10B981"
          />
          <StatBox
            label="Trạng thái"
            value={
              quizStatus === 'APPROVED'
                ? 'Đã duyệt'
                : quizStatus === 'PENDING'
                  ? 'Chờ duyệt'
                  : quizStatus === 'DRAFT'
                    ? 'Nháp'
                    : quizStatus
            }
            color={quizStatus === 'APPROVED' ? '#10B981' : '#F59E0B'}
          />
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
          {quiz.ownerUsername && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {quiz.ownerUsername}
            </span>
          )}
          {quiz.deckTitle && (
            <span className="flex items-center gap-1.5">
              <FileQuestion className="h-4 w-4" />
              {quiz.deckTitle}
            </span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-xl border border-gray-200 bg-white/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Câu hỏi ({questionList.length})
          </h2>
          <button
            onClick={startAddQuestion}
            disabled={isLocked}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
              isLocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
            )}
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </button>
        </div>

        {/* Add Question Form */}
        {addingQuestion && (
          <div className="mb-6 rounded-lg border border-[#10B981]/50 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#10B981]">
                Thêm câu hỏi mới
              </span>
              <button
                onClick={() => {
                  setAddingQuestion(false)
                  cancelEditQuestion()
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Câu hỏi
                </label>
                <textarea
                  value={editForm.questionText}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, questionText: e.target.value }))
                  }
                  rows={2}
                  placeholder="Nhập câu hỏi..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Đáp án đúng (A, B, C hoặc D)
                </label>
                <input
                  type="text"
                  value={editForm.correctAnswer}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      correctAnswer: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="A"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Các đáp án (ít nhất 2)
                </label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {editForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex h-10 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-semibold text-[#EC4899]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...editForm.options]
                          newOptions[i] = e.target.value
                          setEditForm((f) => ({ ...f, options: newOptions }))
                        }}
                        placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNewQuestion}
                  disabled={addQuestionMutation.isPending}
                  className="flex items-center gap-1 rounded-lg bg-[#10B981] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10B981]/80 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Thêm câu hỏi
                </button>
                <button
                  onClick={() => {
                    setAddingQuestion(false)
                    cancelEditQuestion()
                  }}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200/80"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {questionList.length === 0 && !addingQuestion ? (
          <div className="py-8 text-center text-gray-500">
            <FileQuestion className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Quiz này chưa có câu hỏi nào</p>
            <button
              onClick={startAddQuestion}
              disabled={isLocked}
              className={cn(
                'mx-auto mt-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                isLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
              )}
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {questionList.map((q: any, index: number) => (
              <div
                key={q.id || `q-${index}`}
                className={cn(
                  'group relative rounded-lg border p-3 transition-all',
                  editQuestionId === q.id
                    ? 'border-[#EC4899]/50 bg-gray-50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-[#EC4899]/30'
                )}
              >
                {editQuestionId === q.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#EC4899]">
                        Câu {index + 1}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSaveQuestion(q.id)}
                          disabled={updateQuestionMutation.isPending}
                          className="flex items-center gap-1 rounded-md bg-[#10B981] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#10B981]/80 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Lưu
                        </button>
                        <button
                          onClick={cancelEditQuestion}
                          className="flex items-center gap-1 rounded-md bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200/80"
                        >
                          <X className="h-3 w-3" />
                          Hủy
                        </button>
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={editForm.questionText}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            questionText: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Câu hỏi..."
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editForm.correctAnswer}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            correctAnswer: e.target.value,
                          }))
                        }
                        placeholder="Đáp án đúng"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {editForm.options.map((opt: string, i: number) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...editForm.options]
                            newOptions[i] = e.target.value
                            setEditForm((f) => ({ ...f, options: newOptions }))
                          }}
                          placeholder={`Đáp án ${i + 1}`}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-[10px] font-bold text-[#EC4899]">
                            {index + 1}
                          </span>
                          <span className="truncate text-[10px] text-gray-400">
                            {q.questionType}
                          </span>
                        </div>
                        <p className="mb-1.5 line-clamp-2 text-xs font-medium text-gray-900">
                          {q.questionText}
                        </p>
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1">
                            {q.options.map((opt: string, i: number) => {
                              const isCorrect = opt === q.correctAnswer
                              return (
                                <div
                                  key={`opt-${i}`}
                                  className={cn(
                                    'flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px]',
                                    isCorrect
                                      ? 'bg-[#10B981]/20 text-[#10B981] font-medium'
                                      : 'bg-white text-gray-500'
                                  )}
                                >
                                  <span className="shrink-0 font-semibold opacity-60">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span className="truncate">{opt}</span>
                                  {isCorrect && (
                                    <Check className="ml-auto h-3 w-3 shrink-0" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action buttons - hidden when locked */}
                      <div className={cn(
                        'flex shrink-0 flex-col gap-1 transition-opacity',
                        isLocked ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'
                      )}>
                        <button
                          onClick={() => startEditQuestion(q)}
                          disabled={isLocked}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all',
                            isLocked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                          )}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          disabled={isLocked}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all',
                            isLocked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        body={confirmDialog.body}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        onConfirm={() => {
          if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm()
          }
          setConfirmDialog((p) => ({ ...p, open: false }))
        }}
        onCancel={() => setConfirmDialog((p) => ({ ...p, open: false }))}
      />
    </div>
  )
}
