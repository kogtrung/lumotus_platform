import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Target, Zap, Flame, Crown, Clock, CalendarDays, BarChart2 } from 'lucide-react'
import { quizApi } from '@/api/study'
import type { LeaderboardEntry } from '@/api/progress'
import Button from '@/components/ui/Button'

// ==========================================
// TYPES
// ==========================================
type GlobalRow = {
  userId: string
  username: string
  avatarUrl: string | null
  avgBestScore: number
  quizzesCompleted: number
  totalCorrectAnswers: number
  totalTimeSeconds: number
  rank: number
}

// ==========================================
// UTILS
// ==========================================
function formatTime(seconds: number): string {
  if (!seconds && seconds !== 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}h ${rem}m`
}

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
  hidden: { opacity: 0, x: -5 },
  show: { opacity: 1, x: 0 },
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

function GlobalLeaderboardRow({ entry, isCurrentUser }: { entry: GlobalRow, isCurrentUser?: boolean }) {
  const score = entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'
  const isTop3 = entry.rank <= 3;

  return (
    <motion.div
      variants={rowVariants}
      whileHover={{ y: -1, scale: 1.01 }}
      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 transition-all shadow-md ${getRowStyle(entry.rank)}`}
    >
      <div className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-xs font-black ${getRankText(entry.rank)}`}>
        #{entry.rank}
        {getRankIcon(entry.rank)}
      </div>
      <Avatar url={entry.avatarUrl} name={entry.username} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs sm:text-sm font-bold flex items-center gap-2 ${isTop3 ? getRankText(entry.rank) : (isCurrentUser ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]')}`}>
          {entry.username}
          {isCurrentUser && <span className="rounded bg-[var(--color-primary-subtle)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/30">BẠN</span>}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-cyan-400" /> {formatTime(entry.totalTimeSeconds)}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
          <span>{entry.quizzesCompleted} quiz</span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
          <span>{entry.totalCorrectAnswers} câu đúng</span>
        </div>
      </div>
      <div className="shrink-0 text-right min-w-[50px]">
        <p className={`text-sm sm:text-base font-black ${isTop3 ? getRankText(entry.rank) : 'text-[var(--color-primary)]'}`}>{score}</p>
        <p className="text-[9px] text-[var(--color-text-muted)]">TB</p>
      </div>
    </motion.div>
  )
}

function WeeklyLeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry, isCurrentUser?: boolean }) {
  const isTop3 = entry.rank <= 3;
  return (
    <motion.div
      variants={rowVariants}
      whileHover={{ y: -1, scale: 1.01 }}
      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 transition-all shadow-md ${getRowStyle(entry.rank)}`}
    >
      <div className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-xs font-black ${getRankText(entry.rank)}`}>
        #{entry.rank}
        {getRankIcon(entry.rank)}
      </div>
      <Avatar url={entry.avatarUrl} name={entry.username} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs sm:text-sm font-bold flex items-center gap-2 ${isTop3 ? getRankText(entry.rank) : (isCurrentUser ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]')}`}>
          {entry.username}
          {isCurrentUser && <span className="rounded bg-[var(--color-primary-subtle)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/30">BẠN</span>}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[var(--color-primary)]" /> {entry.xp.toLocaleString()} XP</span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> {entry.streak} ngày</span>
        </div>
      </div>
      <div className="shrink-0 text-right min-w-[40px]">
        <p className={`text-sm sm:text-base font-black ${isTop3 ? getRankText(entry.rank) : 'text-[var(--color-primary)]'}`}>
          {entry.compositeScore > 0 ? (entry.compositeScore).toFixed(1) : 0}
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)]">Điểm</p>
      </div>
    </motion.div>
  )
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function QuizLeaderboardPage() {
  const navigate = useNavigate()

  // --- Queries ---
  const globalQuery = useQuery({
    queryKey: ['quiz', 'global-leaderboard'],
    queryFn: () => quizApi.getGlobalQuizLeaderboard(50).then((r) => r.data),
    staleTime: 60_000,
  })

  const meGlobalQuery = useQuery({
    queryKey: ['quiz', 'global-leaderboard', 'me'],
    queryFn: () => quizApi.getMyGlobalQuizLeaderboardEntry().then((r) => r.data),
    staleTime: 60_000,
  })

  const weeklyQuery = useQuery({
    queryKey: ['quiz', 'weekly-leaderboard'],
    queryFn: () => quizApi.getWeeklyQuizLeaderboard(20).then((r) => r.data),
    staleTime: 10_000,
  })

  const meWeeklyQuery = useQuery({
    queryKey: ['quiz', 'weekly-leaderboard', 'me'],
    queryFn: () => quizApi.getMyWeeklyQuizLeaderboardEntry().then((r) => r.data),
    staleTime: 10_000,
  })

  // --- Rendering ---
  const isLoading = weeklyQuery.isLoading || globalQuery.isLoading
  const globalEntries = globalQuery.data ?? []
  const weeklyEntries = weeklyQuery.data ?? []

  return (
    <div 
      className="w-full flex flex-col mx-auto overflow-hidden min-h-0"
      style={{ height: 'calc(100dvh - 120px)' }}
    >
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 mb-2 shrink-0 px-2"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h1 className="text-base sm:text-lg font-black text-[var(--color-text)]">Hành Lang Danh Vọng</h1>
          </div>
        </div>
        <Link to="/quiz">
          <Button size="sm" className="gap-1.5 shadow-md shadow-[var(--color-primary)]/20 hover:scale-105 active:scale-95 transition-transform text-xs font-bold px-3">
            <Target className="h-4 w-4" />
            Đến danh sách Quiz
          </Button>
        </Link>
      </motion.div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EC4899] border-t-transparent shadow-md shadow-[#EC4899]/30" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 overflow-hidden rounded-xl md:rounded-2xl">
          
          {/* COLUMN 1: WEEKLY LEADERBOARD */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg overflow-hidden relative rounded-xl"
          >
            <div className="shrink-0 p-2 sm:p-3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-900/40 via-[var(--color-bg)] to-[var(--color-bg)] border-b border-[var(--color-border)]/60 flex items-center gap-2.5">
              <div className="h-8 w-8 flex-shrink-0 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg flex items-center justify-center shadow-md shadow-[var(--color-primary)]/10">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[var(--color-text)]">Giải Đấu Tuần</h2>
                <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5">Reset vào Chủ Nhật. Điểm = Tổng cộng chênh lệch kỷ lục.</p>
              </div>
            </div>
            
            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 sm:p-3 space-y-1.5 custom-scrollbar">
              {weeklyEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2">
                  <Flame className="h-10 w-10 text-[var(--color-border-strong)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">Tuần này chưa có ai tham gia!</p>
                  </div>
                </div>
              ) : (
                <motion.div className="flex flex-col gap-1.5" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
                  {weeklyEntries.map((entry) => (
                    <WeeklyLeaderboardRow key={entry.userId} entry={entry} isCurrentUser={meWeeklyQuery.data?.userId === entry.userId} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sticky Personal Card */}
            {meWeeklyQuery.data && (
              <div className={`shrink-0 p-2.5 sm:p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-10 flex items-center justify-between gap-3 ${
                meWeeklyQuery.data.rank > 0 && meWeeklyQuery.data.rank <= 3 ? getRowStyle(meWeeklyQuery.data.rank) + ' border-t' : 'bg-[var(--color-surface)] border-t border-[var(--color-primary)]/50'
              }`}>
                 <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-sm sm:text-base font-black shadow-inner ${
                        meWeeklyQuery.data.rank === 1 ? 'bg-yellow-500 text-yellow-900 border border-yellow-300' :
                        meWeeklyQuery.data.rank === 2 ? 'bg-slate-300 text-slate-800 border border-slate-100' :
                        meWeeklyQuery.data.rank === 3 ? 'bg-orange-400 text-orange-900 border border-orange-200' :
                        'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white'
                    }`}>
                      {meWeeklyQuery.data.rank > 0 ? `#${meWeeklyQuery.data.rank}` : '##'}
                    </div>
                    <div className="hidden sm:block">
                      <Avatar url={meWeeklyQuery.data.avatarUrl} name={meWeeklyQuery.data.username} size="md" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[9px] sm:text-[10px] font-semibold ${meWeeklyQuery.data.rank > 0 && meWeeklyQuery.data.rank <= 3 ? getRankText(meWeeklyQuery.data.rank) : 'text-[var(--color-text-muted)]'}`}>
                        Xếp hạng của bạn (Tuần)
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs sm:text-sm font-bold truncate ${meWeeklyQuery.data.rank > 0 && meWeeklyQuery.data.rank <= 3 ? getRankText(meWeeklyQuery.data.rank) : 'text-[var(--color-text)]'}`}>
                          {meWeeklyQuery.data.username}
                        </p>
                        <span className="rounded bg-[var(--color-primary-subtle)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/30">BẠN</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[var(--color-primary)]" /> {meWeeklyQuery.data.xp.toLocaleString()} XP</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> {meWeeklyQuery.data.streak} ngày</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base sm:text-lg font-black drop-shadow-md ${meWeeklyQuery.data.rank > 0 && meWeeklyQuery.data.rank <= 3 ? getRankText(meWeeklyQuery.data.rank) : 'text-[var(--color-primary)]'}`}>
                      {meWeeklyQuery.data.compositeScore > 0 ? (meWeeklyQuery.data.compositeScore).toFixed(1) : 0} <span className="text-[10px] font-bold opacity-80">điểm</span>
                    </p>
                  </div>
              </div>
            )}
          </motion.div>


          {/* COLUMN 2: GLOBAL LEADERBOARD */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg overflow-hidden relative rounded-xl"
          >
            <div className="shrink-0 p-2 sm:p-3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-[var(--color-bg)] to-[var(--color-bg)] border-b border-[var(--color-border)]/60 flex items-center gap-2.5">
              <div className="h-8 w-8 flex-shrink-0 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10">
                <BarChart2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[var(--color-text)]">Toàn Thời Gian</h2>
                <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5">Kỷ lục tính theo Tỉ lệ Điểm trung bình cao nhất.</p>
              </div>
            </div>
            
            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 sm:p-3 space-y-1.5 custom-scrollbar">
              {globalEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-sm font-bold text-[var(--color-text)]">Chưa có dữ liệu hệ thống.</p>
                </div>
              ) : (
                <motion.div className="flex flex-col gap-1.5" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
                  {globalEntries.map((entry) => (
                    <GlobalLeaderboardRow key={entry.userId} entry={entry} isCurrentUser={meGlobalQuery.data?.userId === entry.userId} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sticky Personal Card (Global) */}
            {meGlobalQuery.data && (
              <div className={`shrink-0 p-2.5 sm:p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-10 flex items-center justify-between gap-3 ${
                meGlobalQuery.data.rank > 0 && meGlobalQuery.data.rank <= 3 ? getRowStyle(meGlobalQuery.data.rank) + ' border-t' : 'bg-[var(--color-surface)] border-t border-blue-500/50'
              }`}>
                 <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-sm sm:text-base font-black shadow-inner ${
                        meGlobalQuery.data.rank === 1 ? 'bg-yellow-500 text-yellow-900 border border-yellow-300' :
                        meGlobalQuery.data.rank === 2 ? 'bg-slate-300 text-slate-800 border border-slate-100' :
                        meGlobalQuery.data.rank === 3 ? 'bg-orange-400 text-orange-900 border border-orange-200' :
                        'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    }`}>
                      {meGlobalQuery.data.rank > 0 ? `#${meGlobalQuery.data.rank}` : '##'}
                    </div>
                    <div className="hidden sm:block">
                      <Avatar url={meGlobalQuery.data.avatarUrl} name={meGlobalQuery.data.username} size="md" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[9px] sm:text-[10px] font-semibold ${meGlobalQuery.data.rank > 0 && meGlobalQuery.data.rank <= 3 ? getRankText(meGlobalQuery.data.rank) : 'text-[var(--color-text-muted)]'}`}>
                        Thành tích trọn đời
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs sm:text-sm font-bold truncate ${meGlobalQuery.data.rank > 0 && meGlobalQuery.data.rank <= 3 ? getRankText(meGlobalQuery.data.rank) : 'text-[var(--color-text)]'}`}>
                          {meGlobalQuery.data.username}
                        </p>
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold text-blue-400 border border-blue-500/30">BẠN</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-cyan-400" /> {formatTime(meGlobalQuery.data.totalTimeSeconds)}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
                        <span>{meGlobalQuery.data.quizzesCompleted} quiz</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/40" />
                        <span>{meGlobalQuery.data.totalCorrectAnswers} câu đúng</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col justify-center">
                    <p className={`text-base sm:text-lg font-black drop-shadow-md ${meGlobalQuery.data.rank > 0 && meGlobalQuery.data.rank <= 3 ? getRankText(meGlobalQuery.data.rank) : 'text-[var(--color-primary)]'}`}>
                      {meGlobalQuery.data.avgBestScore != null ? `${(meGlobalQuery.data.avgBestScore * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
              </div>
            )}
          </motion.div>

        </div>
      )}
    </div>
  )
}
