import React from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BookOpen, Flame, Star, Zap, Trophy,
} from 'lucide-react'
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
import { decksApi } from '@/api/decks'
import { progressApi } from '@/api/progress'
import { reviewApi } from '@/api/review'
import { statsApi } from '@/api/stats'
import { cn } from '@/utils/cn'
import StreakProgressBar from '@/components/ui/StreakProgressBar'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Filler, Title, Tooltip, Legend, ArcElement,
)


// ─── Stat card ────────────────────────────────────────────────────────────────

// StatCard has been removed

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
        'flex items-center gap-3 sm:gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 sm:p-4 transition-all hover:border-[var(--color-primary)]/30',
        'animate-fade-in',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Cover */}
      <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-[var(--color-bg)]">
        {deck.coverImageUrl
          ? <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
          : <BookOpen className="mx-auto mt-2.5 sm:mt-3 h-5 w-5 sm:h-6 sm:w-6 text-[#EC4899]" />
        }
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-bold text-[var(--color-text)]">{deck.title}</p>
        <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[var(--color-text-muted)]">
          <span>{total} thẻ</span>
          <span className="text-[var(--color-success)]">{learned} đã học</span>
          <span className="text-[var(--color-warning)]">{mastered} thành thạo</span>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-20 sm:w-24 md:w-28 h-1.5 sm:h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-warning)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-[var(--color-text-muted)] w-8 sm:w-10 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

