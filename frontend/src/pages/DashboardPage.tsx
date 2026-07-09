import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import {
  ArcElement,
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
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  AlertTriangle, BookOpen, ChevronRight, Compass, FileUp, Flame,
  Globe, Layers, List, Lock, Play, Plus, Search,
  Sparkles, Zap,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
import { reviewApi } from '@/api/review'
import { statsApi } from '@/api/stats'
import { progressApi } from '@/api/progress'
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
  PointElement, Filler, Title, Tooltip, Legend, ArcElement,
)

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE'
type SortMode = 'newest' | 'oldest' | 'az' | 'za'

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

function StreakBanner({ streak, xpToday }: { streak: number; xpToday: number }) {
  const { count: streakCount, ref: streakRef } = useAnimatedCounter(streak, 1000, 0)
  const { count: xpCount, ref: xpRef } = useAnimatedCounter(xpToday, 1000, 200)

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

        <div
          ref={(el) => { (xpRef as any).current = el }}
          className="flex items-center gap-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Zap className="h-7 w-7 text-yellow-300" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">+{xpCount}</p>
            <p className="text-xs text-white/70">XP hôm nay</p>
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

function CardStatsDonut({
  total,
  due,
}: {
  total: number
  due: number
}) {
  const remaining = total - due
  const duePct = total > 0 ? Math.round((due / total) * 100) : 0
  const data = {
    labels: ['Đến hạn', 'Đã học'],
    datasets: [{
      data: [due, Math.max(0, remaining)],
      backgroundColor: [
        'rgba(236,72,153,0.85)',
        'rgba(61,51,72,0.6)',
      ],
      borderColor: [
        '#EC4899',
        '#4A4060',
      ],
      borderWidth: 1,
      hoverOffset: 6,
    }],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#252030',
        borderColor: '#3D3348',
        borderWidth: 1,
        titleColor: '#F5F0FA',
        bodyColor: '#8B7A9E',
        padding: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} thẻ`,
        },
      },
    },
  }
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] w-full h-full flex items-center">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(236,72,153,0.08) 0%, transparent 70%)' }}
      />
      <div className="flex items-center gap-8 w-full relative">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, transparent 70%)' }} />
          <div className="relative h-52 w-52">
            <Doughnut data={data} options={options} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-white drop-shadow-lg">{total}</p>
              <p className="text-sm font-medium text-[#8B7A9E]">Tổng thẻ</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-5">
          {[
            { label: 'Đến hạn', value: due, pct: duePct, color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
            { label: 'Đã học', value: Math.max(0, remaining), pct: 100 - duePct, color: '#4A4060', glow: 'rgba(74,64,96,0.3)' },
          ].map(({ label, value, pct, color, glow }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 8px ${glow}` }} />
                  <span className="text-sm font-medium text-[#8B7A9E]">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">{value}</span>
                  <span className="text-xs font-semibold text-[#8B7A9E] w-10 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#1A1520] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${glow}` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickCard({
  icon: Icon, value, label, color, onClick,
}: {
  icon: typeof Layers; value: string | number; label: string; color: string; onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:shadow-lg w-full flex-1"
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rounded-full opacity-15 blur-xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon className="h-7 w-7" style={{ color }} />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-[#F5F0FA]">{value}</p>
          <p className="text-sm text-[#8B7A9E]">{label}</p>
        </div>
      </div>
    </button>
  )
}

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

