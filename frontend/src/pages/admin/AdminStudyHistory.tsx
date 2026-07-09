import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  Layers,
  User,
  RefreshCw,
} from 'lucide-react'
import { adminApi, type DailyActivityAdmin } from '@/api/admin'
import { cn } from '@/utils/cn'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function ActivityRow({
  activity,
  onSelect,
}: {
  activity: DailyActivityAdmin
  onSelect: () => void
}) {
  const xpColor =
    activity.xpEarned >= 100
      ? 'text-emerald-600'
      : activity.xpEarned >= 30
        ? 'text-yellow-600'
        : 'text-gray-600'

  return (
    <tr className="border-b border-gray-200 transition-colors hover:bg-gray-50">
      {/* User */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold shrink-0">
            <User className="h-4 w-4 text-purple-500" />
          </div>
          <span className="font-semibold text-gray-900">{activity.username}</span>
        </div>
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{formatDate(activity.date)}</span>
        </div>
      </td>

      {/* Cards reviewed */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Layers className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-sm font-bold text-orange-700">{activity.cardsReviewed}</span>
        </div>
      </td>

      {/* Quiz taken */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-700">{activity.quizTaken}</span>
        </div>
      </td>

      {/* XP earned */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          <span className={cn('text-sm font-bold', xpColor)}>+{activity.xpEarned}</span>
        </div>
      </td>

      {/* Study duration */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <span className="text-sm font-bold text-emerald-700">
          {activity.studyMinutes != null ? `${activity.studyMinutes} phút` : '—'}
        </span>
      </td>

      {/* Streak */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <span className="text-sm font-bold text-orange-600">
          {activity.streak != null ? `${activity.streak} 🔥` : '—'}
        </span>
      </td>

      {/* Deck count */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <span className="text-sm font-bold text-teal-700">
          {activity.deckCount != null ? activity.deckCount : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap px-4 py-3 text-right pr-6">
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors px-3 py-1.5 text-xs font-bold text-purple-600"
        >
          Chi tiết
        </button>
      </td>
    </tr>
  )
}

export default function AdminStudyHistory() {
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Detail State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [detailPage, setDetailPage] = useState(0)

  // Master Query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'study-history', page],
    queryFn: () => adminApi.getStudyHistory({ page, size: 30 }).then((r) => r.data),
    placeholderData: (prev) => prev,
    enabled: !selectedUserId,
  })

  // Detail Query
  const {
    data: detailData,
    isLoading: isDetailLoading,
    isFetching: isDetailFetching,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['admin', 'study-history-user', selectedUserId, detailPage],
    queryFn: () =>
      selectedUserId
        ? adminApi.getUserStudyHistory(selectedUserId, { page: detailPage, size: 20 }).then((r) => r.data)
        : Promise.resolve(null),
    placeholderData: (prev) => prev,
    enabled: !!selectedUserId,
  })

  const activities = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const detailActivities = detailData?.content ?? []
  const detailTotalPages = detailData?.totalPages ?? 0
  const detailTotalElements = detailData?.totalElements ?? 0

  // Client-side search and date filters for Master List
  const filtered = activities.filter((a) => {
    const matchSearch =
      !searchQuery || a.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFrom = !dateFrom || a.date >= dateFrom
    const matchTo = !dateTo || a.date <= dateTo
    return matchSearch && matchFrom && matchTo
  })

  const handleRefresh = () => {
    if (selectedUserId) {
      refetchDetail()
    } else {
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {selectedUserId ? `Chi tiết ôn tập: ${selectedUsername}` : 'Lịch sử ôn tập'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {selectedUserId
              ? `${detailTotalElements.toLocaleString()} ngày hoạt động ôn tập`
              : `${totalElements.toLocaleString()} người học`}
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {!selectedUserId && (
            <>
              {/* Search by username */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Date range */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Xóa lọc
                </button>
              )}
            </>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedUserId && (
        <button
          onClick={() => {
            setSelectedUserId(null)
            setSelectedUsername(null)
            setDetailPage(0)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all px-4 py-2 text-sm font-bold text-gray-700 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
        </button>
      )}

      {/* Main Table Content */}
      {selectedUserId ? (
        // ============================================
        // DETAIL VIEW: SPECIFIC DECK ACTIVITIES FOR THE USER
        // ============================================
        isDetailLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : detailActivities.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <BookOpen className="mb-2 h-12 w-12 text-gray-300" />
            <p className="text-gray-500 font-semibold">User chưa có hoạt động ôn tập cụ thể nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Ngày ôn tập
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-orange-600">
                      Thẻ đã ôn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-cyan-600">
                      Quiz đã làm
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-yellow-600">
                      XP nhận được
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      Thời gian ôn
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detailActivities.map((act) => {
                    const xpColor =
                      act.xpEarned >= 100
                        ? 'text-emerald-600'
                        : act.xpEarned >= 30
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                    return (
                      <tr key={act.date} className="border-b border-gray-200 transition-colors hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">{formatDate(act.date)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-sm font-bold text-orange-700">{act.cardsReviewed}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-sm font-bold text-cyan-700">{act.quizTaken}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-400" />
                            <span className={cn('text-sm font-bold', xpColor)}>+{act.xpEarned}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <span className="text-sm font-bold text-emerald-700">
                            {act.studyMinutes != null ? `${act.studyMinutes} phút` : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for Detail */}
            {detailTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Trang {detailPage + 1} / {detailTotalPages} ({detailTotalElements} kết quả)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailPage((p) => Math.max(0, p - 1))}
                    disabled={detailPage === 0}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                      detailPage === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" /> TRƯỚC
                  </button>
                  <button
                    onClick={() => setDetailPage((p) => Math.min(detailTotalPages - 1, p + 1))}
                    disabled={detailPage >= detailTotalPages - 1}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                      detailPage >= detailTotalPages - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    SAU <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      ) : (
        // ============================================
        // MASTER VIEW: GROUPED USERS SUMMARY LIST
        // ============================================
        isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white">
            <BookOpen className="mb-2 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Không có dữ liệu ôn tập</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Hoạt động gần nhất
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-orange-600">
                      Tổng thẻ ôn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-cyan-600">
                      Tổng Quiz
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-yellow-600">
                      Tổng XP
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      Tổng thời gian ôn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-orange-600">
                      Streak
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-teal-600">
                      Số Deck
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 text-right pr-6">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((activity) => (
                    <ActivityRow
                      key={activity.userId}
                      activity={activity}
                      onSelect={() => {
                        setSelectedUserId(activity.userId)
                        setSelectedUsername(activity.username)
                        setDetailPage(0)
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Trang {page + 1} / {totalPages} ({totalElements.toLocaleString()} kết quả)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                      page === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )
                  }
                  >
                    <ChevronLeft className="h-4 w-4" /> Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                      page >= totalPages - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    Sau <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* Loading overlay for fetching updates */}
      {(isFetching || isDetailFetching) && (!isLoading && !isDetailLoading) && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-white/50" />
      )}
    </div>
  )
}