const HEATMAP_COLORS = [
  'var(--color-border)', // empty cell
  '#6ee7b7', // emerald-300
  '#34d399', // emerald-400
  '#10b981', // emerald-500
  '#059669', // emerald-600
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

  const getLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dDay = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dDay}`
  }

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
    firstWeek.push({ date: d, dateStr: getLocalYYYYMMDD(d) })
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
        const dateStr = getLocalYYYYMMDD(currentDate)
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
    <div className="w-full p-4 sm:p-5">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm sm:text-base font-bold text-[var(--color-text)]">Đóng góp</p>
          <div className="flex gap-1">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-2 py-0.5 text-[11px] sm:text-xs rounded transition-colors ${
                  year === selectedYear
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
            <Link
            to="/leaderboard"
            className="text-[11px] sm:text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-warning)] transition-colors"
          >
            Xem bảng xếp hạng →
          </Link>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[var(--color-text-muted)]">
          <Flame className="h-3.5 w-3.5 text-[var(--color-danger)]" />
          {streak} ngày streak
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="sticky left-0 bg-[var(--color-surface)] z-10 flex flex-col gap-1.5 pr-3 pt-5">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[14px] w-7 flex items-center">
                {label && (
                  <span className="text-[9px] font-medium tracking-tighter text-[var(--color-text-muted)]">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Month labels + Weeks */}
          <div className="flex flex-col">
            {/* Month labels row */}
            <div className="flex gap-1 mb-1 h-4">
              {weeks.map((_, weekIdx) => {
                const label = getMonthLabel(weekIdx)
                return (
                  <div key={weekIdx} className="h-full w-[14px]">
                    {label && (
                      <span className="text-[9px] font-medium tracking-tight text-[var(--color-text-muted)] whitespace-nowrap">{label}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Weeks grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => {
                    if (!day.dateStr) {
                      return <div key={dayIdx} className="h-[14px] w-[14px]" />
                    }
                    const entry = map.get(day.dateStr)
                    const xp = entry?.xp ?? 0
                    const intensity = xp > 0 ? Math.max(1, Math.ceil((xp / maxXp) * 4)) : 0
                    const isToday = day.dateStr === getLocalYYYYMMDD(today)

                    return (
                      <div
                        key={dayIdx}
                        title={`${day.date.toLocaleDateString('vi')}: ${xp} XP · ${entry?.cards ?? 0} thẻ · ${entry?.quizzes ?? 0} quiz`}
                        className="h-[14px] w-[14px] transition-transform hover:scale-125 cursor-pointer rounded-[2px]"                        style={{
                          backgroundColor: HEATMAP_COLORS[intensity],
                          border: isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
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
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-text-muted)]">
        <span>Less</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} className="h-[14px] w-[14px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function CardStatsDonut({ total, due, mastered }: { total: number; due: number; mastered: number }) {
  const safeLearned = Math.max(0, total - mastered - due)
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const safeLearnedPct = total > 0 ? Math.round((safeLearned / total) * 100) : 0
  const duePct = total > 0 ? Math.round((due / total) * 100) : 0

  const data = {
    labels: ['Thành thạo', 'Đang học', 'Đến hạn'],
    datasets: [{
      data: [mastered, safeLearned, due],
      backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(236, 72, 153, 0.85)', 'rgba(91, 33, 182, 0.85)'],
      borderColor: ['#10B981', '#EC4899', '#5B21B6'],
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
        backgroundColor: '#252030', borderColor: '#3D3348', borderWidth: 1,
        titleColor: '#F5F0FA', bodyColor: '#8B7A9E', padding: 10,
      },
    },
  }
  return (
      <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-3 sm:p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-xl w-full h-full flex items-center">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full relative">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, transparent 70%)' }} />
          <div className="relative h-40 w-40 sm:h-44 sm:w-44 lg:h-48 lg:w-48">
            <Doughnut data={data} options={options} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl sm:text-4xl font-black text-[var(--color-text)] drop-shadow-sm leading-none mb-1">{total}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tổng thẻ</p>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full space-y-4">
          {[
            { label: 'Thành thạo', value: mastered, pct: masteredPct, color: '#10B981', glow: 'rgba(16,185,129,0.3)' },
            { label: 'Đang học', value: safeLearned, pct: safeLearnedPct, color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
            { label: 'Đến hạn', value: due, pct: duePct, color: '#5B21B6', glow: 'rgba(91,33,182,0.3)' },
          ].map(({ label, value, pct, color, glow }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 8px ${glow}` }} />
                  <span className="text-[11px] sm:text-xs font-medium text-[var(--color-text)]">{label}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm sm:text-base font-bold text-[var(--color-text)]">{value}</span>
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 sm:h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${glow}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeeklyChart({ data, weekOffset }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined; weekOffset: number }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-surface)]/60" />
  
  // Calculate index window for the selected week
  // weekOffset = 0 means the last 7 days. weekOffset = 1 means 8-14 days ago, etc.
  const endIdx = data.daily.length - (weekOffset * 7);
  const startIdx = Math.max(0, endIdx - 7);
  const slice = data.daily.slice(startIdx, endIdx);
  
  const labels = slice.map((d: any) => {
    const date = new Date(d.date);
    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return [weekday, dayMonth];
  })
  
  const chartProps = { 
    textColor: '#9ca3af', 
    gridColor: 'rgba(156, 163, 175, 0.1)' 
  }

  return (
    <div className="grid h-full w-full gap-4 sm:grid-cols-2">
      <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
        <h3 className="mb-2 text-[11px] sm:text-xs font-semibold text-[var(--color-text)]">Thẻ ôn</h3>
        <div className="flex-1 min-h-[140px]">
          <Bar
            data={{
              labels,
              datasets: [{ label: 'Thẻ', data: slice.map((d: any) => d.cards), backgroundColor: 'rgba(236,72,153,0.7)', borderRadius: 4, barThickness: 10 }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: chartProps.textColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: chartProps.textColor, font: { size: 9 } }, border: { display: false }, grid: { color: chartProps.gridColor }, beginAtZero: true } } }}
          />
        </div>
      </div>
      <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
        <h3 className="mb-2 text-[11px] sm:text-xs font-semibold text-[var(--color-text)]">Quiz</h3>
        <div className="flex-1 min-h-[140px]">
          <Bar
            data={{
              labels,
              datasets: [{ label: 'Quiz', data: slice.map((d: any) => d.quizzes), backgroundColor: 'rgba(249,115,22,0.7)', borderRadius: 4, barThickness: 10 }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: chartProps.textColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: chartProps.textColor, font: { size: 9 } }, border: { display: false }, grid: { color: chartProps.gridColor }, beginAtZero: true } } }}
          />
        </div>
      </div>
    </div>
  )
}

