import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileUp,
  Plus,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import CreateDeckDialog from '@/components/deck/CreateDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE'
type SortMode = 'newest' | 'oldest' | 'az' | 'za'

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('newest')

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['decks', { mine: true, page: 0 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 12 }).then((r) => r.data),
  })

  const totalDecks = data?.totalElements ?? 0

  const filteredDecks = useMemo(() => {
    if (!data?.content) return []
    let list = [...data.content]

    // Search
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q),
      )
    }

    // Visibility
    if (visibility === 'PUBLIC') list = list.filter((d) => d.isPublic)
    if (visibility === 'PRIVATE') list = list.filter((d) => !d.isPublic)

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'az':
          return a.title.localeCompare(b.title, 'vi')
        case 'za':
          return b.title.localeCompare(a.title, 'vi')
        case 'oldest':
          return a.title.localeCompare(b.title, 'vi')
        case 'newest':
        default:
          return b.title.localeCompare(a.title, 'vi')
      }
    })

    return list
  }, [data, query, visibility, sort])

  return (
    <div className="space-y-6 -mx-4 md:mx-0">
      {/* Header */}
      <div className="relative px-4 md:px-0">
        {/* Decorative gradient blur */}
        <div className="pointer-events-none absolute inset-x-0 -top-4 h-40 bg-gradient-to-b from-[rgba(236,72,153,0.08)] via-transparent to-transparent opacity-70" />

        <div className="relative">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
                Thư viện
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F0FA] md:text-4xl">
                Deck của bạn
              </h1>
              <p className="mt-1.5 text-sm text-[#8B7A9E]">
                <span className="font-bold text-[#EC4899]">{totalDecks}</span> deck · Tạo,
                import và chỉnh sửa bộ thẻ của bạn
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-xl border border-[#3D3348] bg-[#252030]/80 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-[#EC4899] text-white shadow-md'
                      : 'text-[#8B7A9E] hover:bg-[#2D2538]',
                  )}
                  aria-label="Grid view"
                  title="Lưới"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    viewMode === 'list'
                      ? 'bg-[#EC4899] text-white shadow-md'
                      : 'text-[#8B7A9E] hover:bg-[#2D2538]',
                  )}
                  aria-label="List view"
                  title="Danh sách"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button variant="outline" size="md" onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4" />
                Import CSV
              </Button>
              <Button size="md" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Tạo deck
              </Button>
            </div>
          </div>

          {/* Search & Filter bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm deck..."
                className="h-10 w-full rounded-xl border border-[#3D3348] bg-[#252030]/80 pl-10 pr-4 text-sm text-[#F5F0FA] placeholder:text-[#8B7A9E] shadow-sm transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-[#3D3348] bg-[#252030]/80 pl-9 pr-8 text-sm font-semibold text-[#F5F0FA] shadow-sm transition-all hover:border-[#EC4899] focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B7A9E]" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B7A9E]" />
            </div>

            {/* Visibility filters */}
            <div className="flex gap-1.5 rounded-xl border border-[#3D3348] bg-[#252030]/80 p-1 shadow-sm">
              {[
                { id: 'ALL' as const, label: 'Tất cả' },
                { id: 'PUBLIC' as const, label: 'Công khai' },
                { id: 'PRIVATE' as const, label: 'Riêng tư' },
              ].map((f) => (
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
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-0">
        {/* Loading */}
        {isLoading && (
          <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
            {Array.from({ length: 8 }).map((_, i) => (
              <DeckGridSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && totalDecks === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-[#3D3348] bg-[#252030]/60 backdrop-blur-sm p-12 text-center shadow-sm">
            <div className="pointer-events-none absolute -top-1/2 -right-1/2 h-64 w-64 rounded-full bg-[#EC4899]/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-1/2 -left-1/2 h-48 w-48 rounded-full bg-[#F97316]/5 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#EC4899] to-[#F97316] shadow-lg shadow-[#EC4899]/30">
                <Sparkles className="h-10 w-10 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-extrabold text-[#F5F0FA]">Thư viện trống</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#8B7A9E]">
                Bạn chưa có deck nào. Tạo deck đầu tiên hoặc khám phá kho deck công khai từ cộng đồng.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => setCreateOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Tạo deck mới
                </Button>
                <Button variant="outline" onClick={() => navigate('/explore')}>
                  Khám phá deck
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoading && totalDecks > 0 && filteredDecks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#4A4060] bg-[#252030]/40 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D2538]">
              <Search className="h-6 w-6 text-[#8B7A9E]" />
            </div>
            <p className="text-sm font-semibold text-[#F5F0FA]">
              Không có deck phù hợp
            </p>
            <p className="mt-1 text-xs text-[#8B7A9E]">
              Thử đổi bộ lọc hoặc từ khoá khác
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setVisibility('ALL')
              }}
              className="mt-3 text-xs font-bold text-[#EC4899] hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        {/* Deck grid */}
        {!isLoading && filteredDecks.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-[#8B7A9E]">
              <p>
                Hiển thị <span className="font-bold text-[#F5F0FA]">{filteredDecks.length}</span>{' '}
                trong <span className="font-bold text-[#EC4899]">{totalDecks}</span> deck
              </p>
            </div>

            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'space-y-3'
              }
            >
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  variant="library"
                  currentUserId={user?.id}
                />
              ))}
            </div>

            {totalDecks > 12 && (
              <div className="mt-8 text-center">
                <Button variant="outline">
                  Xem thêm deck
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
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
