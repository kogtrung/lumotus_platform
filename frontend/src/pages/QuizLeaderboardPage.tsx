import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Crown, Trophy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { quizApi } from '@/api/study'
import { cn } from '@/utils/cn'

export default function QuizLeaderboardPage() {
  const { quizId = '' } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['quiz-leaderboard', quizId],
    queryFn: () => quizApi.getLeaderboard(quizId, 20).then((r) => r.data),
  })

  const entries = query.data ?? []

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-[#FBBF24]" />
          <h1 className="text-xl font-extrabold text-[#F5F0FA]">Bảng xếp hạng</h1>
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EC4899] border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-[#3D3348]" />
          <p className="mt-4 font-bold text-[#8B7A9E]">Chưa có ai chơi quiz này</p>
          <p className="mt-1 text-sm text-[#8B7A9E]">Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg space-y-3">
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="mb-6 flex items-end justify-center gap-3">
              {/* 2nd */}
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C0C0C0] bg-[#C0C0C020]" style={{ borderColor: '#C0C0C0' }}>
                  <Users className="h-7 w-7 text-[#C0C0C0]" />
                </div>
                <p className="mt-1 text-xs font-semibold text-[#8B7A9E]">{entries[1]?.username}</p>
                <div className="mt-1 flex h-20 w-20 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(192,192,192,0.1)', borderTop: '3px solid #C0C0C0' }}>
                  <span className="text-lg font-extrabold" style={{ color: '#C0C0C0' }}>2</span>
                  <span className="text-xs font-bold" style={{ color: '#C0C0C0' }}>{Math.round((entries[1]?.bestScore ?? 0) * 100)}%</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center">
                <Crown className="h-6 w-6 text-[#FBBF24]" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FBBF24] bg-[#FBBF24]/10">
                  <Users className="h-8 w-8 text-[#FBBF24]" />
                </div>
                <p className="mt-1 text-xs font-semibold text-[#F5F0FA]">{entries[0]?.username}</p>
                <div className="mt-1 flex h-24 w-24 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(251,191,36,0.1)', borderTop: '3px solid #FBBF24' }}>
                  <span className="text-2xl font-extrabold" style={{ color: '#FBBF24' }}>1</span>
                  <span className="text-sm font-bold" style={{ color: '#FBBF24' }}>{Math.round((entries[0]?.bestScore ?? 0) * 100)}%</span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#CD7F32] bg-[#CD7F32]/10" style={{ borderColor: '#CD7F32' }}>
                  <Users className="h-7 w-7 text-[#CD7F32]" />
                </div>
                <p className="mt-1 text-xs font-semibold text-[#8B7A9E]">{entries[2]?.username}</p>
                <div className="mt-1 flex h-16 w-20 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(205,127,50,0.1)', borderTop: '3px solid #CD7F32' }}>
                  <span className="text-lg font-extrabold" style={{ color: '#CD7F32' }}>3</span>
                  <span className="text-xs font-bold" style={{ color: '#CD7F32' }}>{Math.round((entries[2]?.bestScore ?? 0) * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={`${entry.userId}-${idx}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-all',
                  idx < 3 ? 'border-[#3D3348]' : 'border-[#3D3348] hover:border-[#4A4060]',
                )}
                style={{
                  background: idx === 0 ? 'rgba(251,191,36,0.05)' :
                              idx === 1 ? 'rgba(192,192,192,0.05)' :
                              idx === 2 ? 'rgba(205,127,50,0.05)' : '#25203080',
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{
                  color: idx === 0 ? '#FBBF24' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#8B7A9E',
                  background: idx === 0 ? 'rgba(251,191,36,0.15)' : idx === 1 ? 'rgba(192,192,192,0.1)' : idx === 2 ? 'rgba(205,127,50,0.1)' : 'rgba(139,122,158,0.1)',
                }}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#F5F0FA]">{entry.username}</p>
                  <p className="text-xs text-[#8B7A9E]">{entry.totalAttempts} lượt chơi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold" style={{ color: idx === 0 ? '#FBBF24' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#F5F0FA' }}>
                    {Math.round(entry.bestScore * 100)}%
                  </p>
                  <p className="text-xs text-[#8B7A9E]">{entry.bestCorrectAnswers} đúng</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
