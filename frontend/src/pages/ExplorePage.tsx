import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { useAuthStore } from '@/store/authStore'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'

export default function ExplorePage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [topicSlug, setTopicSlug] = useState<string | null>(null)

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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Khám phá</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Deck công khai từ cộng đồng — copy về thư viện để học
          {urlQ && (
            <>
              {' '}
              · kết quả cho &quot;{urlQ}&quot;{' '}
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                Xóa bộ lọc
              </button>
            </>
          )}
        </p>
      </div>

      {topics.length > 0 && (
        <div className="mt-6">
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={setTopicSlug} />
        </div>
      )}

      <div className="mt-8">
        {isLoading && <DeckGridSkeleton />}
        {isError && (
          <p className="text-sm text-[var(--color-danger)]">Không tải được danh sách deck.</p>
        )}
        {!isLoading && !isError && data?.content.length === 0 && (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
            <p className="font-semibold text-[var(--color-text)]">Chưa có deck công khai</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Tạo deck và bật &quot;Công khai&quot; để hiển thị ở đây
            </p>
          </div>
        )}
        {data && data.content.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                variant="explore"
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
