import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Crown, Users, Flame } from 'lucide-react'
import { progressApi } from '@/api/progress'
import { useAuthStore } from '@/store/authStore'

// ==========================================
// TYPES
// ==========================================
import type { LeaderboardEntry } from '@/api/progress'

// ==========================================
// UTILS
// ==========================================
function getRowStyle(rank: number) {
  if (rank === 1) return 'border-yellow-500/50 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-yellow-500/20 via-yellow-700/10 to-[var(--color-surface)]'
  if (rank === 2) return 'border-slate-300/50 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-slate-300/20 via-slate-500/10 to-[var(--color-surface)]'
  if (rank === 3) return 'border-orange-500/50 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-orange-500/20 via-orange-700/10 to-[var(--color-surface)]'
  return 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40'
}

function getRankText(rank: number) {
  if (rank === 1) return 'text-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
  if (rank === 2) return 'text-slate-400 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]'
  if (rank === 3) return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
  return 'text-[var(--color-text)]'
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="absolute -top-1.5 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 drop-shadow-md rotate-[15deg]" />
  if (rank === 2) return <Crown className="absolute -top-1.5 -right-1 h-3 w-3 sm:h-3 sm:w-3 text-slate-300 drop-shadow-md rotate-[15deg]" />
  if (rank === 3) return <Crown className="absolute -top-1.5 -right-1 h-3 w-3 sm:h-3 sm:w-3 text-orange-400 drop-shadow-md rotate-[15deg]" />
  return null
}

const rowVariants = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0 },
}

// ==========================================
// COMPONENTS
// ==========================================
function Avatar({ url, name, size = 'sm' }: { url: string | null; name: string, size?: 'sm' | 'md' }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  const sizeClasses = size === 'md' ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-7 w-7 sm:h-8 sm:w-8'
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center shadow-md ${sizeClasses}`}>
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-white">{initial}</span>
      )}
    </div>
  )
}

function PlatformLeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry, isCurrentUser?: boolean }) {
  const isTop3 = entry.rank && entry.rank <= 3;
  return (
    <motion.div
      variants={rowVariants}
      whileHover={{ y: -1, scale: 1.01 }}
      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 transition-all shadow-md ${getRowStyle(entry.rank)}`}
    >
      <div className={`relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-sm sm:text-base font-black ${getRankText(entry.rank)}`}>
        #{entry.rank}
        {getRankIcon(entry.rank)}
      </div>
      <Avatar url={entry.avatarUrl} name={entry.username} size="md" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm sm:text-base font-bold flex items-center gap-2 ${isTop3 ? getRankText(entry.rank) : (isCurrentUser ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]')}`}>
          {entry.username}
          {isCurrentUser && <span className="rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-md border border-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]">BẠN</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-400" /> {entry.streak} ngày streak</span>
        </div>
      </div>
      <div className="shrink-0 text-right min-w-[60px]">
        <p className={`text-base sm:text-lg font-black ${isTop3 ? getRankText(entry.rank) : 'text-[var(--color-primary)]'}`}>
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]">XP</p>
      </div>
    </motion.div>
  )
}

