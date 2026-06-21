import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Compass, TrendingUp, Sparkles, X } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { useAuthStore } from '@/store/authStore'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'
import Button from '@/components/ui/Button'

// Mock trending topics for explore page
const TRENDING_TOPICS = [
  { name: 'IELTS Vocabulary', count: 156, emoji: '📝' },
  { name: 'Business English', count: 89, emoji: '💼' },
  { name: 'TOEFL Prep', count: 67, emoji: '🎓' },
  { name: 'Daily Conversation', count: 234, emoji: '💬' },
]

export default function ExplorePage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [topicSlug, setTopicSlug] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(urlQ)

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['decks', { mine: false, topicSlug, q: urlQ, page: 0 }],
    queryFn: () =>
      decksApi
        .list({
          mine: false,
          topicSlug: topicSlug ?? undefined,
          q: urlQ || undefined,
          page: 0,
          size: 24,
        })
        .then((r) => r.data),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (localSearch) {
      setSearchParams({ q: localSearch })
    } else {
      setSearchParams({})
    }
  }

  const clearSearch = () => {
    setLocalSearch('')
    setSearchParams({})
  }

  const totalDecks = data?.totalElements ?? 0

  return (
    <div className="space-y-8">
      {/* Header with search */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-x-0 -top-8 h-40 bg-gradient-to-b from-[rgba(236,72,153,0.08)] to-transparent pointer-events-none" />

        <div className="relative">
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔍</span>
            <div>
              <h1 className="text-2xl font-extrabold text-[#F5F0FA]">Khám phá</h1>
              <p className="text-[#8B7A9E]">
                Deck công khai từ cộng đồng — copy về thư viện để học
              </p>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7A9E]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Tìm kiếm deck..."
              className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-[#252030]/80 backdrop-blur-sm border-2 border-[#3D3348] text-base text-[#F5F0FA] placeholder:text-[#8B7A9E] focus:outline-none focus:border-[#EC4899] focus:ring-4 focus:ring-[#EC4899]/10 transition-all shadow-lg"
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#2D2538] transition-colors"
              >
                <X className="w-4 h-4 text-[#8B7A9E]" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-[#EC4899] text-white font-semibold hover:bg-[#DB2777] transition-colors shadow-lg"
            >
              Tìm
            </button>
          </form>

          {/* Search result info */}
          {urlQ && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-[#8B7A9E]">
                Kết quả cho "<span className="font-semibold text-[#F5F0FA]">{urlQ}</span>"
              </span>
              <button
                onClick={clearSearch}
                className="text-sm text-[#EC4899] hover:underline font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trending section */}
      {!urlQ && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#F97316] p-6 shadow-xl">
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 rounded-full bg-[#EC4899]/20 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 rounded-full bg-[#F97316]/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#F97316]" />
              <h2 className="text-lg font-bold text-white">Xu hướng tuần này</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRENDING_TOPICS.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => setLocalSearch(topic.name)}
                  className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm p-4 text-left hover:bg-white/20 transition-all"
                >
                  <span className="text-2xl mb-2 block">{topic.emoji}</span>
                  <p className="font-semibold text-white text-sm group-hover:text-white/90">{topic.name}</p>
                  <p className="text-xs text-white/60">{topic.count} deck</p>
                  <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topics filter */}
      {topics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-[#EC4899]" />
            <h2 className="font-semibold text-[#F5F0FA]">Chủ đề</h2>
          </div>
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={setTopicSlug} />
        </div>
      )}

      {/* Results */}
      <div>
        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {totalDecks > 0 && (
              <>
                <Sparkles className="w-5 h-5 text-[#F97316]" />
                <p className="font-semibold text-[#F5F0FA]">
                  <span className="text-[#EC4899]">{totalDecks}</span> deck được tìm thấy
                </p>
              </>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <DeckGridSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl bg-[rgba(239,68,68,0.12)] border border-[#3D3348] p-6 text-center">
            <p className="font-semibold text-[#EF4444]">Không tải được danh sách deck</p>
            <p className="text-sm text-[#8B7A9E] mt-1">Vui lòng thử lại sau</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && totalDecks === 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-[#252030]/60 backdrop-blur-sm p-12 text-center border border-[#3D3348]">
            <div className="absolute -top-1/2 -right-1/2 w-64 h-64 rounded-full bg-[#EC4899]/5 blur-3xl" />

            <div className="relative">
              <span className="text-5xl mb-4 block">🔍</span>
              <h2 className="text-xl font-bold text-[#F5F0FA] mb-2">
                {urlQ ? 'Không tìm thấy kết quả' : 'Chưa có deck công khai'}
              </h2>
              <p className="text-[#8B7A9E] mb-6 max-w-md mx-auto">
                {urlQ
                  ? `Không có deck nào phù hợp với "${urlQ}". Thử từ khóa khác hoặc xem tất cả deck.`
                  : 'Hãy tạo deck đầu tiên và bật chế độ Công khai để chia sẻ với cộng đồng.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {urlQ ? (
                  <>
                    <Button onClick={clearSearch} variant="outline" className="gap-2">
                      Xem tất cả
                    </Button>
                    <Button onClick={() => setLocalSearch('')} className="gap-2">
                      Tìm lại
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="gap-2">
                    Tạo deck mới
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deck grid */}
        {!isLoading && !isError && totalDecks > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.content.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                variant="explore"
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!isLoading && !isError && totalDecks > 12 && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="gap-2">
              Xem thêm deck
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
