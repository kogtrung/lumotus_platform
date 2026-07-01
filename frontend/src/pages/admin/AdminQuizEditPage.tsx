import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface QuestionEdit {
  id: string
  questionType: string
  questionText: string
  correctAnswer: string
  options: string[]
  sortOrder: number
}

export default function AdminQuizEditPage() {
  const { quizRef } = useParams<{ quizRef: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ref = quizRef || ''

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [questions, setQuestions] = useState<QuestionEdit[]>([])
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [editForm, setEditForm] = useState({
    questionText: '',
    correctAnswer: '',
    options: ['', '', '', ''],
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch quiz detail
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['admin', 'quiz', ref],
    queryFn: () => quizApi.getAdminQuiz(ref).then(r => r.data),
    enabled: !!ref,
  })

  // Initialize form when quiz loads (safe in useEffect, not during render)
  useEffect(() => {
    if (quiz && !isInitialized) {
      setTitle(quiz.title || '')
      setDescription(quiz.description || '')
      setTimeLimit(quiz.timeLimitSeconds)
      setIsPublic(quiz.isPublic || false)
      setQuestions((quiz.questions || []).map((q: any) => ({
        id: q.id,
        questionType: q.questionType,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        options: q.options || [],
        sortOrder: q.sortOrder,
      })))
      setIsInitialized(true)
    }
  }, [quiz, isInitialized])

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string; timeLimitSeconds?: number }) => {
      return quizApi.updateAdminQuiz(ref, data)
    },
    onSuccess: () => {
      toast.success('Đã lưu thay đổi quiz')
      queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi lưu')
    },
  })

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: (data: { questionId: string; questionText: string; correctAnswer: string; options: string[]; questionType: string }) => {
      return quizApi.updateAdminQuestion(ref, data.questionId, {
        questionText: data.questionText,
        correctAnswer: data.correctAnswer,
        options: data.options,
        questionType: data.questionType,
      })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật câu hỏi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
      setEditingQuestion(null)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi cập nhật câu hỏi')
    },
  })

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: (data: { questionText: string; correctAnswer: string; options: string[]; questionType: string }) => {
      return quizApi.addAdminQuestion(ref, data)
    },
    onSuccess: () => {
      toast.success('Đã thêm câu hỏi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
      setAddingQuestion(false)
      setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi thêm câu hỏi')
    },
  })

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => {
      return quizApi.deleteAdminQuestion(ref, questionId)
    },
    onSuccess: () => {
      toast.success('Đã xóa câu hỏi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', ref] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi xóa câu hỏi')
    },
  })

  const handleSaveQuiz = () => {
    updateQuizMutation.mutate({
      title,
      description,
      timeLimitSeconds: timeLimit ?? undefined,
    })
  }

  const handleTogglePublic = () => {
    const newIsPublic = !isPublic
    setIsPublic(newIsPublic)
    if (quiz) {
      quizApi.updateAdminQuiz(ref, { title, description, timeLimitSeconds: timeLimit ?? undefined })
        .then(() => toast.success(newIsPublic ? 'Đã đưa lên Khám phá' : 'Đã gỡ khỏi Khám phá'))
        .catch(() => toast.error('Lỗi'))
    }
  }

  const startEditQuestion = (q: QuestionEdit) => {
    setEditingQuestion(q.id)
    setEditForm({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: [...(q.options || []), '', '', '', ''].slice(0, 4),
    })
  }

  const handleSaveQuestion = (questionId: string) => {
    const validOptions = editForm.options.filter(o => o.trim() !== '')
    if (!editForm.questionText.trim() || !editForm.correctAnswer.trim() || validOptions.length < 2) {
      toast.error('Cần ít nhất 2 đáp án và đáp án đúng')
      return
    }
    updateQuestionMutation.mutate({
      questionId,
      questionText: editForm.questionText,
      correctAnswer: editForm.correctAnswer,
      options: validOptions,
      questionType: 'MULTIPLE_CHOICE',
    })
  }

  const cancelEditQuestion = () => {
    setEditingQuestion(null)
    setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
  }

  const startAddQuestion = () => {
    setAddingQuestion(true)
    setEditForm({ questionText: '', correctAnswer: '', options: ['', '', '', ''] })
  }

  const handleSaveNewQuestion = () => {
    const validOptions = editForm.options.filter(o => o.trim() !== '')
    if (!editForm.questionText.trim() || !editForm.correctAnswer.trim() || validOptions.length < 2) {
      toast.error('Cần ít nhất 2 đáp án và đáp án đúng')
      return
    }
    addQuestionMutation.mutate({
      questionText: editForm.questionText,
      correctAnswer: editForm.correctAnswer,
      options: validOptions,
      questionType: 'MULTIPLE_CHOICE',
    })
  }

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('Xóa câu hỏi này?')) {
      deleteQuestionMutation.mutate(questionId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC4899]" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-12">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Chỉnh sửa Quiz</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quiz: {quiz.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={startAddQuestion}
            className="flex items-center gap-2 rounded-lg bg-[#10B981]/20 px-4 py-2 text-sm font-semibold text-[#10B981] transition-all hover:bg-[#10B981]/30"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </button>
          <button
            onClick={handleTogglePublic}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              isPublic
                ? 'bg-[#EC4899]/20 text-[#EC4899] hover:bg-[#EC4899]/30'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-600',
            )}
          >
            {isPublic ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {isPublic ? 'Gỡ khỏi Khám phá' : 'Đưa lên Khám phá'}
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={updateQuizMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="rounded-xl border border-gray-200 bg-white/60 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin Quiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Thời gian (giây)</label>
            <input
              type="number"
              value={timeLimit ?? ''}
              onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Không giới hạn"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Câu hỏi" value={questions.length} color="#EC4899" />
          <StatBox label="Lượt chơi" value={quiz.attemptCount || 0} color="#A78BFA" />
          <StatBox
            label="Điểm TB"
            value={quiz.avgScore != null ? `${Math.round(quiz.avgScore * 100)}%` : 'N/A'}
            color="#10B981"
          />
          <StatBox
            label="Trạng thái"
            value={quiz.status === 'APPROVED' ? 'Đã duyệt' : quiz.status === 'PENDING' ? 'Chờ duyệt' : quiz.status}
            color={quiz.status === 'APPROVED' ? '#10B981' : '#F59E0B'}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Câu hỏi ({questions.length})
          </h2>
          <button
            onClick={startAddQuestion}
            className="flex items-center gap-2 rounded-lg bg-[#10B981]/20 px-3 py-1.5 text-sm font-semibold text-[#10B981] hover:bg-[#10B981]/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </button>
        </div>

        {/* Add Question Form */}
        {addingQuestion && (
          <div className="mb-6 rounded-lg border border-[#10B981]/50 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[#10B981]">Thêm câu hỏi mới</span>
              <button
                onClick={() => { setAddingQuestion(false); cancelEditQuestion(); }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Câu hỏi</label>
                <textarea
                  value={editForm.questionText}
                  onChange={(e) => setEditForm(f => ({ ...f, questionText: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Đáp án đúng (A, B, C hoặc D)</label>
                <input
                  type="text"
                  value={editForm.correctAnswer}
                  onChange={(e) => setEditForm(f => ({ ...f, correctAnswer: e.target.value.toUpperCase() }))}
                  placeholder="A"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Các đáp án (ít nhất 2)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                          setEditForm(f => ({ ...f, options: newOptions }))
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
                  onClick={() => { setAddingQuestion(false); cancelEditQuestion(); }}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-[#B8ACC] hover:bg-gray-200/80"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {questions.length === 0 && !addingQuestion ? (
          <div className="text-center py-8 text-gray-500">
            <FileQuestion className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Quiz này chưa có câu hỏi nào</p>
            <button
              onClick={startAddQuestion}
              className="mt-3 flex items-center gap-2 rounded-lg bg-[#10B981]/20 px-4 py-2 text-sm font-semibold text-[#10B981] mx-auto hover:bg-[#10B981]/30"
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={cn(
                  'rounded-lg border p-4 transition-all',
                  editingQuestion === q.id
                    ? 'border-[#EC4899]/50 bg-gray-50'
                    : 'border-gray-200 bg-gray-50/50',
                )}
              >
                {editingQuestion === q.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#EC4899]">Câu {index + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveQuestion(q.id)}
                          disabled={updateQuestionMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-[#10B981] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#10B981]/80"
                        >
                          <Check className="h-4 w-4" />
                          Lưu
                        </button>
                        <button
                          onClick={cancelEditQuestion}
                          className="flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-[#B8ACC] hover:bg-gray-200/80"
                        >
                          <X className="h-4 w-4" />
                          Hủy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Câu hỏi</label>
                      <textarea
                        value={editForm.questionText}
                        onChange={(e) => setEditForm(f => ({ ...f, questionText: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Đáp án đúng</label>
                      <input
                        type="text"
                        value={editForm.correctAnswer}
                        onChange={(e) => setEditForm(f => ({ ...f, correctAnswer: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Các đáp án (ít nhất 2)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {editForm.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...editForm.options]
                                newOptions[i] = e.target.value
                                setEditForm(f => ({ ...f, options: newOptions }))
                              }}
                              placeholder={`Đáp án ${i + 1}`}
                              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-[#EC4899]/50 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center rounded-full bg-[#EC4899]/20 h-6 w-6 text-xs font-bold text-[#EC4899]">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-500">{q.questionType}</span>
                        </div>
                        <p className="text-gray-900 font-medium">{q.questionText}</p>
                        <div className="mt-3 space-y-1.5">
                          {(q.options || []).map((opt, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
                                opt === q.correctAnswer
                                  ? 'bg-[#10B981]/20 text-[#10B981]'
                                  : 'bg-white text-gray-600',
                              )}
                            >
                              {opt === q.correctAnswer && <Check className="h-4 w-4" />}
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditQuestion(q)}
                          className="flex items-center gap-1.5 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#EF4444]/20 px-3 py-1.5 text-sm font-semibold text-[#EF4444] transition-all hover:bg-[#EF4444]/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
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
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
