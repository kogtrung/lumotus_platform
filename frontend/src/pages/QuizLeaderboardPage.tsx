import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'

interface LeaderboardEntry {
  userId: string
  username: string
  avatarUrl: string | null
  avgBestScore: number
  totalAttempts: number
  totalCorrectAnswers: number
  totalTimeSeconds: number
  rank: number
}

export default function QuizLeaderboardPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['quiz', 'global-leaderboard'],
    queryFn: () =>
      quizApi.getGlobalQuizLeaderboard(20).then(
        (r) =>
          r.data as unknown as LeaderboardEntry[]
      ),
    staleTime: 60_000,
  })

  const entries = query.data ?? []

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-400', text: 'text-yellow-900', label: '🥇' }
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-700', label: '🥈' }
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', label: '🥉' }
    return { bg: 'bg-[#3D3348]', text: 'text-[#8B7A9E]', label: `#${rank}` }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-400" />
          <h1 className="text-xl font-extrabold text-[#F5F0FA]">Bảng xếp hạng Quiz</h1>
        </div>
      </div>

      {/* Subtitle */}
      <div className="rounded-xl border border-[#3D3348] bg-[#252030] p-4">
        <p className="text-sm text-[#8B7A9E]">
          Xếp hạng dựa trên <span className="font-semibold text-[#F5F0FA]">điểm trung bình tốt nhất</span> của mỗi user qua tất cả quiz đã chơi.
        </p>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EC4899] border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!query.isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#3D3348] bg-[#252030]/50 py-16 text-center">
          <Trophy className="h-12 w-12 text-[#3D3348]" />
          <div>
            <p className="text-sm font-bold text-[#F5F0FA]">Chưa có dữ liệu</p>
            <p className="mt-1 text-xs text-[#8B7A9E]">Hãy làm quiz để xuất hiện trên bảng xếp hạng!</p>
          </div>
          <Button onClick={() => navigate('/quiz')}>Khám phá Quiz</Button>
        </div>
      )}

      {/* Leaderboard */}
      {!query.isLoading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const rank = getRankStyle(entry.rank)
            return (
              <div
                key={entry.userId}
                className="flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030] p-4 transition-all hover:border-[#EC4899]/30"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold',
                    rank.bg,
                    rank.text
                  )}
                >
                  {rank.label}
                </div>

                {/* Avatar placeholder */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899] to-[#F97316] text-sm font-bold text-white">
                  {entry.username?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#F5F0FA]">{entry.username}</p>
                  <p className="text-xs text-[#8B7A9E]">
                    {entry.totalAttempts} quiz · {entry.totalCorrectAnswers} câu đúng
                  </p>
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-extrabold text-[#EC4899]">
                    {entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-[10px] text-[#8B7A9E]">Điểm TB tốt nhất</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
