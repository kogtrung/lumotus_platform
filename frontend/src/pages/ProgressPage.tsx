import React from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BookOpen, Flame, Star, Target, TrendingUp, Trophy, Zap,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { progressApi } from '@/api/progress'
import { reviewApi } from '@/api/review'
import { cn } from '@/utils/cn'

// ─── Animated counter ─────────────────────────────────────────────────────────

function useAnimatedCounter(end: number, duration = 1500, delay = 0) {
  const [count, setCount] = React.useState(0)
  const [started, setStarted] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true) },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  React.useEffect(() => {
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, value, label, sub, color, delay = 0,
}: {
  icon: typeof Star; value: number; label: string; sub?: string; color: string; delay?: number
}) {
  const { count, ref } = useAnimatedCounter(value, 1200, delay)
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#252030]/80 border border-[#3D3348] p-3 sm:p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#EC4899]/30 hover:shadow-xl"
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#F5F0FA]">{count.toLocaleString()}</p>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[#F5F0FA]">{label}</p>
          {sub && <p className="mt-0.5 text-[10px] sm:text-xs text-[#8B7A9E]">{sub}</p>}
        </div>
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-lg sm:rounded-xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ─── Deck progress row ────────────────────────────────────────────────────────

function DeckProgressRow({ deck, index }: { deck: any; index: number }) {
  const { data: progress } = useQuery({
    queryKey: ['review', 'deck-progress', deck.id],
    queryFn: () => reviewApi.getDeckProgress({ deckRef: deck.slug }).then((r) => r.data),
    staleTime: 60_000,
  })

  const total = progress?.totalCards ?? deck.cardCount ?? 0
  const learned = progress?.learnedCards ?? 0
  const mastered = progress?.masteredCards ?? 0
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 sm:gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/60 p-3 sm:p-4 transition-all hover:border-[#EC4899]/30',
        'animate-fade-in',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Cover */}
      <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-[#2D2538]">
        {deck.coverImageUrl
          ? <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
          : <BookOpen className="mx-auto mt-2.5 sm:mt-3 h-5 w-5 sm:h-6 sm:w-6 text-[#EC4899]" />
        }
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-bold text-[#F5F0FA]">{deck.title}</p>
        <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#8B7A9E]">
          <span>{total} thẻ</span>
          <span className="text-[#10B981]">{learned} đã học</span>
          <span className="text-[#F97316]">{mastered} thành thạo</span>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-20 sm:w-24 md:w-28 h-1.5 sm:h-2 rounded-full bg-[#3D3348] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-[#8B7A9E] w-8 sm:w-10 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

const HEATMAP_COLORS = [
  '#2D2538',
  '#9be9a8',
  '#40c463',
  '#30a14e',
  '#216e39',
]

function HeatmapStrip({ data, streak }: {
  data: { date: string; cards: number; quizzes: number; xp: number }[] | undefined
  streak: number
}) {
  const currentYear = new Date().getFullYear()
  const today = new Date()
  const [selectedYear, setSelectedYear] = React.useState(currentYear)

  const yearData = data?.filter(d => d.date.startsWith(String(selectedYear)))
  const maxXp = yearData && yearData.length > 0 ? Math.max(...yearData.map(d => d.xp), 1) : 1
  const map = new Map((yearData ?? []).map(d => [d.date, d]))

  // Build weeks grid (columns = weeks, rows = days Mon-Sun)
  // Jan 1 may not be Monday, so days before it in week 1 are empty
  const weeks: { date: Date; dateStr: string }[][] = []

  const yearStart = new Date(selectedYear, 0, 1)
  const dayOfWeek = yearStart.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

  // Jan 1 is Monday (1) -> firstWeek starts with Jan 1
  // Jan 1 is Tue-Sat -> Sun-Mon before it are empty
  // Jan 1 is Sun (0) -> only Sun before it is empty
  const emptyDays = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : dayOfWeek

  // Create first week with empty placeholders
  const firstWeek: { date: Date; dateStr: string }[] = []
  for (let i = 0; i < emptyDays; i++) {
    firstWeek.push({ date: new Date(0), dateStr: '' })
  }
  for (let i = 0; i < 7 - emptyDays; i++) {
    const d = new Date(yearStart)
    d.setDate(yearStart.getDate() + i)
    firstWeek.push({ date: d, dateStr: d.toISOString().split('T')[0] })
  }
  weeks.push(firstWeek)

  // Build remaining weeks
  let currentDate = new Date(yearStart)
  currentDate.setDate(yearStart.getDate() + (7 - emptyDays))
  const yearEnd = new Date(selectedYear, 11, 31)
  const endDate = selectedYear === currentYear ? today : yearEnd

  while (currentDate <= endDate) {
    const week: { date: Date; dateStr: string }[] = []
    for (let d = 0; d < 7; d++) {
      if (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        week.push({ date: new Date(currentDate), dateStr })
      } else {
        week.push({ date: new Date(0), dateStr: '' })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]

  const getMonthLabel = (weekIdx: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const week = weeks[weekIdx]
    const firstDay = week.find(d => d.dateStr)?.date
    if (!firstDay || firstDay.getFullYear() !== selectedYear) return null
    const month = firstDay.getMonth()
    const prevWeek = weeks[weekIdx - 1]
    const prevMonth = prevWeek?.find(d => d.dateStr)?.date?.getMonth()
    if (weekIdx === 0 || prevMonth !== month) {
      return months[month]
    }
    return null
  }

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4 sm:p-5 md:p-6">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm sm:text-base font-bold text-[#F5F0FA]">Contribution</p>
          <div className="flex gap-1">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-2 py-0.5 text-[11px] sm:text-xs rounded transition-colors ${
                  year === selectedYear
                    ? 'bg-[#EC4899] text-white'
                    : 'text-[#8B7A9E] hover:text-[#F5F0FA]'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <Link
            to="/leaderboard"
            className="text-[11px] sm:text-xs font-semibold text-[#EC4899] hover:text-[#F97316] transition-colors"
          >
            Xem bảng xếp hạng →
          </Link>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#8B7A9E]">
          <Flame className="h-3.5 w-3.5 text-[#EF4444]" />
          {streak} ngày streak
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col gap-1.5 mr-2 pt-5">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[14px] w-8 flex items-center">
                {label && (
                  <span className="text-[10px] text-[#8B7A9E]">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Month labels + Weeks */}
          <div className="flex flex-col">
            {/* Month labels row */}
            <div className="flex gap-1.5 mb-1.5 h-5">
              {weeks.map((week, weekIdx) => {
                const label = getMonthLabel(weekIdx)
                return (
                  <div key={weekIdx} className="h-full w-[14px]">
                    {label && (
                      <span className="text-[10px] text-[#8B7A9E] whitespace-nowrap">{label}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Weeks grid */}
            <div className="flex gap-1.5">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1.5">
                  {week.map((day, dayIdx) => {
                    if (!day.dateStr) {
                      return <div key={dayIdx} className="h-[14px] w-[14px]" />
                    }
                    const entry = map.get(day.dateStr)
                    const xp = entry?.xp ?? 0
                    const intensity = xp > 0 ? Math.max(1, Math.ceil((xp / maxXp) * 4)) : 0
                    const isToday = day.dateStr === today.toISOString().split('T')[0]

                    return (
                      <div
                        key={dayIdx}
                        title={`${day.date.toLocaleDateString('vi')}: ${xp} XP · ${entry?.cards ?? 0} thẻ · ${entry?.quizzes ?? 0} quiz`}
                        className="h-[14px] w-[14px] transition-transform hover:scale-125 cursor-pointer"
                        style={{
                          backgroundColor: HEATMAP_COLORS[intensity],
                          border: isToday ? '1.5px solid #EC4899' : '1px solid rgba(139, 122, 158, 0.2)',
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[#8B7A9E]">
        <span>Less</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} className="h-[14px] w-[14px]" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  // Real progress data from API
  const { data: progressData } = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.getMyProgress().then((r) => r.data),
    staleTime: 60_000,
  })

  // My decks
  const { data: decksData } = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 50 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 50 }).then((r) => r.data),
  })

  const decks = decksData?.content ?? []
  const totalDecks = decksData?.totalElements ?? 0

  const deckProgressQueries = useQueries({
    queries: decks.slice(0, 10).map((deck) => ({
      queryKey: ['review', 'deck-progress', deck.id],
      queryFn: () => reviewApi.getDeckProgress({ deckRef: deck.slug }).then((r) => r.data),
      staleTime: 60_000,
    })),
  })

  const totalCards = decks.reduce((s, d) => s + (d.cardCount ?? 0), 0)
  const totalLearned = deckProgressQueries.reduce((s, q) => s + (q.data?.learnedCards ?? 0), 0)
  const totalMastered = deckProgressQueries.reduce((s, q) => s + (q.data?.masteredCards ?? 0), 0)

  const xp = progressData?.xp ?? 0
  const streak = progressData?.streak ?? 0
  const rank = progressData?.rank ?? null
  const totalParticipants = progressData?.totalParticipants ?? 0
  const heatmap = progressData?.heatmap

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#EC4899]">
            <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
            Tiến độ
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#F5F0FA]">Hành trình học tập</h1>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-[#8B7A9E]">
            Theo dõi streak, XP và tiến độ học tập của bạn
          </p>
        </div>
      </div>

      {/* ── Streak + XP hero banner ── */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#F97316] p-4 sm:p-5 md:p-6 shadow-xl">
        <div className="absolute -top-1/2 -right-1/4 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-[#EC4899]/25 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#F97316]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4 sm:gap-5 md:gap-6">
          {/* Streak */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="relative">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Flame className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white fill-white/30" />
              </div>
              {streak >= 7 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 animate-bounce rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-lg">
                  🔥
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{streak}</p>
              <p className="text-white/70 text-xs sm:text-sm">Ngày streak</p>
            </div>
          </div>

          {/* XP */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-yellow-300 fill-yellow-300/30" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{xp.toLocaleString()}</p>
              <p className="text-white/70 text-xs sm:text-sm">XP tổng cộng</p>
            </div>
          </div>

          {/* Rank */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-pink-200" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
                {rank != null ? `#${rank}` : '—'}
              </p>
              <p className="text-white/70 text-xs sm:text-sm">/{totalParticipants} học sinh</p>
            </div>
          </div>
        </div>

        {/* Progress to streak goal */}
        <div className="relative mt-4 sm:mt-5">
          <div className="h-1.5 sm:h-2 rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000"
              style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-white/60">
            {streak >= 30
              ? '🎉 Mục tiêu 30 ngày hoàn thành!'
              : `${30 - streak} ngày nữa để đạt mốc 30 ngày`}
          </p>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} value={totalDecks} label="Deck của bạn" sub="Tổng cộng" color="#EC4899" delay={0} />
        <StatCard icon={Star} value={totalCards} label="Tổng thẻ" sub="Trên tất cả deck" color="#10B981" delay={100} />
        <StatCard icon={TrendingUp} value={totalLearned} label="Đã học" sub="Thẻ đang học" color="#F97316" delay={200} />
        <StatCard icon={Target} value={totalMastered} label="Thành thạo" sub="Đã hoàn thành" color="#A78BFA" delay={300} />
      </div>

      {/* ── Heatmap ── */}
      <HeatmapStrip data={heatmap} streak={streak} />

      {/* ── Deck progress list ── */}
      {decks.length > 0 && (
        <div>
          <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#EC4899]" />
            <h2 className="text-base sm:text-lg font-bold text-[#F5F0FA]">Tiến độ theo deck</h2>
          </div>
          <div className="space-y-2">
            {decks.slice(0, 10).map((deck, i) => (
              <DeckProgressRow key={deck.id} deck={deck} index={i} />
            ))}
          </div>
          {decks.length > 10 && (
            <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-[#8B7A9E]">
              +{decks.length - 10} deck khác
            </p>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {decks.length === 0 && (
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#3D3348] bg-[#252030]/60 p-8 sm:p-10 md:p-12 text-center">
          <div className="pointer-events-none absolute -top-1/2 -right-1/2 h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 rounded-full bg-[#EC4899]/5 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#EC4899] to-[#F97316] shadow-lg">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#F5F0FA]">Bắt đầu hành trình</h2>
            <p className="mx-auto mt-1.5 sm:mt-2 max-w-xs sm:max-w-sm text-xs sm:text-sm text-[#8B7A9E]">
              Tạo deck đầu tiên hoặc khám phá kho deck công khai để bắt đầu học.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