function FlashcardSessionBanner({
  deckRef, session, onDismiss,
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

function QuizSessionBanner({
  attemptId: _attemptId,
  quizSlug,
  quizTitle,
  timeRemaining: _timeRemaining,
  onDismiss,
}: {
  attemptId: string
  quizSlug: string | null
  quizTitle: string
  timeRemaining: number | null
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const [displaySeconds, setDisplaySeconds] = useState(_timeRemaining ?? null)

  useEffect(() => {
    if (_timeRemaining !== null) {
      setDisplaySeconds(_timeRemaining)
    }
  }, [_timeRemaining])

  useEffect(() => {
    if (displaySeconds === null || displaySeconds <= 0) return
    const id = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev === null || prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const m = displaySeconds !== null ? Math.floor(displaySeconds / 60) : null
  const s = displaySeconds !== null ? displaySeconds % 60 : null
  const resumeRef = quizSlug ?? _attemptId

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
              {displaySeconds !== null && (
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
            onClick={() => navigate(`/quiz/play/${resumeRef}`)}
          >
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}

function WeeklyChart({ data, days }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined; days: number }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[#252030]" />

  const slice = data.daily.slice(-days)
  const labels = slice.map((d: any) => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('vi-VN', { weekday: 'short' })
  })

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
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[#3D3348] bg-[#252030]/60 p-3">
        <h3 className="mb-2 text-xs font-semibold text-[#F5F0FA]">Thẻ ôn</h3>
        <div className="h-40">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: 'Thẻ',
                  data: slice.map((d: any) => d.cards),
                  backgroundColor: 'rgba(236,72,153,0.7)',
                  borderRadius: 4,
                  barThickness: 16,
                },
              ],
            }}
            options={options}
          />
        </div>
      </div>
      <div className="rounded-xl border border-[#3D3348] bg-[#252030]/60 p-3">
        <h3 className="mb-2 text-xs font-semibold text-[#F5F0FA]">Quiz</h3>
        <div className="h-40">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: 'Quiz',
                  data: slice.map((d: any) => d.quizzes),
                  backgroundColor: 'rgba(249,115,22,0.7)',
                  borderRadius: 4,
                  barThickness: 16,
                },
              ],
            }}
            options={options}
          />
        </div>
      </div>
    </div>
  )
}

