import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Sparkles, X, Plus,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { useAuthStore } from '@/store/authStore'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

function SectionTitle({
  icon: Icon,
  title,
  action,
  accentColor = 'var(--color-primary)',
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  action?: React.ReactNode
  accentColor?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accentColor }} strokeWidth={2.5} />
        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] tracking-wide">{title}</h2>
      </div>
      {action}
    </div>
  )
}

type SortOption = 'newest' | 'popular' | 'trending'

export default function ExplorePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const urlTopic = searchParams.get('topic') ?? null
  const [topicSlug, setTopicSlug] = useState<string | null>(urlTopic)
  const [localSearch, setLocalSearch] = useState(urlQ)
  const [sort, setSort] = useState<SortOption>('newest')

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['decks', 'explore', { topicSlug, q: urlQ, sort, page: 0 }],
    queryFn: () =>
      decksApi
        .list({ mine: false, topicSlug: topicSlug ?? undefined, q: urlQ || undefined, page: 0, size: 24, sort })
        .then((r) => r.data),
    enabled: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(localSearch ? { q: localSearch } : {})
  }

  const clearSearch = () => {
    setLocalSearch('')
    setSearchParams({})
  }

  const totalDecks = data?.totalElements ?? 0

  const sortLabel: Record<SortOption, string> = {
    newest: 'Mới nhất',
    popular: 'Phổ biến',
    trending: 'Xu hướng',
  }

  return (
    <div className="space-y-6">
      {/* Header + Search row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Compass className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Khám phá</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight text-[var(--color-text-main)]">Nội dung học tập</h1>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Copy deck về thư viện để bắt đầu học</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 w-fit shadow-sm">
            {(Object.keys(sortLabel) as SortOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSort(option)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  sort === option
                    ? 'bg-[var(--color-primary)] text-white shadow-md transform scale-[1.02]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)]',
                )}
              >
                {sortLabel[option]}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-md shrink-0 group">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
              placeholder="Tìm kiếm deck..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] transition-all focus:border-[var(--color-primary)] focus:bg-[var(--color-bg)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-subtle)] shadow-sm hover:border-[var(--color-primary-subtle)]"
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-[var(--color-surface-hover)] hover:scale-110 active:scale-95"
              >
                <X className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95 shadow-sm hover:shadow-[var(--color-primary-subtle)]"
              style={{ background: 'var(--color-primary)' }}
            >
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* Search result meta */}
      {urlQ && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-text-muted)]">
            Kết quả cho <span className="font-semibold text-[var(--color-text-main)]">"{urlQ}"</span>
            {totalDecks > 0 && ` — ${totalDecks} deck`}
          </span>
          <button onClick={clearSearch} className="font-medium text-[var(--color-primary)] hover:underline">
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Topics filter */}
      {topics.length > 0 && (
        <div>
          <SectionTitle icon={Compass} title="Chủ đề" />
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={(slug) => {
            setTopicSlug(slug)
            if (slug) {
              setSearchParams({ ...Object.fromEntries(searchParams), topic: slug })
            } else {
              const next = new URLSearchParams(searchParams)
              next.delete('topic')
              setSearchParams(next)
            }
          }} />
        </div>
      )}

      {/* Deck grid */}
      {totalDecks > 0 && (
        <SectionTitle
          icon={Sparkles}
          title={`${totalDecks} deck`}
          action={<span className="text-xs font-normal text-[#8B7A9E]">Trang {(data?.page ?? 0) + 1}</span>}
          accentColor="#F97316"
        />
      )}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <DeckGridSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-red-500">Không tải được danh sách deck</p>
          <p className="mt-1 text-xs text-red-400">Vui lòng thử lại sau</p>
        </div>
      )}

      {!isLoading && !isError && totalDecks === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center backdrop-blur-sm transition-all hover:bg-[var(--color-surface-hover)]">
          <span className="mb-4 block text-4xl opacity-50">🔍</span>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text-main)]">
            {urlQ ? 'Không tìm thấy kết quả' : 'Chưa có deck công khai'}
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-[var(--color-text-muted)]">
            {urlQ
              ? `Không có deck nào phù hợp với "${urlQ}".`
              : 'Hãy tạo deck đầu tiên và bật chế độ Công khai để chia sẻ.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {urlQ ? (
              <Button onClick={clearSearch} variant="outline" size="sm" className="hover:text-[var(--color-primary)]">
                Xem tất cả
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 font-semibold shadow-sm" onClick={() => navigate('/deck/create')}>
                <Plus className="h-4 w-4" />
                Tạo deck mới
              </Button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !isError && totalDecks > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {data?.content.map((deck) => (
              <DeckCard key={deck.id} deck={deck} variant="explore" currentUserId={user?.id} />
            ))}
          </div>
          {totalDecks > 24 && (
            <div className="text-center mt-6">
              <Button variant="outline" size="sm" className="gap-2 border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">
                Xem thêm <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Compass(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}
