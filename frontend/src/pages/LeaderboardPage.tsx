import { useQuery } from '@tanstack/react-query'
import { Trophy, Crown, Medal, Users } from 'lucide-react'
import { progressApi } from '@/api/progress'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['progress', 'leaderboard', 50],
    queryFn: () => progressApi.getLeaderboard(50).then((r) => r.data),
    staleTime: 30_000,
  })

  const myRankIdx = entries?.findIndex(e => e.userId === user?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#F97316] shadow-lg">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F0FA]">Bảng xếp hạng</h1>
          <p className="text-sm text-[#8B7A9E]">Top học sinh theo XP + streak</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EC4899] border-t-transparent" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/60 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-[#3D3348]" />
          <p className="mt-4 font-bold text-[#8B7A9E]">Chưa có ai trong bảng xếp hạng</p>
          <p className="mt-1 text-sm text-[#8B7A9E]">Hãy là người đầu tiên kiếm XP!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="mb-8 flex items-end justify-center gap-4">
              {/* 2nd */}
              <div className="flex flex-col items-center">
                <Medal className="h-5 w-5 text-[#C0C0C0]" />
                <div className="mt-1 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C0C0C0] bg-[#C0C0C020]">
                  {entries[1]?.avatarUrl
                    ? <img src={entries[1].avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    : <Users className="h-6 w-6 text-[#C0C0C0]" />
                  }
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[#C0C0C0]">{entries[1]?.username}</p>
                <p className="text-xs text-[#8B7A9E]">{entries[1]?.xp?.toLocaleString()} XP</p>
                <div className="mt-1 flex h-16 w-20 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(192,192,192,0.08)', borderTop: '3px solid #C0C0C0' }}>
                  <span className="text-xl font-extrabold" style={{ color: '#C0C0C0' }}>2</span>
                  <span className="text-xs font-bold text-[#C0C0C0]">🔥 {entries[1]?.streak}</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center">
                <Crown className="h-6 w-6 text-[#FBBF24]" />
                <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FBBF24] bg-[#FBBF24]/10">
                  {entries[0]?.avatarUrl
                    ? <img src={entries[0].avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    : <Users className="h-7 w-7 text-[#FBBF24]" />
                  }
                </div>
                <p className="mt-1.5 text-sm font-bold text-[#FBBF24]">{entries[0]?.username}</p>
                <p className="text-xs text-[#8B7A9E]">{entries[0]?.xp?.toLocaleString()} XP</p>
                <div className="mt-1 flex h-20 w-24 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(251,191,36,0.08)', borderTop: '3px solid #FBBF24' }}>
                  <span className="text-2xl font-extrabold" style={{ color: '#FBBF24' }}>1</span>
                  <span className="text-sm font-bold text-[#FBBF24]">🔥 {entries[0]?.streak}</span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center">
                <Medal className="h-5 w-5 text-[#CD7F32]" />
                <div className="mt-1 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#CD7F32] bg-[#CD7F32]/10">
                  {entries[2]?.avatarUrl
                    ? <img src={entries[2].avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    : <Users className="h-6 w-6 text-[#CD7F32]" />
                  }
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[#CD7F32]">{entries[2]?.username}</p>
                <p className="text-xs text-[#8B7A9E]">{entries[2]?.xp?.toLocaleString()} XP</p>
                <div className="mt-1 flex h-16 w-20 flex-col items-center justify-center rounded-t-xl" style={{ background: 'rgba(205,127,50,0.08)', borderTop: '3px solid #CD7F32' }}>
                  <span className="text-xl font-extrabold" style={{ color: '#CD7F32' }}>3</span>
                  <span className="text-xs font-bold text-[#CD7F32]">🔥 {entries[2]?.streak}</span>
                </div>
              </div>
            </div>
          )}

          {/* My rank banner */}
          {myRankIdx != null && myRankIdx >= 3 && (
            <div className="rounded-xl border border-[#EC4899]/40 bg-gradient-to-r from-[#831843]/60 to-[#BE185D]/40 p-4 text-center">
              <p className="text-sm text-[#F5F0FA]">
                Vị trí của bạn: <span className="font-extrabold text-[#EC4899]">#{myRankIdx + 1}</span>
              </p>
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {entries.slice(3).map((entry) => {
              const isMe = entry.userId === user?.id
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3.5 transition-all',
                    isMe
                      ? 'border-[#EC4899]/50 bg-[#EC4899]/10'
                      : 'border-[#3D3348] hover:border-[#4A4060] bg-[#252030]/60',
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[#8B7A9E]">
                    #{entry.rank}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D2538]">
                    {entry.avatarUrl
                      ? <img src={entry.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      : <Users className="h-4 w-4 text-[#8B7A9E]" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-bold', isMe ? 'text-[#EC4899]' : 'text-[#F5F0FA]')}>
                      {entry.username} {isMe && <span className="text-xs">(bạn)</span>}
                    </p>
                    <p className="text-xs text-[#8B7A9E]">🔥 {entry.streak} streak</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-[#F5F0FA]">{entry.xp.toLocaleString()} XP</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