function XpTrendChart({ data, days }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined; days: number }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[#252030]" />

  const slice = data.daily.slice(-days)
  const labels = slice.map((d: any) => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'XP kiếm được',
        data: slice.map((d: any) => d.xp),
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

function ActivityHeatmap({ data, days }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined; days: number }) {
  if (!data) return null
  const slice = data.daily.slice(-days)
  const maxXp = Math.max(...slice.map((d: any) => d.xp), 1)

  return (
    <div className="grid grid-cols-7 gap-1">
      {slice.map((d: any, i: number) => {
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

function LibrarySection({
  decks,
  totalDecks,
  loading,
  onCreateOpen,
  onImportOpen,
  sectionRef,
}: {
  decks: ReturnType<typeof useMemo<any[]>>
  totalDecks: number
  loading: boolean
  onCreateOpen: () => void
  onImportOpen: () => void
  sectionRef: (el: HTMLDivElement | null) => void
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
    <div ref={sectionRef} className="space-y-5 scroll-mt-6">
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
          <Button variant="outline" size="md" onClick={onImportOpen}>
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const librarySectionRef = useRef<HTMLDivElement | null>(null)
  const setLibrarySectionRef = useCallback((el: HTMLDivElement | null) => {
    librarySectionRef.current = el
  }, [])

  const scrollToLibrary = () => {
    librarySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Active flashcard session (localStorage)
  const [activeFlashcardSession, setActiveFlashcardSession] = useState<{ deckRef: string; session: StudySession } | null>(null)
  // Active quiz sessions (from API)
  const [activeQuizSession, setActiveQuizSession] = useState<{
    attemptId: string; quizId: string; quizSlug: string | null
    quizTitle: string; timeRemaining: number | null
  } | null>(null)

  useEffect(() => {
    setActiveFlashcardSession(findAnyActiveSession())
  }, [])

  // Fetch active quiz sessions from API
  const qc = useQueryClient()
  const { data: activeQuizSessions } = useQuery({
    queryKey: ['quiz', 'active-sessions'],
    queryFn: () => quizApi.getActiveSessions().then((r) => r.data),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  const quizBannerDismissedRef = useRef(false)

  useEffect(() => {
    if (quizBannerDismissedRef.current) return
    if (activeQuizSessions && activeQuizSessions.length > 0) {
      const s = activeQuizSessions[0]
      setActiveQuizSession({
        attemptId: s.attemptId,
        quizId: s.quizId ?? '',
        quizSlug: s.quizSlug ?? null,
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

  const handleDismissQuizSession = useCallback(async () => {
    if (!activeQuizSession?.attemptId) {
      setActiveQuizSession(null)
      return
    }

    try {
      await quizApi.quitSession(activeQuizSession.attemptId)
    } catch (err) {
      console.error(err)
    } finally {
      quizBannerDismissedRef.current = true
      setActiveQuizSession(null)
      qc.invalidateQueries({ queryKey: ['quiz', 'active-sessions'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'attempts'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'me'] })
      qc.invalidateQueries({ queryKey: ['progress', 'me'] })
      qc.invalidateQueries({ queryKey: ['stats', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['stats', 'activity'] })
    }
  }, [activeQuizSession, qc])

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

  const { data: activityData } = useQuery({
    queryKey: ['stats', 'activity'],
    queryFn: () => statsApi.getActivity({ days: 90 }).then((r) => r.data),
  })

  // Compute this-week totals from activityData (last 7 days)
  const weekTotal = useMemo(() => {
    if (!activityData?.daily) return { cards: 0, quizzes: 0, xp: 0 }
    const last7 = activityData.daily.slice(-7)
    return {
      cards: last7.reduce((s, d) => s + d.cards, 0),
      quizzes: last7.reduce((s, d) => s + d.quizzes, 0),
      xp: last7.reduce((s, d) => s + d.xp, 0),
    }
  }, [activityData])

  // Slices for weekOffset: 0 = this week (last N days up to today), 1 = last week (8-14), 2 = week before (15-21)
  const weekSlice = useMemo(() => {
    if (!activityData?.daily) return []
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun
    const effectiveDay = dayOfWeek === 0 ? 7 : dayOfWeek // Mon=1..Sun=7

    if (weekOffset === 0) {
      // This week: show days 1..effectiveDay (Mon to today)
      const thisWeek = activityData.daily.slice(-effectiveDay)
      return thisWeek
    }
    const base = weekOffset * 7
    return activityData.daily.slice(-(base + 7), base === 0 ? undefined : -base)
  }, [activityData, weekOffset])

  // Days in current week slice for chart rendering
  const chartDays = useMemo(() => {
    if (!activityData?.daily) return 7
    if (weekOffset === 0) {
      const now = new Date()
      return now.getDay() === 0 ? 7 : now.getDay()
    }
    return 7
  }, [activityData, weekOffset])

  // Real progress data (for rank)
  const { data: progressData } = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.getMyProgress().then((r) => r.data),
    staleTime: 60_000,
  })

  const myDecks = data?.content ?? []
  const totalDecks = data?.totalElements ?? 0
  const totalCards = myDecks.reduce((s, d) => s + (d.cardCount ?? 0), 0)
  const suggestedDecks = publicData?.content ?? []

  const recentDecks = useMemo(
    () => [...myDecks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [myDecks],
  )

  const dueQuery = useQuery({
    queryKey: ['review', 'due-total'],
    queryFn: () => reviewApi.getDueCount().then((r) => r.data),
    staleTime: 30_000,
  })

  const totalDue = typeof dueQuery.data === 'number' ? dueQuery.data : 0

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
        <StreakBanner
          streak={progressData?.streak ?? dashboardStats?.streak ?? user?.streak ?? 0}
          xpToday={dashboardStats?.xpToday ?? 0}
        />

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
                  attemptId={activeQuizSession.attemptId}
                  quizSlug={activeQuizSession.quizSlug}
                  quizTitle={activeQuizSession.quizTitle}
                  timeRemaining={activeQuizSession.timeRemaining}
                  onDismiss={handleDismissQuizSession}
                />
              )}
            </div>
          </section>
        )}

        {/* ── Quick stats + Heatmap ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <CardStatsDonut total={totalCards} due={totalDue} />
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Heatmap row */}
            <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#F5F0FA]">
                  {weekOffset === 0 ? 'Tuần này' : weekOffset === 1 ? 'Tuần trước' : `Tuần ${weekOffset} trước`}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={weekOffset >= 2}
                    onClick={() => setWeekOffset((o) => Math.min(3, o + 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ‹
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#8B7A9E] min-w-[60px] text-center">
                    {weekOffset === 0 ? 'Tuần này' : weekOffset === 1 ? 'Tuần trước' : `Trước nữa`}
                  </span>
                  <button
                    type="button"
                    disabled={weekOffset <= 0}
                    onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
              <ActivityHeatmap data={{ daily: weekSlice }} days={chartDays} />
              <div className="mt-2 flex items-center gap-2 text-[10px] text-[#8B7A9E]">
                <span>Ít</span>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={cn('h-3 w-3 rounded-sm', [
                    'bg-[#3D3348]', 'bg-[rgba(236,72,153,0.25)]', 'bg-[rgba(236,72,153,0.5)]',
                    'bg-[rgba(236,72,153,0.75)]', 'bg-[#EC4899]',
                  ][i])} />
                ))}
                <span>Nhiều</span>
              </div>
            </div>
            {/* QuickCard row */}
            <div className="flex gap-4">
              <QuickCard icon={Layers} value={totalDecks} label="Deck của bạn" color="#10B981" onClick={scrollToLibrary} />
              <QuickCard icon={Sparkles} value={`${dashboardStats?.quizzesToday ?? 0}`} label="Quiz hôm nay" color="#06B6D4" />
            </div>
          </div>
        </div>

        {/* ── Stats charts ── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📊 Hoạt động
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-[#EC4899]/20 px-3 py-1.5 text-[#EC4899]">
                <span className="font-semibold">Hôm nay:</span>
                <span>{dashboardStats?.cardsToday ?? 0} thẻ</span>
                <span className="text-white/50">·</span>
                <span>{dashboardStats?.quizzesToday ?? 0} quiz</span>
              </div>
              <div className="flex items-center gap-2 text-[#8B7A9E]">
                <span className="font-semibold">7 ngày:</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#EC4899]" /> {weekTotal.cards} thẻ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> {weekTotal.quizzes} quiz
                </span>
                <span className="flex items-center gap-1 text-[#EC4899] font-semibold">
                  ⚡ {weekTotal.xp} XP
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Weekly bar chart */}
            <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#F5F0FA]">
                  {weekOffset === 0 ? 'Hoạt động tuần này' : `Hoạt động ${weekOffset === 1 ? 'tuần trước' : `tuần ${weekOffset} trước`}`}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={weekOffset >= 2}
                    onClick={() => setWeekOffset((o) => Math.min(3, o + 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ‹
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#8B7A9E] min-w-[80px] text-center">
                    {weekOffset === 0 ? 'Tuần này' : weekOffset === 1 ? 'Tuần trước' : `Trước nữa`}
                  </span>
                  <button
                    type="button"
                    disabled={weekOffset <= 0}
                    onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
              <WeeklyChart data={{ daily: weekSlice }} days={chartDays} />
            </div>

            {/* XP trend */}
            <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#F5F0FA]">
                  XP {weekOffset === 0 ? 'tuần này' : weekOffset === 1 ? 'tuần trước' : 'trước nữa'}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={weekOffset >= 2}
                    onClick={() => setWeekOffset((o) => Math.min(3, o + 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ‹
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#8B7A9E] min-w-[80px] text-center">
                    {weekOffset === 0 ? 'Tuần này' : weekOffset === 1 ? 'Tuần trước' : `Trước nữa`}
                  </span>
                  <button
                    type="button"
                    disabled={weekOffset <= 0}
                    onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                    className="rounded-lg border border-[#3D3348] bg-[#252030] px-2 py-1 text-xs text-[#8B7A9E] disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
              <XpTrendChart data={{ daily: weekSlice }} days={chartDays} />
            </div>
          </div>
        </section>

        {/* ── Library management ── */}
        <LibrarySection
          decks={myDecks}
          totalDecks={totalDecks}
          loading={isLoading}
          onCreateOpen={() => setCreateOpen(true)}
          onImportOpen={() => setImportOpen(true)}
          sectionRef={setLibrarySectionRef}
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
