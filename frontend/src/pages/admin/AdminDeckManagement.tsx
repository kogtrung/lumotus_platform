import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  BookOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  Lock,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import type { DeckSummary } from '@/types/deck'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 10

function DeckCard({ deck }: { deck: DeckSummary }) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 transition-all hover:border-gray-300 hover:bg-white/80">
      <div className="flex items-start gap-4">
        {/* Cover */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {deck.coverImageUrl ? (
            <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-6 w-6 text-[#EC4899]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900">{deck.title}</h3>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {deck.ownerUsername ? `by ${deck.ownerUsername}` : 'System deck'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {deck.isPublic ? (
                <Globe className="h-4 w-4 text-[#10B981]" />
              ) : (
                <Lock className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {deck.cardCount ?? 0} thẻ
            </span>
            {deck.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {deck.viewCount}
              </span>
            )}
            {deck.copyCount !== undefined && (
              <span className="flex items-center gap-1">
                {deck.copyCount} lượt copy
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDeckManagement() {
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPublic, setFilterPublic] = useState<boolean | null>(null)

  // Fetch all decks (admin view)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'decks', page, searchQuery, filterPublic],
    queryFn: async () => {
      const params: any = { page, size: PAGE_SIZE }
      if (searchQuery) params.q = searchQuery
      if (filterPublic !== null) params.isPublic = filterPublic
      const result = await decksApi.list(params)
      return result.data
    },
    staleTime: 30_000,
  })

  const decks = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Deck</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý và duyệt bộ thẻ trong hệ thống
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm deck..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            className="w-full rounded-lg border border-gray-200/60 bg-white/60 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-white/40 p-1">
          <button
            onClick={() => {
              setFilterPublic(null)
              setPage(0)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              filterPublic === null
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-500 hover:text-gray-600',
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setFilterPublic(true)
              setPage(0)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              filterPublic === true
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'text-gray-500 hover:text-gray-600',
            )}
          >
            <Globe className="mr-1 inline h-3 w-3" />
            Công khai
          </button>
          <button
            onClick={() => {
              setFilterPublic(false)
              setPage(0)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              filterPublic === false
                ? 'bg-gray-200/20 text-gray-600'
                : 'text-gray-500 hover:text-gray-600',
            )}
          >
            <Lock className="mr-1 inline h-3 w-3" />
            Riêng tư
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>Tổng cộng: {totalElements} deck</span>
        <span>|</span>
        <span>Trang {page + 1} / {totalPages}</span>
      </div>

      {/* Deck List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/60 border border-gray-200" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-500/40" />
          <p className="text-gray-500">Không có deck nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/40 p-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              page === 0
                ? 'cursor-not-allowed text-gray-500/40'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <span className="text-sm text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              page >= totalPages - 1
                ? 'cursor-not-allowed text-gray-500/40'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
            )}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
