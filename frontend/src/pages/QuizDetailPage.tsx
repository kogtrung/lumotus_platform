import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Check, Clock, Edit3, Play, Plus, Send, Trash2, Trophy, X, GripVertical,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quizApi, QuizQuestion } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export default function QuizDetailPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTimeLimit, setEditTimeLimit] = useState<number | null>(null)
  const [editQuestionCount, setEditQuestionCount] = useState(10)

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [editQText, setEditQText] = useState('')
  const [editQOptions, setEditQOptions] = useState<string[]>([])
  const [editQCorrect, setEditQCorrect] = useState('')
  const [editQType, setEditQType] = useState('MULTIPLE_CHOICE')

  const detailQuery = useQuery({
    queryKey: ['quiz', 'me', quizId],
    queryFn: () => quizApi.getMy(quizId!).then((r) => r.data),
    enabled: !!quizId,
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      quizApi.update(quizId!, {
        title: editTitle,
        description: editDescription || undefined,
        timeLimitSeconds: editTimeLimit != null ? editTimeLimit * 60 : undefined,
        questionCount: editQuestionCount,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật quiz!')
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['quiz', 'me', quizId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => quizApi.delete(quizId!),
    onSuccess: () => {
      toast.success('Đã xóa quiz')
      navigate('/quiz')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi xóa')
    },
  })

  const submitReviewMutation = useMutation({
    mutationFn: () => quizApi.submitForReview({ quizId: quizId! }),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu duyệt quiz!')
      qc.invalidateQueries({ queryKey: ['quiz', 'me', quizId] })
      qc.invalidateQueries({ queryKey: ['quizzes', 'mine'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi duyệt')
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: { questionText: string; correctAnswer: string; options: string[]; questionType: string } }) =>
      quizApi.updateQuestion(quizId!, questionId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật câu hỏi!')
      setEditingQuestion(null)
      qc.invalidateQueries({ queryKey: ['quiz', 'me', quizId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật câu hỏi')
    },
  })

  const quiz = detailQuery.data
  const canEdit = quiz && (quiz.status === 'DRAFT' || quiz.status === 'REJECTED') && !quiz.isImmutable
  const canSubmit = quiz && (quiz.status === 'DRAFT' || quiz.status === 'REJECTED') && quiz.quizType !== 'IMPORTED'
  const canDelete = quiz && !quiz.isImmutable

  const startEdit = () => {
    if (!quiz) return
    setEditTitle(quiz.title)
    setEditDescription(quiz.description ?? '')
    setEditTimeLimit(quiz.timeLimitSeconds != null ? Math.round(quiz.timeLimitSeconds / 60) : null)
    setEditQuestionCount(quiz.questionCount)
    setEditing(true)
  }

  const startEditQuestion = (q: QuizQuestion) => {
    setEditQText(q.questionText)
    setEditQOptions(q.options || [])
    setEditQCorrect(q.correctAnswer)
    setEditQType(q.questionType)
    setEditingQuestion(q)
  }

  const saveQuestionEdit = () => {
    if (!editingQuestion) return
    updateQuestionMutation.mutate({
      questionId: editingQuestion.id,
      data: {
        questionText: editQText,
        correctAnswer: editQCorrect,
        options: editQOptions,
        questionType: editQType,
      },
    })
  }

  const cancelQuestionEdit = () => {
    setEditingQuestion(null)
    setEditQText('')
    setEditQOptions([])
    setEditQCorrect('')
    setEditQType('MULTIPLE_CHOICE')
  }

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-[#3D3348]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#2D2538]" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#8B7A9E]">Không tìm thấy quiz</p>
        <Button className="mt-4" onClick={() => navigate('/quiz')}>Quay lại</Button>
      </div>
    )
  }

  const score = quiz.avgScore != null ? Math.round(quiz.avgScore * 100) : null

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={() => navigate('/quiz')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#F5F0FA] truncate">{quiz.title}</h1>
            <StatusBadge status={quiz.status} />
          </div>
          {quiz.deckTitle && (
            <p className="mt-1 text-sm text-[#8B7A9E]">
              Từ deck: <span className="font-semibold text-[#EC4899]">{quiz.deckTitle}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Rejection note */}
        {quiz.status === 'REJECTED' && quiz.rejectionNote && (
          <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] p-4">
            <p className="text-sm font-semibold text-[#EF4444]">Lý do từ chối</p>
            <p className="mt-1 text-sm text-[#C4B8D9]">{quiz.rejectionNote}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Câu hỏi" value={quiz.questionCount} color="#EC4899" />
          <StatCard label="Lượt chơi" value={quiz.attemptCount} color="#A78BFA" />
          {score != null && <StatCard label="Điểm TB" value={`${score}%`} color="#10B981" />}
          {quiz.timeLimitSeconds != null && (
            <StatCard label="Thời gian" value={`${quiz.timeLimitSeconds / 60}p`} color="#F97316" />
          )}
        </div>

        {/* Description */}
        {quiz.description && !editing && (
          <div className="rounded-xl border border-[#3D3348] bg-[#252030]/80 p-4">
            <p className="text-sm text-[#C4B8D9]">{quiz.description}</p>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="rounded-2xl border border-[#EC4899]/40 bg-[#252030]/90 p-5 space-y-4">
            <h3 className="font-bold text-[#F5F0FA] flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Chỉnh sửa Quiz
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Tiêu đề</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-[#3D3348] bg-[#1A1520] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Mô tả</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[#3D3348] bg-[#1A1520] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Thời gian (phút)</label>
              <div className="flex flex-wrap gap-2">
                {[{ v: null, l: 'Không' }, { v: 5, l: '5p' }, { v: 10, l: '10p' }, { v: 15, l: '15p' }, { v: 20, l: '20p' }].map(({ v, l }) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setEditTimeLimit(v)}
                    className={cn(
                      'rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-all',
                      editTimeLimit === v
                        ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                        : 'border-[#3D3348] text-[#8B7A9E] hover:border-[#4A4060]',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Hủy</Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#EC4899]/40 bg-[#1A1520] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[#F5F0FA] flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Chỉnh sửa câu hỏi
                </h3>
                <button onClick={cancelQuestionEdit} className="text-[#8B7A9E] hover:text-[#F5F0FA]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Loại câu hỏi</label>
                  <select
                    value={editQType}
                    onChange={(e) => setEditQType(e.target.value)}
                    className="w-full rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
                  >
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="TRUE_FALSE">Đúng/Sai</option>
                    <option value="FILL_IN">Điền từ</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Câu hỏi</label>
                  <textarea
                    value={editQText}
                    onChange={(e) => setEditQText(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
                  />
                </div>

                {editQType !== 'FILL_IN' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Các lựa chọn (mỗi dòng 1)</label>
                    <textarea
                      value={editQOptions.join('\n')}
                      onChange={(e) => setEditQOptions(e.target.value.split('\n').filter(o => o.trim()))}
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                      className="w-full rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#8B7A9E]">Đáp án đúng</label>
                  <input
                    value={editQCorrect}
                    onChange={(e) => setEditQCorrect(e.target.value)}
                    className="w-full rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-2.5 text-sm text-[#F5F0FA] outline-none transition-all focus:border-[#EC4899]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={cancelQuestionEdit} className="flex-1">Hủy</Button>
                  <Button
                    onClick={saveQuestionEdit}
                    disabled={updateQuestionMutation.isPending || !editQText.trim() || !editQCorrect.trim()}
                    className="flex-1"
                  >
                    {updateQuestionMutation.isPending ? 'Đang lưu...' : 'Lưu câu hỏi'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons - at top for better management */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate(`/quiz/play/${quiz.id}`)}
            disabled={quiz.status === 'PENDING'}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Luyện tập
          </Button>

          {quiz.status === 'APPROVED' && (
            <Button
              variant="outline"
              onClick={() => navigate(`/quiz/leaderboard/${quiz.id}`)}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Bảng xếp hạng
            </Button>
          )}

          {canSubmit && (
            <Button
              variant="outline"
              onClick={() => submitReviewMutation.mutate()}
              disabled={submitReviewMutation.isPending}
              className="gap-2 border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/10"
            >
              <Send className="h-4 w-4" />
              {submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt'}
            </Button>
          )}

          {canEdit && !editing && (
            <Button
              variant="outline"
              onClick={startEdit}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Xóa quiz này? Hành động không thể hoàn tác.')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="gap-2 border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          )}
        </div>

        {/* Questions list - Grid layout */}
        {quiz.questions && quiz.questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F0FA]">
                Danh sách câu hỏi ({quiz.questions.length})
              </h3>
              {canEdit && !editing && (
                <span className="text-xs text-[#8B7A9E]">Nhấn vào câu hỏi để chỉnh sửa</span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quiz.questions.map((q, i) => (
                <div
                  key={q.id}
                  onClick={() => canEdit && !editing && startEditQuestion(q)}
                  className={cn(
                    'rounded-xl border bg-[#252030]/80 p-4 transition-all cursor-pointer',
                    canEdit && !editing ? 'border-[#3D3348] hover:border-[#EC4899]/50 hover:bg-[#2D2538]/80' : 'border-[#3D3348]',
                  )}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#F5F0FA] flex-1 line-clamp-2">{q.questionText}</p>
                    {canEdit && !editing && (
                      <Edit3 className="h-3.5 w-3.5 shrink-0 text-[#8B7A9E] opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-bold',
                      q.questionType === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' :
                      q.questionType === 'TRUE_FALSE' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400',
                    )}>
                      {q.questionType === 'MULTIPLE_CHOICE' ? 'MCQ' :
                       q.questionType === 'TRUE_FALSE' ? 'T/F' : 'Điền'}
                    </span>
                    {q.options && q.options.length > 0 && (
                      <span className="rounded bg-[#3D3348] px-2 py-0.5 text-[10px] font-semibold text-[#8B7A9E]">
                        {q.options.length} lựa chọn
                      </span>
                    )}
                    <span className="ml-auto rounded bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                      {q.correctAnswer.length > 20 ? q.correctAnswer.slice(0, 20) + '...' : q.correctAnswer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-500/15 text-slate-400',
    PENDING: 'bg-yellow-500/15 text-yellow-400',
    APPROVED: 'bg-emerald-500/15 text-emerald-400',
    REJECTED: 'bg-red-500/15 text-red-400',
  }
  const labels: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', styles[status] ?? '')}>
      {status === 'PENDING' && <Clock className="h-3 w-3" />}
      {labels[status] ?? status}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-[#3D3348] bg-[#252030]/80 p-3 text-center">
      <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
      <p className="text-xs text-[#8B7A9E]">{label}</p>
    </div>
  )
}
