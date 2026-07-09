import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  BookOpen,
  FileQuestion,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Tag,
  PlayCircle,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/utils/cn'

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom'

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color,
  delay = 0,
}: {
  icon: typeof Users
  value: number
  label: string
  sub?: string
  color: string
  delay?: number
}) {
  const [visible, setVisible] = useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm p-5 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-15 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold text-gray-900">{value.toLocaleString()}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// Line chart with Y-axis values and smart X-axis date labels
function LineChart({
  data,
  labels,
  color,
  gradientId,
}: {
  data: number[]
  labels: string[]
  color: string
  gradientId: string
}) {
  const maxVal = Math.max(...data, 0)

  // Generate unique nice integer tick values (at most 4, no duplicates)
  const getNiceTicks = (max: number): number[] => {
    if (max === 0) return [0]
    const step = Math.max(1, Math.ceil(max / 3))
    const ticks: number[] = []
    for (let v = 0; v <= max; v += step) ticks.push(v)
    if (ticks[ticks.length - 1] < max) ticks.push(max)
    return ticks
  }
  const yTicks = getNiceTicks(maxVal)
  const effectiveMax = Math.max(maxVal, 1)

  const svgW = 600
  const svgH = 160
  const padLeft = 34  // space for Y-axis labels
  const padRight = 10
  const padTop = 10
  const padBottom = 24  // space for X-axis labels

  const chartW = svgW - padLeft - padRight
  const chartH = svgH - padTop - padBottom

  const toX = (i: number) =>
    padLeft + (data.length <= 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
  const toY = (val: number) =>
    padTop + chartH - (val / effectiveMax) * chartH

  const points = data.map((v, i) => ({ x: toX(i), y: toY(v) }))

  let linePath = ''
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const mx = (points[i - 1].x + points[i].x) / 2
      linePath += ` C ${mx} ${points[i - 1].y} ${mx} ${points[i].y} ${points[i].x} ${points[i].y}`
    }
  }
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
    : ''

  // X-axis: show at most 7 evenly spaced labels
  const maxXLabels = 7
  const xStep = data.length <= maxXLabels ? 1 : Math.ceil(data.length / maxXLabels)
  const xLabelIndices = data.map((_, i) => i).filter((i) => i % xStep === 0 || i === data.length - 1)

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {yTicks.map((val, i) => {
          const y = padTop + chartH - (val / effectiveMax) * chartH
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgW - padRight}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <text
                x={padLeft - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="#9CA3AF"
                fontWeight={600}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill={`url(#${gradientId})`} className="transition-all duration-500" />
        )}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
        )}

        {/* Dots (only when ≤ 20 points) */}
        {data.length <= 20 &&
          points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r={3} fill="white" stroke={color} strokeWidth={2} />
          ))}

        {/* X-axis date labels */}
        {xLabelIndices.map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={svgH - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#9CA3AF"
            fontWeight={600}
          >
            {labels[idx]}
          </text>
        ))}
      </svg>
    </div>
  )
}


