import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Compass, Search } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'
import { inputClass } from '@/components/ui/inputClass'

export default function ExplorePage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [topicSlug, setTopicSlug] = useState<string | null>(null)

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['decks', { mine: false, topicSlug, q: search, page: 0 }],
    queryFn: () =>
      decksApi
        .list({ mine: false, topicSlug: topicSlug ?? undefined, q: search || undefined, page: 0, size: 24 })
        .then((r) => r.data),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(q.trim())
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Compass className="h-7 w-7 text-[var(--color-primary)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Khám phá</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Duyệt deck công khai từ cộng đồng</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Tìm deck..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputClass() + ' pl-9'}
        />
      </form>

      {topics.length > 0 && (
        <div className="mt-4">
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={setTopicSlug} />
        </div>
      )}

      <div className="mt-8">
        {isLoading && <DeckGridSkeleton />}
        {isError && (
          <p className="text-sm text-[var(--color-danger)]">Không tải được danh sách deck.</p>
        )}
        {!isLoading && !isError && data?.content.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center">
            <Compass className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="mt-3 font-medium text-[var(--color-text)]">Chưa có deck công khai</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Tạo deck và bật &quot;Công khai&quot; để hiển thị ở đây
            </p>
          </div>
        )}
        {data && data.content.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
