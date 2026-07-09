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
  accentColor = '#EC4899',
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  action?: React.ReactNode
  accentColor?: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} strokeWidth={2.5} />
        <h2 className="text-sm font-semibold text-[#C4B8D9]">{title}</h2>
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
            <Compass className="h-4 w-4 text-[#EC4899]" strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]">Khám phá</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight text-[#F5F0FA]">Nội dung học tập</h1>
          <p className="mt-0.5 text-xs text-[#8B7A9E]">Copy deck về thư viện để bắt đầu học</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[#3D3348] bg-[#1A1520] p-1">
            {(Object.keys(sortLabel) as SortOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSort(option)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  sort === option
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
                )}
              >
                {sortLabel[option]}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xl shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
              placeholder="Tìm kiếm deck..."
              className="w-full rounded-xl border border-[#3D3348] bg-[#252030]/70 py-2.5 pl-10 pr-10 text-sm text-[#F5F0FA] placeholder:text-[#8B7A9E] transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/10"
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-[#2D2538]"
              >
                <X className="h-3.5 w-3.5 text-[#8B7A9E]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
            >
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* Search result meta */}
      {urlQ && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8B7A9E]">
            Kết quả cho <span className="font-semibold text-[#F5F0FA]">"{urlQ}"</span>
            {totalDecks > 0 && ` — ${totalDecks} deck`}
          </span>
          <button onClick={clearSearch} className="font-medium text-[#EC4899] hover:underline">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DeckGridSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-5 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-[#EF4444]">Không tải được danh sách deck</p>
          <p className="mt-1 text-xs text-[#8B7A9E]">Vui lòng thử lại sau</p>
        </div>
      )}

      {!isLoading && !isError && totalDecks === 0 && (
        <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-8 text-center backdrop-blur-sm">
          <span className="mb-3 block text-3xl">🔍</span>
          <h2 className="mb-1 text-base font-bold text-[#F5F0FA]">
            {urlQ ? 'Không tìm thấy kết quả' : 'Chưa có deck công khai'}
          </h2>
          <p className="mx-auto mb-4 max-w-sm text-xs text-[#8B7A9E]">
            {urlQ
              ? `Không có deck nào phù hợp với "${urlQ}".`
              : 'Hãy tạo deck đầu tiên và bật chế độ Công khai để chia sẻ.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {urlQ ? (
              <Button onClick={clearSearch} variant="outline" size="sm">
                Xem tất cả
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/deck/create')}>
                <Plus className="h-3.5 w-3.5" />
                Tạo deck mới
              </Button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !isError && totalDecks > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.content.map((deck) => (
              <DeckCard key={deck.id} deck={deck} variant="explore" currentUserId={user?.id} />
            ))}
          </div>
          {totalDecks > 24 && (
            <div className="text-center">
              <Button variant="outline" size="sm" className="gap-1.5">
                Xem thêm <Sparkles className="h-3.5 w-3.5" />
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