function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <BarChart3 className="h-5 w-5 text-pink-500" />
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 30_000,
  })

  // Calculate effective start and end dates
  const getDatesForRange = () => {
    if (timeRange === 'custom') {
      return {
        startDate: customStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: customEnd || new Date().toISOString().split('T')[0]
      }
    }
    const end = new Date()
    const start = new Date()
    if (timeRange === '7d') {
      start.setDate(end.getDate() - 7)
    } else if (timeRange === '30d') {
      start.setDate(end.getDate() - 30)
    } else if (timeRange === '90d') {
      start.setDate(end.getDate() - 90)
    } else if (timeRange === '1y') {
      start.setDate(end.getDate() - 365)
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }

  const { startDate, endDate } = getDatesForRange()

  const {
    data: chartStats,
    isLoading: isChartsLoading,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ['admin', 'chartStats', startDate, endDate],
    queryFn: () => adminApi.getChartStats({ startDate, endDate }).then((r) => r.data),
    staleTime: 30_000,
  })

  const getChartData = () => {
    const labels: string[] = []
    const users: number[] = []
    const decks: number[] = []
    const quizAttempts: number[] = []

    if (chartStats && chartStats.length > 0) {
      chartStats.forEach((dp) => {
        const dateParts = dp.date.split('-')
        labels.push(`${dateParts[2]}/${dateParts[1]}`)
        users.push(dp.newUsers)
        decks.push(dp.newDecks)
        quizAttempts.push(dp.quizAttempts)
      })
    } else {
      labels.push('')
      users.push(0)
      decks.push(0)
      quizAttempts.push(0)
    }

    return { labels, users, decks, quizAttempts }
  }

  const chartData = getChartData()
  const maxUsers = Math.max(...chartData.users, 1)
  const maxDecks = Math.max(...chartData.decks, 1)
  const maxAttempts = Math.max(...chartData.quizAttempts, 1)

  const handleRefreshAll = () => {
    refetch()
    refetchCharts()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tổng quan hệ thống</h1>
            <p className="mt-1 text-sm text-gray-500">Thống kê và hoạt động của Lumotus</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Time range selector */}
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              {(['7d', '30d', '90d', '1y', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    timeRange === r
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  {r === '7d' ? '7 ngày' : r === '30d' ? '30 ngày' : r === '90d' ? '90 ngày' : r === '1y' ? '1 năm' : 'Tùy chọn'}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefreshAll}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
          </div>
        </div>

        {timeRange === 'custom' && (
          <div className="flex items-center gap-3 mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm animate-fade-in w-fit animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Từ:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-pink-500 font-semibold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Đến:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-pink-500 font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100 border border-gray-200" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Users}
              value={stats?.totalUsers ?? 0}
              label="Người dùng"
              sub="Tổng cộng trong hệ thống"
              color="#EC4899"
              delay={0}
            />
            <StatCard
              icon={BookOpen}
              value={stats?.totalDecks ?? 0}
              label="Bộ thẻ (Deck)"
              sub="Đang hoạt động"
              color="#10B981"
              delay={100}
            />
            <StatCard
              icon={FileQuestion}
              value={stats?.totalCards ?? 0}
              label="Thẻ học (Card)"
              sub="Trong hệ thống"
              color="#F97316"
              delay={200}
            />
            <StatCard
              icon={TrendingUp}
              value={stats?.totalQuizzes ?? 0}
              label="Quiz"
              sub="Đã được tạo"
              color="#A78BFA"
              delay={300}
            />
            <StatCard
              icon={PlayCircle}
              value={stats?.totalQuizAttempts ?? 0}
              label="Lượt làm Quiz"
              sub="Tổng lượt attempt"
              color="#06B6D4"
              delay={400}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Users Chart */}
            <ChartCard title="Người dùng mới">
              {isChartsLoading ? (
                <div className="flex h-[160px] items-center justify-center text-xs font-semibold text-gray-400">Đang tải biểu đồ...</div>
              ) : (
                <>
                  <LineChart
                    data={chartData.users}
                    labels={chartData.labels}
                    color="#EC4899"
                    gradientId="user-chart-grad"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span className="text-pink-600">Tổng: {chartData.users.reduce((a, b) => a + b, 0)} người đăng ký mới</span>
                    <span>Max: {maxUsers}/ngày</span>
                  </div>
                </>
              )}
            </ChartCard>

            {/* Decks Chart */}
            <ChartCard title="Bộ thẻ mới">
              {isChartsLoading ? (
                <div className="flex h-[160px] items-center justify-center text-xs font-semibold text-gray-400">Đang tải biểu đồ...</div>
              ) : (
                <>
                  <LineChart
                    data={chartData.decks}
                    labels={chartData.labels}
                    color="#10B981"
                    gradientId="deck-chart-grad"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span className="text-emerald-600">Tổng: {chartData.decks.reduce((a, b) => a + b, 0)} bộ thẻ mới</span>
                    <span>Max: {maxDecks}/ngày</span>
                  </div>
                </>
              )}
            </ChartCard>

            {/* Quizzes Chart → Quiz Attempts */}
            <ChartCard title="Lượt làm Quiz">
              {isChartsLoading ? (
                <div className="flex h-[160px] items-center justify-center text-xs font-semibold text-gray-400">Đang tải biểu đồ...</div>
              ) : (
                <>
                  <LineChart
                    data={chartData.quizAttempts}
                    labels={chartData.labels}
                    color="#06B6D4"
                    gradientId="quiz-chart-grad"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span className="text-cyan-600 font-semibold">Tổng: {chartData.quizAttempts.reduce((a, b) => a + b, 0)} lượt làm quiz</span>
                    <span>Max: {maxAttempts}/ngày</span>
                  </div>
                </>
              )}
            </ChartCard>

            {/* Today's Activity */}
            <ChartCard title="Hoạt động hôm nay">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-emerald-600">{stats?.totalActiveUsersToday ?? 0}</p>
                  <p className="text-xs text-gray-500">Người hoạt động</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-orange-600">{stats?.totalReviewsToday ?? 0}</p>
                  <p className="text-xs text-gray-500">Lượt ôn tập</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-purple-600">{(stats?.totalXpAwardedToday ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">XP được tặng</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-cyan-600">{stats?.totalQuizAttempts?.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-gray-500">Tổng lượt quiz</p>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Thao tác nhanh</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <a
                href="/admin/decks"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-50/50"
              >
                <BookOpen className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900">Quản lý Deck</p>
                  <p className="text-xs text-gray-500">Xem và duyệt bộ thẻ</p>
                </div>
              </a>
              <a
                href="/admin/quizzes"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-orange-500/50 hover:bg-orange-50/50"
              >
                <FileQuestion className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-900">Quản lý Quiz</p>
                  <p className="text-xs text-gray-500">Kiểm tra câu hỏi</p>
                </div>
              </a>
              <a
                href="/admin/topics"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-pink-500/50 hover:bg-pink-50/50"
              >
                <Tag className="h-6 w-6 text-pink-600" />
                <div>
                  <p className="font-semibold text-gray-900">Quản lý Topics</p>
                  <p className="text-xs text-gray-500">Danh mục chủ đề</p>
                </div>
              </a>
              <a
                href="/admin/users"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-purple-500/50 hover:bg-purple-50/50"
              >
                <Users className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Quản lý Users</p>
                  <p className="text-xs text-gray-500">Phân quyền người dùng</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
