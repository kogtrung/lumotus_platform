import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { quizApi } from '@/api/study'
import Button from '@/components/ui/Button'

interface LeaderboardEntry {
  userId: string
  username: string
  avatarUrl: string | null
  avgBestScore: number
  quizzesCompleted: number
  totalCorrectAnswers: number
  totalTimeSeconds: number
  rank: number
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}p ${s}j` : `${m}p`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}j ${rem}p`
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'from-yellow-400 via-amber-300 to-yellow-400', text: 'text-yellow-900', label: '1', badge: '🥇' }
  if (rank === 2) return { bg: 'from-gray-300 via-gray-200 to-gray-300', text: 'text-gray-700', label: '2', badge: '🥈' }
  if (rank === 3) return { bg: 'from-amber-600 via-amber-500 to-amber-600', text: 'text-amber-100', label: '3', badge: '🥉' }
  return { bg: 'from-[#3D3348] to-[#2D2538]', text: 'text-[#8B7A9E]', label: String(rank), badge: null }
}

export default function QuizLeaderboardPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['quiz', 'global-leaderboard'],
    queryFn: () =>
      quizApi.getGlobalQuizLeaderboard(20).then((r) => r.data as unknown as LeaderboardEntry[]),
    staleTime: 60_000,
  })

  const entries = query.data ?? []

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
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
          Xếp hạng dựa trên <span className="font-semibold text-[#F5F0FA]">điểm trung bình tốt nhất</span> qua tất cả quiz đã chơi.
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

      {/* Top 3 podium */}
      {!query.isLoading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {/* Rank 2 */}
          {top3[1] && <PodiumCard entry={top3[1]} height="h-[120px]" rank={2} />}
          {/* Rank 1 */}
          {top3[0] && <PodiumCard entry={top3[0]} height="h-[160px]" rank={1} />}
          {/* Rank 3 */}
          {top3[2] && <PodiumCard entry={top3[2]} height="h-[100px]" rank={3} />}
        </div>
      )}

      {/* Rest of leaderboard */}
      {!query.isLoading && rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => {
            const rank = getRankStyle(entry.rank)
            return (
              <div
                key={entry.userId}
                className="flex items-center gap-3 rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-3 transition-all hover:border-[#EC4899]/30"
              >
                {/* Rank */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3D3348] text-sm font-bold text-[#8B7A9E]">
                  {entry.rank}
                </div>

                {/* Avatar */}
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt={entry.username}
                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#3D3348]"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div
                  className={`h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899] to-[#F97316] text-sm font-bold text-white ${
                    entry.avatarUrl ? 'hidden' : 'flex'
                  }`}
                >
                  {entry.username?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Username */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#F5F0FA]">{entry.username}</p>
                  <p className="text-xs text-[#8B7A9E]">
                    {entry.quizzesCompleted} quiz · {entry.totalCorrectAnswers} câu đúng
                  </p>
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold text-[#EC4899]">
                    {entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-[10px] text-[#8B7A9E]">Điểm TB</p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#F5F0FA]">{formatTime(entry.totalTimeSeconds)}</p>
                  <p className="text-[10px] text-[#8B7A9E]">Tổng thời gian</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PodiumCard({ entry, height, rank }: { entry: LeaderboardEntry; height: string; rank: number }) {
  const s = getRankStyle(rank)
  const initials = entry.username?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={`flex flex-col items-center justify-end ${height} rounded-2xl border border-[#3D3348] bg-gradient-to-t ${s.bg} p-3 text-center`}>
      {/* Avatar */}
      <div className="relative mb-2">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.username}
            className="h-14 w-14 rounded-full border-2 border-white/30 object-cover shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div
          className={`h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-[#EC4899] to-[#F97316] text-xl font-bold text-white shadow-lg ${
            entry.avatarUrl ? 'hidden' : 'flex'
          }`}
        >
          {initials}
        </div>
        {/* Crown for #1 */}
        {rank === 1 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</div>
        )}
      </div>

      {/* Username */}
      <p className={`w-full truncate text-sm font-bold ${s.text}`}>{entry.username}</p>

      {/* Score */}
      <p className={`text-lg font-black ${s.text}`}>
        {entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'}
      </p>
      <p className={`text-[10px] font-medium ${s.text} opacity-70`}>
        {entry.quizzesCompleted} quiz · {entry.totalCorrectAnswers} đúng
      </p>
    </div>
  )
}
