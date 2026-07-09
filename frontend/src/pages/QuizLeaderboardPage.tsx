import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Crown, Medal, Timer, Trophy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { quizApi } from '@/api/study'
import Button from '@/components/ui/Button'

type Row = {
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
  if (!seconds && seconds !== 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}h ${rem}m`
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-[radial-gradient(circle_at_top,#FDE68A,#F59E0B,#B45309)]', text: 'text-amber-900', label: '1', icon: '🥇', border: 'border-amber-200/60' }
  if (rank === 2) return { bg: 'bg-[radial-gradient(circle_at_top,#F3F4F6,#D1D5DB,#6B7280)]', text: 'text-gray-800', label: '2', icon: '🥈', border: 'border-gray-300/60' }
  if (rank === 3) return { bg: 'bg-[radial-gradient(circle_at_top,#FFEDD5,#F97316,#7C2D12)]', text: 'text-orange-50', label: '3', icon: '🥉', border: 'border-orange-200/60' }
  return { bg: 'bg-[#252030]', text: 'text-[#F5F0FA]', label: String(rank), icon: null, border: 'border-[#3D3348]' }
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#3D3348] bg-[#2D2538]">
      {url && (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling as HTMLDivElement | null
            fallback?.classList.remove('hidden')
          }}
        />
      )}
      <div className={`flex h-full w-full items-center justify-center text-sm font-bold text-white ${url ? 'hidden' : 'flex'}`}>
        {initial}
      </div>
    </div>
  )
}

function PodiumCard({ entry, rank }: { entry: Row; rank: number }) {
  const style = getRankStyle(rank)
  const score = entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex flex-col items-center rounded-2xl border ${style.border} bg-gradient-to-t ${style.bg} p-4 text-center shadow-lg`}
    >
      <div className="relative mb-2">
        <Avatar url={entry.avatarUrl} name={entry.username} />
        {style.icon && (
          <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white/80 text-xs flex items-center justify-center shadow">
            {style.icon}
          </span>
        )}
      </div>

      <p className={`w-full truncate text-sm font-bold ${style.text}`}>{entry.username}</p>
      <div className="mt-2 flex items-baseline justify-center gap-1">
        <p className={`text-3xl font-black ${style.text}`}>{score}</p>
      </div>
      <div className={`mt-1 flex items-center justify-center gap-2 text-[11px] ${style.text} opacity-80`}>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {entry.quizzesCompleted}
        </span>
        <span className="h-1 w-1 rounded-full bg-black/20" />
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" /> {formatTime(entry.totalTimeSeconds)}
        </span>
      </div>

      <div className="mt-2 rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold text-black/70">
        #{entry.rank}
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ entry, index }: { entry: Row; index: number }) {
  const score = entry.avgBestScore != null ? `${(entry.avgBestScore * 100).toFixed(1)}%` : '—'
  const accuracy = entry.quizzesCompleted > 0
    ? `${Math.round((entry.totalCorrectAnswers / (entry.quizzesCompleted * 20)) * 100)}%`
    : '—'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, delay: 0.05 * index, ease: 'easeOut' }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="flex items-center gap-3 rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-3 transition-all hover:border-[#EC4899]/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1520] text-sm font-bold text-[#F5F0FA]">
        #{entry.rank}
      </div>
      <Avatar url={entry.avatarUrl} name={entry.username} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#F5F0FA]">{entry.username}</p>
        <p className="text-[11px] text-[#8B7A9E]">
          {entry.quizzesCompleted} quiz · {entry.totalCorrectAnswers} câu đúng
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-extrabold text-[#EC4899]">{score}</p>
        <p className="text-[10px] text-[#8B7A9E]">Điểm TB</p>
      </div>
      <div className="hidden sm:block shrink-0 text-right">
        <p className="text-sm font-semibold text-[#F5F0FA]">{accuracy}</p>
        <p className="text-[10px] text-[#8B7A9E]">Độ chính xác</p>
      </div>
      <div className="hidden md:block shrink-0 text-right">
        <p className="text-sm font-semibold text-[#F5F0FA]">{formatTime(entry.totalTimeSeconds)}</p>
        <p className="text-[10px] text-[#8B7A9E]">Thời gian</p>
      </div>
    </motion.div>
  )
}

export default function QuizLeaderboardPage() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['quiz', 'global-leaderboard'],
    queryFn: () =>
      quizApi.getGlobalQuizLeaderboard(50).then((r) => r.data as Row[]),
    staleTime: 60_000,
  })

  const entries = query.data ?? []
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto max-w-4xl space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h1 className="text-lg font-extrabold text-[#F5F0FA]">Bảng xếp hạng Quiz</h1>
            </div>
            <p className="mt-0.5 text-xs text-[#8B7A9E]">
              Xếp hạng theo <span className="font-semibold text-[#F5F0FA]">điểm trung bình tốt nhất</span> qua toàn bộ quiz.
            </p>
          </div>
        </div>

        <Link to="/quiz">
          <Button size="sm" className="gap-1.5">
            <Medal className="h-4 w-4" />
            Làm Quiz
          </Button>
        </Link>
      </div>

      {/* Explanation */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: 'Cách xếp hạng',
            body: 'Lấy điểm trung bình cao nhất của từng người chơi qua tất cả quiz đã làm.',
            accent: 'from-[#EC4899]/20 to-[#F97316]/20',
          },
          {
            title: 'Độ chính xác',
            body: 'Tỷ lệ câu đúng ước lượng từ số quiz đã hoàn thành.',
            accent: 'from-[#10B981]/20 to-[#06B6D4]/20',
          },
          {
            title: 'Mục tiêu',
            body: 'Tập trung vào điểm cao và độ chính xác thay vì tốc độ.',
            accent: 'from-[#F97316]/20 to-[#F59E0B]/20',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className={`rounded-xl border border-[#3D3348] bg-gradient-to-br ${item.accent} p-3`}
          >
            <p className="text-xs font-bold text-[#F5F0FA]">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8B7A9E]">{item.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EC4899] border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!query.isLoading && entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#4A4060] bg-[#252030]/40 py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D2538]">
            <Trophy className="h-7 w-7 text-[#3D3348]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#F5F0FA]">Chưa có dữ liệu</p>
            <p className="mt-1 text-xs text-[#8B7A9E]">Hãy làm quiz để xuất hiện trên bảng xếp hạng.</p>
          </div>
          <Link to="/quiz">
            <Button size="sm">Khám phá Quiz</Button>
          </Link>
        </motion.div>
      )}

      {/* Podium + rest */}
      {!query.isLoading && entries.length > 0 && (
        <div className="space-y-5">
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            animate="show"
          >
            {top3.map((entry) => (
              <PodiumCard key={entry.userId} entry={entry} rank={entry.rank} />
            ))}
          </motion.div>

          <motion.div
            className="space-y-2"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden"
            animate="show"
          >
            {rest.map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} index={entry.rank - 3} />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
