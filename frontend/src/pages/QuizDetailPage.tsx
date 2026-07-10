import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Trophy, Users, Target, Timer, TrendingUp,
  CheckCircle, XCircle,
} from 'lucide-react'
import ExitConfirmDialog from '@/components/ui/ExitConfirmDialog'
import { quizApi, type QuizQuestion } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export default function QuizDetailPage() {
  const { quizRef = '' } = useParams<{ quizRef: string }>()
  const navigate = useNavigate()
  const [sessionConflict, setSessionConflict] = useState<{ open: boolean; newRef?: string; oldAttemptId?: string }>({ open: false })

  // Load quiz detail
  const detailQuery = useQuery({
    queryKey: ['quiz', 'explore', quizRef],
    queryFn: () => quizApi.getExplore(quizRef).then((r) => r.data),
    enabled: !!quizRef,
    retry: 2,
  })

  // Active sessions check
  const { data: activeSessions } = useQuery({
    queryKey: ['quiz', 'active-sessions'],
    queryFn: () => quizApi.getActiveSessions().then((r) => r.data),
    staleTime: 30_000,
  })

  const quiz = detailQuery.data
  const questions: QuizQuestion[] = (quiz as any)?.questions ?? []

  const handlePlay = () => {
    if (activeSessions && activeSessions.length > 0) {
      setSessionConflict({ open: true, newRef: quizRef, oldAttemptId: activeSessions[0].attemptId })
      return
    }
    navigate(`/quiz/play/${quizRef}`)
  }

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds) return 'Không giới hạn'
    const mins = Math.floor(seconds / 60)
    return `${mins} phút`
  }

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D...
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/quiz')}
        className="flex items-center gap-2 text-sm text-[#8B7A9E] transition-colors hover:text-[#F5F0FA]"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Khám phá
      </button>

      {/* Loading */}
      {detailQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="review-loader" />
        </div>
      )}

      {/* Not Found */}
      {detailQuery.isError && !detailQuery.isLoading && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.2)]">
            <XCircle className="h-8 w-8 text-[#EF4444]" />
          </div>
          <div>
            <p className="font-bold text-[#F5F0FA]">Quiz không tìm thấy</p>
            <p className="mt-1 text-sm text-[#8B7A9E]">Quiz này không tồn tại hoặc đã bị xóa.</p>
          </div>
          <Button onClick={() => navigate('/quiz')}>Khám phá Quiz</Button>
        </div>
      )}

      {/* Quiz Detail */}
      {quiz && !detailQuery.isLoading && (
        <>
          {/* Cover */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex h-48 items-center justify-center overflow-hidden">
              {quiz.coverImageUrl ? (
                <img src={quiz.coverImageUrl} alt={quiz.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EC4899]/20 to-[#F97316]/20">
                  <Trophy className="h-20 w-20 text-[#EC4899]/40" />
                </div>
              )}
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button
                size="lg"
                onClick={handlePlay}
                className="gap-2 bg-gradient-to-r from-[#EC4899] to-[#F97316] text-white shadow-xl hover:scale-105"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Bắt đầu luyện tập
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(236,72,153,0.12)] px-2.5 py-1 text-xs font-bold text-[#EC4899]">
                <Trophy className="h-3 w-3" />
                Quiz
              </div>
              <h1 className="text-2xl font-extrabold text-[#F5F0FA]">{quiz.title}</h1>
              {quiz.description && (
                <p className="mt-2 text-sm text-[#8B7A9E]">{quiz.description}</p>
              )}
              <p className="mt-1 text-xs text-[#8B7A9E]">
                Tạo bởi <span className="font-semibold text-[#F5F0FA]">{quiz.ownerUsername}</span>
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <Target className="h-4 w-4 text-[#EC4899]" />
                <div>
                  <p className="text-xs text-[#8B7A9E]">Câu hỏi</p>
                  <p className="text-sm font-bold text-[#F5F0FA]">{quiz.questionCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <Timer className="h-4 w-4 text-[#F97316]" />
                <div>
                  <p className="text-xs text-[#8B7A9E]">Thời gian</p>
                  <p className="text-sm font-bold text-[#F5F0FA]">{formatTime(quiz.timeLimitSeconds)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <Users className="h-4 w-4 text-[#8B7A9E]" />
                <div>
                  <p className="text-xs text-[#8B7A9E]">Lượt chơi</p>
                  <p className="text-sm font-bold text-[#F5F0FA]">{quiz.attemptCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-[#8B7A9E]">Điểm TB</p>
                  <p className="text-sm font-bold text-[#F5F0FA]">
                    {quiz.avgScore != null ? `${(quiz.avgScore * 100).toFixed(0)}%` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-[#EC4899] to-[#F97316] text-white"
                onClick={handlePlay}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Chơi ngay
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/quiz/leaderboard`)}
              >
                <Trophy className="h-4 w-4" />
                BXH
              </Button>
            </div>
          </div>

          {/* Questions Preview */}
          {questions.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#F5F0FA]">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Danh sách câu hỏi ({questions.length})
              </h2>

              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/20 text-xs font-bold text-[#EC4899]">
                      {qi + 1}
                    </span>
                    <p className="flex-1 text-sm font-semibold text-[#F5F0FA]">{q.questionText}</p>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="ml-9 space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                            'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                          )}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-text-muted)]">
                            {getOptionLabel(oi)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'FILL_IN' && (
                    <div className="ml-9 text-xs text-[#8B7A9E] italic">
                      Câu trả lời ngắn (điền vào chỗ trống)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Active Session Conflict */}
      <ExitConfirmDialog
        open={sessionConflict.open}
        title="Có phiên làm bài đang hoạt động"
        body="Bạn đang có một phiên quiz chưa hoàn thành. Bạn muốn tiếp tục hay bắt đầu bài mới?"
        confirmLabel="Bắt đầu bài mới"
        confirmHint="Phiên cũ sẽ bị hủy"
        cancelLabel="Tiếp tục bài cũ"
        onConfirm={() => {
          setSessionConflict({ open: false })
          if (sessionConflict.newRef) navigate(`/quiz/play/${sessionConflict.newRef}`)
        }}
        onCancel={() => {
          const oldRef = activeSessions?.[0]?.quizSlug ?? activeSessions?.[0]?.attemptId
          setSessionConflict({ open: false })
          if (oldRef) navigate(`/quiz/play/${oldRef}`)
        }}
      />
    </div>
  )
}