function PodiumBlock({ rank, entry }: { rank: number, entry?: LeaderboardEntry }) {
  const is1 = rank === 1;
  const is2 = rank === 2;
  // const is3 = rank === 3;
  
  const heightClass = is1 ? 'h-36 xl:h-48' : is2 ? 'h-28 xl:h-36' : 'h-20 xl:h-28';
  const colorRing = is1 ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : 
                    is2 ? 'border-slate-300 bg-slate-300/20 shadow-[0_0_20px_rgba(203,213,225,0.4)]' : 
                    'border-orange-500 bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.4)]';
  const bannerColor = is1 ? 'bg-gradient-to-t from-yellow-950 via-yellow-600 to-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.2)]' :
                      is2 ? 'bg-gradient-to-t from-slate-900 via-slate-500 to-slate-200 shadow-[0_0_20px_rgba(203,213,225,0.1)]' :
                      'bg-gradient-to-t from-orange-950 via-orange-700 to-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.15)]';
  const titleColor = is1 ? 'text-yellow-400' : is2 ? 'text-slate-300' : 'text-orange-400';
  const crownIcon = is1 ? <Crown className="w-8 h-8 xl:w-10 xl:h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] -mb-2 z-20 relative" strokeWidth={2.5} /> : null;
  const numColor = is1 ? 'text-yellow-900' : is2 ? 'text-slate-800' : 'text-orange-950';

  if (!entry) return <div className={`w-24 xl:w-32 flex-shrink-0 flex flex-col justify-end ${heightClass} opacity-10`} />;

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.15 + 0.2, type: "spring", stiffness: 100 }}
      className={`relative w-24 xl:w-32 flex flex-col items-center justify-end z-${is1 ? 20 : 10}`}
    >
       {/* Flow character explicitly in bounds */}
       <div className="flex flex-col items-center w-[120%] pb-2 xl:pb-3 relative z-20">
         {crownIcon}
         <div className={`relative w-12 h-12 xl:w-16 xl:h-16 rounded-full border-[3px] flex items-center justify-center p-0.5 ${colorRing} z-10 bg-[var(--color-bg)]`}>
           {entry.avatarUrl ? (
             <img src={entry.avatarUrl} className="w-full h-full rounded-full object-cover" />
           ) : (
             <span className={`font-black text-xl ${titleColor}`}>{entry.username.charAt(0).toUpperCase()}</span>
           )}
           <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] border-2 border-[var(--color-bg)] ${
              is1 ? 'bg-yellow-400 text-yellow-900' : is2 ? 'bg-slate-200 text-slate-800' : 'bg-orange-400 text-orange-950'
           }`}>
             #{rank}
           </div>
         </div>
         <div className="mt-1.5 text-center w-full relative z-20">
           <p className={`font-extrabold text-[11px] xl:text-[13px] truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] px-1 ${titleColor}`}>{entry.username}</p>
           <p className="text-[9px] xl:text-[10px] font-bold text-white drop-shadow-md bg-black/60 border border-white/10 rounded-full px-2 py-px flex items-center justify-center gap-1 mt-0.5 mx-auto w-fit">
             {entry.xp.toLocaleString()} XP
           </p>
         </div>
       </div>
       
       {/* Podium Pillar */}
       <div className={`w-full ${heightClass} ${bannerColor} rounded-t-lg xl:rounded-t-xl flex flex-col items-center mx-auto border-t-[3px] border-white/60 shadow-inner relative overflow-hidden -mt-1`}>
         {/* Shiny glare */}
         <div className="absolute inset-x-0 h-2/3 top-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
         
         <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full pt-2">
           <span className={`text-3xl xl:text-5xl font-black ${numColor} opacity-90 tracking-tighter drop-shadow-sm`}>{rank}</span>
         </div>
       </div>
    </motion.div>
  )
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)

  // --- Queries ---
  const leaderboardQuery = useQuery({
    queryKey: ['progress', 'leaderboard', 50],
    queryFn: () => progressApi.getLeaderboard(50).then((r) => r.data),
    staleTime: 60_000,
  })

  // getMyProgress returns the exact XP/Streak of the logged in user
  const meProgressQuery = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.getMyProgress().then((r) => r.data),
    staleTime: 60_000,
  })

  // --- Rendering ---
  const isLoading = leaderboardQuery.isLoading
  const entries = leaderboardQuery.data ?? []
  
  const myRank = meProgressQuery.data?.rank || 0
  const myXp = meProgressQuery.data?.xp || 0
  const myStreak = meProgressQuery.data?.streak || 0
  
  const isMeTop3 = myRank > 0 && myRank <= 3;

  return (
    <div 
      className="w-full flex flex-col overflow-hidden min-h-0"
      style={{ height: 'calc(100dvh - 150px)' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 mb-4 shrink-0 px-2 lg:px-0 w-full"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#F97316] shadow-lg shadow-[#F97316]/20">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">BXH Tổng Nền Tảng</h1>
            <p className="hidden sm:block text-xs text-[var(--color-text-muted)] mt-0.5">Top học sinh xuất sắc nhất hệ thống</p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EC4899] border-t-transparent shadow-md shadow-[#EC4899]/30" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row overflow-hidden relative pb-12 lg:pb-0 bg-[var(--color-bg)] border border-[var(--color-border)] lg:rounded-3xl rounded-2xl shadow-2xl">
          
          {/* COLUMN 1: THE LIST */}
          <div className="flex-1 min-h-0 flex flex-col w-full relative isolate lg:border-r lg:border-[var(--color-border)]">
            <div className="shrink-0 p-3 sm:p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-primary-dark)]/40 via-[var(--color-bg)] to-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center justify-between gap-2.5">
               <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[var(--color-text)]">Cộng Đồng Học Tập</h2>
                  <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-0.5">Dựa trên nền tảng: Học Tập + Chuỗi Streak.</p>
                </div>
               </div>
            </div>
            
            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 space-y-2 custom-scrollbar relative z-0">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <Users className="h-16 w-16 text-[var(--color-border-strong)]" />
                  <div>
                    <p className="text-lg font-bold text-[var(--color-text)]">Chưa có dữ liệu nền tảng.</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Hãy là người đầu tiên bứt phá!</p>
                  </div>
                </div>
              ) : (
                <motion.div className="flex flex-col gap-2 md:gap-3" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
                  {entries.map((entry) => (
                    <PlatformLeaderboardRow key={entry.userId} entry={entry} isCurrentUser={user?.id === entry.userId} />
                  ))}
                </motion.div>
              )}
            </div>

            {user && meProgressQuery.data && (
              <div 
                className={`relative shrink-0 py-2.5 px-3 sm:px-4 z-50 flex items-center justify-between gap-3 ${
                  isMeTop3 ? getRowStyle(myRank) : 'bg-gradient-to-t from-[var(--color-bg)] to-[var(--color-surface)]'
                }`}
                style={{ 
                  boxShadow: '0 -16px 40px -10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.06)',
                  borderTop: isMeTop3 ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(99,102,241,0.5)', 
                }}
              >
                 <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-sm sm:text-base font-black shadow-[inset_0_-2px_6px_rgba(0,0,0,0.4)] ${
                        myRank === 1 ? 'bg-yellow-500 text-yellow-900 border border-yellow-300' :
                        myRank === 2 ? 'bg-slate-300 text-slate-800 border border-slate-100' :
                        myRank === 3 ? 'bg-orange-400 text-orange-900 border border-orange-200' :
                        'bg-gradient-to-br from-indigo-500 to-[#EC4899] text-white'
                    }`}>
                      {myRank > 0 ? `#${myRank}` : '##'}
                    </div>
                    <div className="hidden sm:block shadow-lg rounded-full">
                      <Avatar url={user.avatarUrl} name={user.username} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className={`text-xs sm:text-sm font-black truncate drop-shadow-lg ${isMeTop3 ? getRankText(myRank) : 'text-[var(--color-text)]'}`}>
                          {user.username}
                        </p>
                        <span className={`rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-md border border-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]`}>BẠN</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        <span className="flex items-center gap-1 drop-shadow-md"><Flame className="h-3 w-3 text-orange-400" /> {myStreak} ngày streak</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base sm:text-lg font-black drop-shadow-lg ${isMeTop3 ? getRankText(myRank) : 'text-indigo-400'}`}>
                      {myXp.toLocaleString()} <span className="text-[10px] font-bold opacity-80">XP</span>
                    </p>
                  </div>
              </div>
            )}
          </div>

          {entries.length >= 3 ? (
            <div className="hidden lg:flex flex-1 flex-col items-center p-4 xl:p-8 pb-4 bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-surface)] relative overflow-hidden shadow-[inset_20px_0_40px_-5px_rgba(255,255,255,0.05)] h-full w-full">
              {/* Background ambient lighting */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
              
              {/* Rays effect */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Title Section Inline */}
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-3 z-10 w-full mb-auto mt-2">
                <Trophy className="h-8 w-8 xl:h-10 xl:w-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h3 className="text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-500 to-yellow-700 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)] tracking-widest uppercase">
                  BẢNG VÀNG DANH DỰ
                </h3>
              </motion.div>
              
              {/* Podium stays at the bottom */}
              <div className="flex items-end justify-center w-full gap-2 xl:gap-8 mt-auto mb-2 xl:mb-4 z-10">
                <PodiumBlock rank={2} entry={entries[1]} />
                <PodiumBlock rank={1} entry={entries[0]} />
                <PodiumBlock rank={3} entry={entries[2]} />
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-surface)]">
               <Trophy className="h-16 w-16 text-[var(--color-border)] mb-4" />
               <p className="text-[var(--color-text-muted)] font-bold text-lg">Chưa đủ thống kê Bảng Vàng</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
