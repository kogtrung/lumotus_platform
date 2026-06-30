import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import {
  AlertTriangle, BookOpen, ChevronRight, Compass, FileUp, Flame,
  Globe, Layers, List, Lock, Play, Plus, Search,
  Sparkles, Star, Zap,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
import { reviewApi } from '@/api/review'
import { statsApi } from '@/api/stats'
import CreateDeckDialog from '@/components/deck/CreateDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { findAnyActiveSession, clearSession, relativeTime } from '@/utils/studySession'
import type { StudySession } from '@/utils/studySession'
import heroImage from '@/assets/hero.png'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Filler, Title, Tooltip, Legend,
)

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE'
type SortMode = 'newest' | 'oldest' | 'az' | 'za'

// ─── Animated counter ─────────────────────────────────────────────────────────

function useAnimatedCounter(end: number, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = { current: null as HTMLDivElement | null }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true) },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const t = setTimeout(() => {
      let t0: number
      const raf = (ts: number) => {
        if (!t0) t0 = ts
        const p = Math.min((ts - t0) / duration, 1)
        setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end))
        if (p < 1) requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [end, duration, delay, started])

  return { count, ref }
}

// ─── Streak banner ──────────────────────────────────────────────────────────

function StreakBanner({ streak, xp }: { streak: number; xp: number }) {
  const { count: streakCount, ref: streakRef } = useAnimatedCounter(streak, 1000, 0)

  return (
    <div
      ref={(el) => { (streakRef as any).current = el }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#F97316] p-5 shadow-xl"
    >
      <div className="absolute -top-1/2 -right-1/4 w-64 h-64 rounded-full bg-[#EC4899]/30 blur-3xl" />
      <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 rounded-full bg-[#F97316]/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Flame className="h-7 w-7 text-white fill-white/40" />
            </div>
            {streak >= 7 && (
              <span className="absolute -top-2 -right-2 animate-bounce rounded-full bg-[#EF4444] px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                🔥
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{streakCount}</p>
            <p className="text-xs text-white/70">Ngày streak</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Star className="h-7 w-7 text-yellow-300 fill-yellow-300/40" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{xp.toLocaleString()}</p>
            <p className="text-xs text-white/70">XP tổng cộng</p>
          </div>
        </div>

        <Button
          to="/flashcard"
          size="sm"
          className="gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
        >
          <Zap className="h-4 w-4" />
          Học ngay
        </Button>
      </div>

      <div className="relative mt-4">
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-1000"
            style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-white/60">
          {streak >= 30 ? '🎉 Đạt streak 30 ngày!' : `${30 - streak} ngày nữa đến mốc 30`}
        </p>
      </div>
    </div>
  )
}

// ─── Quick stat card ────────────────────────────────────────────────────────

function QuickCard({
  icon: Icon, value, label, color, onClick,
}: {
  icon: typeof BookOpen; value: string | number; label: string; color: string; onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:shadow-lg w-full"
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full opacity-15 blur-xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-lg font-extrabold text-[#F5F0FA]">{value}</p>
          <p className="text-xs text-[#8B7A9E]">{label}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Deck row with real progress ──────────────────────────────────────────────

function DeckRow({ deck }: { deck: any }) {
  const { data: progress } = useQuery({
    queryKey: ['review', 'deck-progress', deck.id],
    queryFn: () => reviewApi.getDeckProgress({ deckRef: deck.slug }).then((r) => r.data),
    staleTime: 60_000,
  })
  const { data: dueData } = useQuery({
    queryKey: ['review', 'due', deck.slug],
    queryFn: () => reviewApi.getDue({ deckRef: deck.slug, limit: 1 }).then((r) => r.data),
    staleTime: 30_000,
  })

  const total = progress?.totalCards ?? deck.cardCount ?? 0
  const learned = progress?.learnedCards ?? 0
  const mastered = progress?.masteredCards ?? 0
  const due = dueData?.dueCount ?? 0
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0

  return (
    <Link
      to={`/decks/${deck.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-4 transition-all hover:-translate-y-0.5 hover:border-[#EC4899]/40 hover:bg-[#2D2538]/40"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#2D2538]">
        {deck.coverImageUrl
          ? <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
          : <Layers className="mx-auto mt-2.5 h-6 w-6 text-[#EC4899]" />
        }
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#F5F0FA] group-hover:text-[#EC4899] transition-colors">
          {deck.title}
        </p>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-[#8B7A9E]">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />{total} thẻ
          </span>
          {due > 0 && (
            <span className="font-semibold text-[#EC4899]">📚 {due} đến hạn</span>
          )}
          {deck.isPublic && <Globe className="h-3 w-3 text-[#10B981]" />}
          {!deck.isPublic && <Lock className="h-3 w-3" />}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-[#3D3348] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#10B981] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#8B7A9E] w-8 text-right">{pct}%</span>
        </div>
        <p className="mt-0.5 text-[10px] text-[#8B7A9E]">
          {mastered} thành thạo
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-[#8B7A9E] transition-transform group-hover:translate-x-1 group-hover:text-[#EC4899]" />
    </Link>
  )
}

// ─── Active flashcard session banner ──────────────────────────────────────────

function FlashcardSessionBanner({
  deckRef,
  session,
  onDismiss,
}: {
  deckRef: string
  session: StudySession
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const stats = session.progress.stats
  const total = session.sessionCardIds.length
  const answered = stats.again + stats.hard + stats.good + stats.easy

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#EC4899]/40 bg-gradient-to-r from-[#831843]/90 via-[#BE185D]/70 to-[#F97316]/50 p-4 shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#EC4899]/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 shadow">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">📖 Học Flashcard</p>
            </div>
            <p className="text-xs text-white/70">
              {answered}/{total} câu đã làm · {relativeTime(session.savedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Bỏ qua
          </button>
          <Button
            size="sm"
            className="gap-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/30"
            onClick={() => navigate(`/flashcard?deck=${encodeURIComponent(deckRef)}&resume=1`)}
          >
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

// ─── Active quiz session banner ────────────────────────────────────────────────

function QuizSessionBanner({
  quizId,
  attemptId: _attemptId,
  quizTitle,
  timeRemaining,
  onDismiss,
}: {
  quizId: string
  attemptId: string
  quizTitle: string
  timeRemaining: number | null
  onDismiss: () => void
}) {
  const navigate = useNavigate()

  const m = timeRemaining !== null ? Math.floor(timeRemaining / 60) : null
  const s = timeRemaining !== null ? timeRemaining % 60 : null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F97316]/40 bg-gradient-to-r from-[#7C2D12]/90 via-[#C2410C]/70 to-[#F97316]/50 p-4 shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#F97316]/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 shadow">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">🎯 Đang làm Quiz</p>
              {timeRemaining !== null && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                  {m}:{s != null ? s.toString().padStart(2, '0') : '00'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 line-clamp-1">{quizTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Bỏ qua
          </button>
          <Button
            size="sm"
            className="gap-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/30"
            onClick={() => navigate(`/quiz/play/${quizId}`)}
          >
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

function WeeklyChart({ data }: { data: { days: { date: string; cards: number; quizzes: number; xp: number }[]; thisWeek: { cards: number; quizzes: number; xp: number }; lastWeek: { cards: number; quizzes: number; xp: number } } | undefined }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[#252030]" />

  const labels = data.days.map((d: any) => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('vi-VN', { weekday: 'short' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Thẻ ôn',
        data: data.days.map((d: any) => d.cards),
        backgroundColor: 'rgba(236,72,153,0.7)',
        borderRadius: 4,
        barThickness: 20,
      },
      {
        label: 'Quiz',
        data: data.days.map((d: any) => d.quizzes * 10), // scale up quizzes
        backgroundColor: 'rgba(249,115,22,0.7)',
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#8B7A9E', font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8B7A9E', font: { size: 11 } },
        grid: { color: '#3D3348' },
      },
      y: {
        ticks: { color: '#8B7A9E', font: { size: 11 } },
        grid: { color: '#3D3348' },
      },
    },
  }

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  )
}

// ─── XP trend line chart ───────────────────────────────────────────────────────

function XpTrendChart({ data }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[#252030]" />

  const last14 = data.daily.slice(-14)
  const labels = last14.map((d: any) => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'XP kiếm được',
        data: last14.map((d: any) => d.xp),
        borderColor: '#EC4899',
        backgroundColor: 'rgba(236,72,153,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#EC4899',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#8B7A9E', font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#8B7A9E', font: { size: 11 } },
        grid: { color: '#3D3348' },
      },
    },
  }

  return (
    <div className="h-48">
      <Line data={chartData} options={options} />
    </div>
  )
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ data }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined }) {
  if (!data) return null
  const days = data.daily.slice(-28)
  const maxXp = Math.max(...days.map((d: any) => d.xp), 1)

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d: any, i: number) => {
        const intensity = d.xp > 0 ? Math.max(1, Math.ceil((d.xp / maxXp) * 4)) : 0
        const colors = [
          'bg-[#3D3348]',
          'bg-[rgba(236,72,153,0.25)]',
          'bg-[rgba(236,72,153,0.5)]',
          'bg-[rgba(236,72,153,0.75)]',
          'bg-[#EC4899]',
        ]
        const date = new Date(d.date)
        const label = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        return (
          <div
            key={i}
            title={`${label}: ${d.xp} XP · ${d.cards} thẻ`}
            className={cn(
              'h-6 w-full rounded-sm transition-all hover:ring-2 hover:ring-[#EC4899]',
              colors[intensity],
            )}
          />
        )
      })}
    </div>
  )
}

// ─── Library section ──────────────────────────────────────────────────────────

function LibrarySection({
  decks,
  totalDecks,
  loading,
  onCreateOpen,
}: {
  decks: ReturnType<typeof useMemo<any[]>>
  totalDecks: number
  loading: boolean
  onCreateOpen: () => void
}) {
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = [...decks]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (d) => d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
      )
    }
    if (visibility === 'PUBLIC') list = list.filter((d) => d.isPublic)
    if (visibility === 'PRIVATE') list = list.filter((d) => !d.isPublic)
    list.sort((a, b) => {
      switch (sort) {
        case 'az': return a.title.localeCompare(b.title, 'vi')
        case 'za': return b.title.localeCompare(a.title, 'vi')
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
    return list
  }, [decks, query, visibility, sort])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F5F0FA]">Thư viện Deck</h2>
          <p className="mt-0.5 text-sm text-[#8B7A9E]">
            <span className="font-bold text-[#EC4899]">{totalDecks}</span> deck ·{' '}
            {totalDecks === 0 ? 'Bắt đầu tạo deck đầu tiên' : 'Quản lý bộ từ của bạn'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-[#3D3348] bg-[#1A1520] p-1">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                  viewMode === mode
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
                )}
              >
                {mode === 'grid' ? <Layers className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Button variant="outline" size="md" onClick={() => navigate('/explore')}>
            <Compass className="h-4 w-4" />
            Khám phá
          </Button>
          <Button variant="outline" size="md" onClick={onCreateOpen}>
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button size="md" onClick={onCreateOpen}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Tạo deck
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm deck..."
            className="h-10 w-full rounded-xl border border-[#3D3348] bg-[#252030]/80 pl-10 pr-4 text-sm text-[#F5F0FA] placeholder:text-[#8B7A9E] shadow-sm transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="h-10 cursor-pointer appearance-none rounded-xl border border-[#3D3348] bg-[#252030]/80 pl-9 pr-8 text-sm font-semibold text-[#F5F0FA] shadow-sm transition-all hover:border-[#EC4899] focus:outline-none"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
        <div className="flex gap-1 rounded-xl border border-[#3D3348] bg-[#1A1520] p-1">
          {([
            { id: 'ALL' as const, label: 'Tất cả' },
            { id: 'PUBLIC' as const, label: 'Công khai' },
            { id: 'PRIVATE' as const, label: 'Riêng tư' },
          ] as const).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setVisibility(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                visibility === f.id
                  ? 'bg-[#EC4899] text-white shadow-sm'
                  : 'text-[#8B7A9E] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
          {Array.from({ length: 8 }).map((_, i) => <DeckGridSkeleton key={i} />)}
        </div>
      )}

      {!loading && totalDecks === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-[#4A4060] bg-[#252030]/40 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F97316] shadow-lg">
            <Sparkles className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-extrabold text-[#F5F0FA]">Thư viện trống</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#8B7A9E]">
            Tạo deck đầu tiên hoặc khám phá kho deck công khai từ cộng đồng.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={onCreateOpen}><Sparkles className="h-4 w-4" />Tạo deck</Button>
            <Button variant="outline" onClick={() => navigate('/explore')}>Khám phá</Button>
          </div>
        </div>
      )}

      {!loading && totalDecks > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#4A4060] bg-[#252030]/40 p-8 text-center">
          <p className="text-sm font-semibold text-[#F5F0FA]">Không có deck phù hợp</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setVisibility('ALL') }}
            className="mt-2 text-xs font-bold text-[#EC4899] hover:underline"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-sm text-[#8B7A9E]">
            Hiển thị <span className="font-bold text-[#F5F0FA]">{filtered.length}</span> /{' '}
            <span className="font-bold text-[#EC4899]">{totalDecks}</span> deck
          </p>
          <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
            {filtered.map((deck) => (
              <DeckCard key={deck.id} deck={deck} variant="library" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  // Active flashcard session (localStorage)
  const [activeFlashcardSession, setActiveFlashcardSession] = useState<{ deckRef: string; session: StudySession } | null>(null)
  // Active quiz sessions (from API)
  const [activeQuizSession, setActiveQuizSession] = useState<{ attemptId: string; quizId: string; quizTitle: string; timeRemaining: number | null } | null>(null)

  useEffect(() => {
    setActiveFlashcardSession(findAnyActiveSession())
  }, [])

  // Fetch active quiz sessions from API
  const { data: activeQuizSessions } = useQuery({
    queryKey: ['quiz', 'active-sessions'],
    queryFn: () => quizApi.getActiveSessions().then((r) => r.data),
    refetchInterval: 60_000, // refresh every minute
  })

  // Pick first active quiz session for banner (show only one at a time)
  useEffect(() => {
    if (activeQuizSessions && activeQuizSessions.length > 0) {
      const s = activeQuizSessions[0]
      setActiveQuizSession({
        attemptId: s.attemptId,
        quizId: s.quizId ?? '',
        quizTitle: s.quizTitle ?? 'Quiz',
        timeRemaining: s.remainingSeconds >= 0 ? s.remainingSeconds : null,
      })
    } else {
      setActiveQuizSession(null)
    }
  }, [activeQuizSessions])

  const handleDismissFlashcardSession = () => {
    if (activeFlashcardSession) {
      clearSession(activeFlashcardSession.deckRef, 'FLASHCARD')
      setActiveFlashcardSession(null)
    }
  }

  const handleDismissQuizSession = () => {
    setActiveQuizSession(null)
  }

  // Open create dialog from ?create=1
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // My decks
  const { data, isLoading } = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 50 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 50 }).then((r) => r.data),
  })

  // Public decks for suggestions
  const { data: publicData } = useQuery({
    queryKey: ['decks', { public: true, page: 0, size: 8 }],
    queryFn: () => decksApi.list({ mine: false, page: 0, size: 8 }).then((r) => r.data),
  })

  // Stats data
  const { data: dashboardStats } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => statsApi.getDashboard().then((r) => r.data),
  })

  const { data: weeklyData } = useQuery({
    queryKey: ['stats', 'weekly'],
    queryFn: () => statsApi.getWeekly().then((r) => r.data),
  })

  const { data: activityData } = useQuery({
    queryKey: ['stats', 'activity', 30],
    queryFn: () => statsApi.getActivity({ days: 30 }).then((r) => r.data),
  })

  const myDecks = data?.content ?? []
  const totalDecks = data?.totalElements ?? 0
  const totalCards = myDecks.reduce((s, d) => s + (d.cardCount ?? 0), 0)
  const suggestedDecks = publicData?.content ?? []

  const recentDecks = useMemo(
    () => [...myDecks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [myDecks],
  )

  const dueQueries = useQueries({
    queries: recentDecks.slice(0, 6).map((deck) => ({
      queryKey: ['review', 'due', deck.slug],
      queryFn: () => reviewApi.getDue({ deckRef: deck.slug, limit: 1 }).then((r) => r.data.dueCount),
      staleTime: 30_000,
    })),
  })

  const dueCounts = Object.fromEntries(recentDecks.slice(0, 6).map((deck, i) => [deck.slug, dueQueries[i]?.data ?? 0]))
  const totalDue = Object.values(dueCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#1A1520' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) saturate(1.2)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1A1520] via-[#252030]/95 to-[#1A1520] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(236,72,153,0.08)_0%,transparent_60%)]" />

      <div className="relative z-10 space-y-10">
        {/* ── Streak banner ── */}
        <StreakBanner streak={user?.streak ?? 0} xp={user?.xp ?? 0} />

        {/* ── Active sessions ── */}
        {(activeFlashcardSession || activeQuizSession) && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-yellow-400">Phiên đang dang dở</h2>
            </div>
            <div className="space-y-2">
              {activeFlashcardSession && (
                <FlashcardSessionBanner
                  deckRef={activeFlashcardSession.deckRef}
                  session={activeFlashcardSession.session}
                  onDismiss={handleDismissFlashcardSession}
                />
              )}
              {activeQuizSession && (
                <QuizSessionBanner
                  quizId={activeQuizSession.quizId}
                  attemptId={activeQuizSession.attemptId}
                  quizTitle={activeQuizSession.quizTitle}
                  timeRemaining={activeQuizSession.timeRemaining}
                  onDismiss={handleDismissQuizSession}
                />
              )}
            </div>
          </section>
        )}

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <QuickCard icon={BookOpen} value={totalDue || '—'} label="Thẻ đến hạn" color="#EC4899" onClick={() => navigate('/flashcard')} />
          <QuickCard icon={Layers} value={totalDecks} label="Deck của bạn" color="#10B981" />
          <QuickCard icon={Star} value={totalCards} label="Tổng thẻ" color="#F97316" />
          <QuickCard icon={Zap} value={`+${dashboardStats?.xpLast7Days ?? user?.xp ?? 0}`} label="XP 7 ngày" color="#A78BFA" />
          <QuickCard icon={Sparkles} value={`${dashboardStats?.quizzesLast7Days ?? 0}`} label="Quiz 7 ngày" color="#06B6D4" />
        </div>

        {/* ── Stats charts ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📊 Hoạt động tuần này
            </h2>
            {weeklyData && (
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#EC4899]" /> {weeklyData.thisWeek.cards} thẻ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> {weeklyData.thisWeek.quizzes} quiz
                </span>
                <span className="flex items-center gap-1 text-[#EC4899] font-semibold">
                  ⚡ {weeklyData.thisWeek.xp} XP
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Weekly bar chart */}
            <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#F5F0FA]">Tuần này</h3>
              <WeeklyChart data={weeklyData} />
            </div>

            {/* XP trend */}
            <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#F5F0FA]">XP 14 ngày qua</h3>
              <XpTrendChart data={activityData} />
            </div>
          </div>

          {/* Activity heatmap */}
          <div className="mt-4 rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#F5F0FA]">Hoạt động 28 ngày</h3>
            <ActivityHeatmap data={activityData} />
            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#8B7A9E]">
              <span>Ít</span>
              {[0,1,2,3,4].map(i => (
                <div key={i} className={cn('h-3 w-3 rounded-sm', [
                  'bg-[#3D3348]', 'bg-[rgba(236,72,153,0.25)]', 'bg-[rgba(236,72,153,0.5)]',
                  'bg-[rgba(236,72,153,0.75)]', 'bg-[#EC4899]',
                ][i])} />
              ))}
              <span>Nhiều</span>
            </div>
          </div>
        </section>

        {/* ── Library management ── */}
        <LibrarySection
          decks={myDecks}
          totalDecks={totalDecks}
          loading={isLoading}
          onCreateOpen={() => setCreateOpen(true)}
        />

        {/* ── Recent decks with real progress ── */}
        {!isLoading && recentDecks.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📋 Deck gần đây
              </h2>
            </div>
            <div className="space-y-2">
              {recentDecks.slice(0, 6).map((deck) => (
                <DeckRow key={deck.id} deck={deck} />
              ))}
            </div>
            {recentDecks.length > 6 && (
              <p className="mt-3 text-center text-sm text-[#8B7A9E]">
                +{recentDecks.length - 6} deck khác
              </p>
            )}
          </section>
        )}

        {/* ── Suggested decks ── */}
        {!isLoading && suggestedDecks.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ✨ Gợi ý từ cộng đồng
              </h2>
              <Link
                to="/explore"
                className="text-sm font-semibold text-[#EC4899] hover:text-[#F97316] flex items-center gap-1 transition-colors"
              >
                Khám phá <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {suggestedDecks.slice(0, 8).map((deck) => (
                <DeckCard key={deck.id} deck={deck} variant="explore" />
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateDeckDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(slug) => navigate(`/decks/${slug}`)}
      />
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(slug) => navigate(`/decks/${slug}`)}
      />
    </div>
  )
}