const alwaysShowDataPlugin = {
  id: 'alwaysShowData',
  afterDatasetsDraw: (chart: any) => {
    const { ctx, data } = chart;
    ctx.save();
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#EC4899';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    chart.getDatasetMeta(0).data.forEach((datapoint: any, index: number) => {
      const val = data.datasets[0].data[index];
      if (val > 0) {
        ctx.fillText(val.toString(), datapoint.x, datapoint.y - 6);
      }
    });
    ctx.restore();
  }
}

function XpTrendChart({ data, days }: { data: { daily: { date: string; cards: number; quizzes: number; xp: number }[] } | undefined; days: number }) {
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg)]" />
  const slice = data.daily.slice(-days)
  const labels = slice.map((d: any) => {
    const date = new Date(d.date);
    if (days === 7) {
      const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      return [weekday, dayMonth];
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  });
  
  const chartProps = { 
    textColor: '#9ca3af', 
    gridColor: 'rgba(156, 163, 175, 0.1)' 
  }

  // Calculate minimum width based on data points to enable horizontal scrolling
  const minWidthStr = slice.length > 10 ? `${slice.length * 40}px` : '100%';

  return (
    <div className="h-40 sm:h-full min-h-[220px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-inner overflow-x-auto overflow-y-hidden custom-scrollbar">
      <div className="h-full px-2 py-4 sm:px-3 flex items-center" style={{ minWidth: minWidthStr }}>
        <div className="w-full h-full min-h-[160px]">
          <Line
            data={{
            labels,
            datasets: [{ 
              label: 'XP', 
              data: slice.map((d: any) => d.xp), 
              borderColor: '#EC4899', 
              backgroundColor: 'rgba(236,72,153,0.15)', 
              fill: true, 
              tension: 0.4, 
              pointRadius: 2.5, 
              borderWidth: 1.5,
              pointBackgroundColor: '#EC4899' 
            }],
          }}
          options={{ 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
              legend: { display: false },
              tooltip: { enabled: false } // Disabled tooltip since labels are always visible
            }, 
            scales: { 
              x: { ticks: { color: chartProps.textColor, font: { size: 10 } }, grid: { display: false } }, 
              y: { 
                ticks: { color: chartProps.textColor, font: { size: 10 } },
                grid: { color: chartProps.gridColor },
                border: { display: false },
                suggestedMax: Math.max(...slice.map((d: any) => d.xp)) * 1.2 || 10 // Give some top padding for text labels
              } 
            } 
          }}
          plugins={[alwaysShowDataPlugin]}
        />
        </div>
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
  const totalMastered = deckProgressQueries.reduce((s, q) => s + (q.data?.masteredCards ?? 0), 0)

  const xp = progressData?.xp ?? 0
  const streak = progressData?.streak ?? 0
  const heatmap = progressData?.heatmap

  // Due data
  const { data: dueData } = useQuery({
    queryKey: ['review', 'due-total'],
    queryFn: () => reviewApi.getDueCount().then(r => r.data),
  })
  const totalDue = typeof dueData === 'number' ? dueData : 0

  // Activity Data for Charts
  const { data: activityData } = useQuery({
    queryKey: ['stats', 'activity'],
    queryFn: () => statsApi.getActivity({ days: 90 }).then(r => r.data),
  })
  
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [xpTimeFilter, setXpTimeFilter] = React.useState<7 | 14 | 30 | 90>(30);
  
  const chartSlice = React.useMemo(() => {
    if (!activityData?.daily) return []
    return activityData.daily.slice(-xpTimeFilter)
  }, [activityData, xpTimeFilter])

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#EC4899]">
            <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
            Tiến độ
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--color-text)]">Hành trình học tập</h1>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-[var(--color-text-muted)]">
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

          {/* Rank */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 border-l border-white/20 pl-4 sm:pl-5 md:pl-6">
            <div>
              <p className="text-sm sm:text-base font-semibold text-white/80">Xếp hạng hiện tại</p>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">{progressData?.rank ? `#${progressData.rank}` : '-'}</h2>
                {progressData?.totalParticipants && (
                  <span className="text-xs text-white/70 mt-3">/ {progressData.totalParticipants}</span>
                )}
              </div>
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

          {/* Total Deck (Replaced Rank) */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white fill-white/20" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{totalDecks}</p>
              <p className="text-white/70 text-xs sm:text-sm">Tổng deck đã lưu</p>
            </div>
          </div>
        </div>

        {/* Progress to streak goal */}
        <StreakProgressBar streak={streak} />
      </div>

      {/* ── Charts Section (Row-based for height alignment) ── */}
      <div className="flex flex-col gap-4 sm:gap-6">
        
        {/* ROW 1: Donut + XP Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <CardStatsDonut total={totalCards} due={totalDue} mastered={totalMastered} />
          
          <div className="rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 sm:p-5 flex flex-col h-full">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Xu hướng XP</h3>
              <div className="flex items-center gap-1 bg-[var(--color-bg)] rounded-xl p-1 border border-[var(--color-border)]">
                {([7, 14, 30, 90] as const).map((days) => (
                  <button 
                    key={days}
                    onClick={() => setXpTimeFilter(days)} 
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all", 
                      xpTimeFilter === days ? "bg-[var(--color-primary)] text-white shadow" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    {days}N
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <XpTrendChart data={{ daily: chartSlice }} days={xpTimeFilter} />
            </div>
          </div>
        </div>

        {/* ROW 2: Heatmap + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <div className="rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 flex h-full">
            <HeatmapStrip data={heatmap} streak={streak} />
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 sm:p-5 flex flex-col h-full">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                So sánh số liệu
              </h3>
              
              {/* Week Paginator */}
              <div className="flex items-center gap-2 bg-[var(--color-bg)] rounded-xl p-1 border border-[var(--color-border)]">
                <button 
                  onClick={() => setWeekOffset(w => Math.min(w + 1, 10))} // max 10 weeks backward ~70 days limit
                  disabled={weekOffset >= 10}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Tuần trước"
                >
                  &larr;
                </button>
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-primary)] w-16 text-center">
                  {weekOffset === 0 ? "Tuần này" : weekOffset === 1 ? "Tuần trước" : `Tuần -${weekOffset}`}
                </span>
                <button 
                  onClick={() => setWeekOffset(w => Math.max(w - 1, 0))}
                  disabled={weekOffset === 0}
                  className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Tuần sau"
                >
                  &rarr;
                </button>
              </div>
            </div>
            <div className="flex-1 h-full min-h-[140px]">
              <WeeklyChart data={activityData} weekOffset={weekOffset} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Deck progress list ── */}
      {decks.length > 0 && (
        <div>
          <div className="mb-3 sm:mb-4 flex h-8 items-center gap-1.5 sm:gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary)]" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] leading-none">Tiến độ theo deck</h2>
          </div>
          <div className="space-y-2">
            {decks.slice(0, 10).map((deck, i) => (
              <DeckProgressRow key={deck.id} deck={deck} index={i} />
            ))}
          </div>
          {decks.length > 10 && (
            <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-[var(--color-text-muted)]">
              +{decks.length - 10} deck khác
            </p>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {decks.length === 0 && (
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-8 sm:p-10 md:p-12 text-center">
          <div className="pointer-events-none absolute -top-1/2 -right-1/2 h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-warning)] shadow-lg">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)]">Bắt đầu hành trình</h2>
            <p className="mx-auto mt-1.5 sm:mt-2 max-w-xs sm:max-w-sm text-xs sm:text-sm text-[var(--color-text-muted)]">
              Tạo deck đầu tiên hoặc khám phá kho deck công khai để bắt đầu học.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
