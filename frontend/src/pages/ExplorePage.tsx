import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Compass, TrendingUp, Sparkles, X, Plus,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { useAuthStore } from '@/store/authStore'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'
import Button from '@/components/ui/Button'

const TRENDING_TOPICS = [
  { name: 'IELTS Vocabulary', count: 156, color: '#EC4899' },
  { name: 'Business English', count: 89, color: '#10B981' },
  { name: 'TOEFL Prep', count: 67, color: '#F97316' },
  { name: 'Daily Conversation', count: 234, color: '#A78BFA' },
]

function SectionTitle({
  icon: Icon,
  title,
  action,
  accentColor = '#EC4899',
}: {
  icon: typeof Compass
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

export default function ExplorePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [topicSlug, setTopicSlug] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(urlQ)
  const [page] = useState(0)

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['decks', { mine: false, topicSlug, q: urlQ, page }],
    queryFn: () =>
      decksApi
        .list({ mine: false, topicSlug: topicSlug ?? undefined, q: urlQ || undefined, page, size: 24 })
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

  const handleTrendingClick = (name: string) => {
    setLocalSearch(name)
    setSearchParams({ q: name })
  }

  const totalDecks = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* ── Header + Search row ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#EC4899]" strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]">Khám phá</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight text-[#F5F0FA]">Nội dung học tập</h1>
          <p className="mt-0.5 text-xs text-[#8B7A9E]">Copy deck về thư viện để bắt đầu học</p>
        </div>

        {/* Search bar */}
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

      {/* ── Search result meta ── */}
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

      {/* ── Trending ── */}
      {!urlQ && (
        <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-4 backdrop-blur-sm">
          <SectionTitle icon={TrendingUp} title="Xu hướng tuần này" />
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map((topic) => (
              <button
                key={topic.name}
                onClick={() => handleTrendingClick(topic.name)}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${topic.color}15`,
                  borderColor: `${topic.color}40`,
                  color: topic.color
                }}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black">{topic.name[0]}</span>
                {topic.name}
                <span className="opacity-60">{topic.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Topics filter ── */}
      {topics.length > 0 && (
        <div>
          <SectionTitle icon={Compass} title="Chủ đề" />
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={setTopicSlug} />
        </div>
      )}

      {/* ── Deck grid ── */}
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
