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
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/utils/cn'

type TimeRange = '7d' | '30d' | '90d'

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

// Simple bar chart component
function BarChart({
  data,
  maxValue,
  labels,
}: {
  data: number[]
  maxValue: number
  labels: string[]
}) {
  return (
    <div className="flex h-40 items-end gap-1">
      {data.map((value, index) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0
        return (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-pink-500 to-orange-500 transition-all duration-500"
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <span className="text-[10px] text-gray-500">{labels[index]}</span>
          </div>
        )
      })}
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
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 30_000,
  })

  // Generate mock chart data based on time range
  const generateChartData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const labels: string[] = []
    const users: number[] = []
    const decks: number[] = []
    const quizzes: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayNum = date.getDate()
      labels.push(`${dayNum}/${date.getMonth() + 1}`)

      // Generate semi-random data with realistic patterns
      const baseUsers = Math.max(1, Math.floor((stats?.totalUsers ?? 10) / days) + Math.floor(Math.random() * 5))
      const baseDecks = Math.max(0, Math.floor((stats?.totalDecks ?? 5) / days) + Math.floor(Math.random() * 3))
      const baseQuizzes = Math.max(0, Math.floor((stats?.totalQuizzes ?? 3) / days) + Math.floor(Math.random() * 2))

      users.push(baseUsers)
      decks.push(baseDecks)
      quizzes.push(baseQuizzes)
    }

    return { labels, users, decks, quizzes }
  }

  const chartData = generateChartData()
  const maxUsers = Math.max(...chartData.users, 1)
  const maxDecks = Math.max(...chartData.decks, 1)
  const maxQuizzes = Math.max(...chartData.quizzes, 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">Thống kê và hoạt động của Lumotus</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setTimeRange('7d')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                timeRange === '7d'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              7 ngày
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                timeRange === '30d'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              30 ngày
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                timeRange === '90d'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              90 ngày
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              value={(stats as any)?.totalQuizzes ?? 0}
              label="Quiz"
              sub="Đã được tạo"
              color="#A78BFA"
              delay={300}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Users Chart */}
            <ChartCard title="Người dùng mới">
              <BarChart
                data={chartData.users}
                maxValue={maxUsers}
                labels={chartData.labels}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Tổng: {chartData.users.reduce((a, b) => a + b, 0)} user hoạt động</span>
                <span>Max: {maxUsers}/ngày</span>
              </div>
            </ChartCard>

            {/* Decks Chart */}
            <ChartCard title="Bộ thẻ mới">
              <BarChart
                data={chartData.decks}
                maxValue={maxDecks}
                labels={chartData.labels}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Tổng: {chartData.decks.reduce((a, b) => a + b, 0)} deck mới</span>
                <span>Max: {maxDecks}/ngày</span>
              </div>
            </ChartCard>

            {/* Quizzes Chart */}
            <ChartCard title="Quiz được tạo">
              <BarChart
                data={chartData.quizzes}
                maxValue={maxQuizzes}
                labels={chartData.labels}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Tổng: {chartData.quizzes.reduce((a, b) => a + b, 0)} quiz mới</span>
                <span>Max: {maxQuizzes}/ngày</span>
              </div>
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
                  <p className="text-2xl font-bold text-pink-600">{(stats as any)?.totalQuizzes ?? 0}</p>
                  <p className="text-xs text-gray-500">Quiz đã tạo</p>
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
