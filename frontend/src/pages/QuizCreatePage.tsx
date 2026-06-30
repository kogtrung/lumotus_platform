import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookCheck, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { DeckSummary } from '@/types/deck'

export default function QuizCreatePage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)

  const decksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => decksApi.list({ page: 0, size: 100 }).then((r) => r.data.content),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedDeckId) throw new Error('Chọn deck')
      return quizApi.create({
        title,
        description: description || undefined,
        deckId: selectedDeckId,
        questionCount,
        timeLimitSeconds: timeLimit != null ? timeLimit * 60 : undefined,
      })
    },
    onSuccess: () => {
      toast.success('Tạo quiz thành công!')
      navigate('/quiz')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo quiz')
    },
  })

  const decks = decksQuery.data ?? []
  const selectedDeck = decks.find((d: DeckSummary) => d.id === selectedDeckId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Nhập tiêu đề quiz'); return }
    if (!selectedDeckId) { toast.error('Chọn một deck'); return }
    createMutation.mutate()
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/quiz')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-[#F5F0FA]">Tạo Quiz mới</h1>
          <p className="text-sm text-[#8B7A9E]">Quiz của bạn sẽ được gửi duyệt để đưa lên Khám phá</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#F5F0FA]">Tiêu đề quiz *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: TOEIC 600 - Unit 1"
            maxLength={200}
            className="w-full rounded-xl border border-[#3D3348] bg-[#1A1520] px-4 py-3 text-sm text-[#F5F0FA] placeholder-[#8B7A9E] outline-none transition-all focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#F5F0FA]">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về quiz (tùy chọn)"
            rows={3}
            className="w-full rounded-xl border border-[#3D3348] bg-[#1A1520] px-4 py-3 text-sm text-[#F5F0FA] placeholder-[#8B7A9E] outline-none transition-all focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/20"
          />
        </div>

        {/* Deck selection */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#F5F0FA]">Deck nguồn *</label>
          {decksQuery.isLoading ? (
            <div className="flex h-20 items-center justify-center rounded-xl border border-[#3D3348] bg-[#1A1520]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#EC4899] border-t-transparent" />
            </div>
          ) : (
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-[#3D3348] bg-[#1A1520] p-3">
              {decks.map((deck: DeckSummary) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all',
                    selectedDeckId === deck.id
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#3D3348] hover:border-[#4A4060]',
                  )}
                >
                  <BookCheck className={cn('h-4 w-4 shrink-0', selectedDeckId === deck.id ? 'text-[#10B981]' : 'text-[#8B7A9E]')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#F5F0FA]">{deck.title}</p>
                    <p className="text-[10px] text-[#8B7A9E]">{deck.cardCount} thẻ</p>
                  </div>
                  {selectedDeckId === deck.id && <Check className="h-4 w-4 shrink-0 text-[#10B981]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Question count */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#F5F0FA]">
            Số câu hỏi
            {selectedDeck && (
              <span className="ml-2 font-normal text-[#8B7A9E]">
                (tối đa {selectedDeck.cardCount})
              </span>
            )}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={selectedDeck ? Math.min(50, selectedDeck.cardCount) : 50}
              step={5}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="study-range flex-1"
            />
            <span className="w-12 text-center font-bold text-[#10B981]">{questionCount}</span>
          </div>
        </div>

        {/* Time limit */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#F5F0FA]">Thời gian</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: null, label: 'Không giới hạn' },
              { value: 5, label: '5 phút' },
              { value: 10, label: '10 phút' },
              { value: 15, label: '15 phút' },
              { value: 20, label: '20 phút' },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setTimeLimit(value)}
                className={cn(
                  'rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all',
                  timeLimit === value
                    ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                    : 'border-[#3D3348] text-[#8B7A9E] hover:border-[#4A4060]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/quiz')} className="flex-1">
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo Quiz'}
          </Button>
        </div>
      </form>
    </div>
  )
}
