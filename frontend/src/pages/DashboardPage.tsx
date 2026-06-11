import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { decksApi } from '@/api/decks'
import { reviewApi } from '@/api/review'
import {
  JumpBackStrip,
  RecentList,
  SuggestedStrip,
} from '@/components/dashboard/DashboardSections'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { DeckSummary } from '@/types/deck'

function pickRecent(decks: DeckSummary[], limit = 8) {
  return [...decks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const mineQuery = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 24 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 24 }).then((r) => r.data),
  })

  const suggestedQuery = useQuery({
    queryKey: ['decks', { mine: false, page: 0, size: 8 }],
    queryFn: () => decksApi.list({ mine: false, page: 0, size: 8 }).then((r) => r.data),
  })

  const recentDecks = mineQuery.data ? pickRecent(mineQuery.data.content) : []
  const suggestedDecks = suggestedQuery.data?.content ?? []
  const jumpBackDecks = recentDecks.slice(0, 4)

  const dueQueries = useQueries({
    queries: jumpBackDecks.map((deck) => ({
      queryKey: ['review', 'due', deck.slug, 'summary'],
      queryFn: () => reviewApi.getDue({ deckRef: deck.slug, limit: 1 }).then((r) => r.data.dueCount),
      staleTime: 60_000,
    })),
  })

  const dueCounts = Object.fromEntries(
    jumpBackDecks.map((deck, i) => [deck.slug, dueQueries[i]?.data ?? 0]),
  )
  const dueLoading = dueQueries.some((q) => q.isLoading)

  return (
    <div className="space-y-10">
      {!mineQuery.isLoading && recentDecks.length === 0 && (
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <p className="text-lg font-bold text-[var(--color-text)]">Bắt đầu với deck đầu tiên</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Tạo deck riêng hoặc copy từ gợi ý bên dưới
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button to="/library">Tạo deck</Button>
            <Button to="/explore" variant="outline">
              Khám phá
            </Button>
          </div>
        </section>
      )}

      {(mineQuery.isLoading || recentDecks.length > 0) && (
        <section>
          <h2 className="lumo-section-title">Quay lại học ngay</h2>
          <JumpBackStrip
            decks={recentDecks}
            dueCounts={dueCounts}
            dueLoading={dueLoading}
            loading={mineQuery.isLoading}
          />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="lumo-section-title">Gần đây</h2>
          <Link
            to="/library"
            className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            Thư viện →
          </Link>
        </div>
        <RecentList
          decks={recentDecks}
          loading={mineQuery.isLoading}
          currentUsername={user?.username}
          emptyMessage="Chưa có deck — tạo mới hoặc copy từ Khám phá."
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="lumo-section-title">Gợi ý tham khảo</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Deck công khai từ cộng đồng — copy về thư viện để học
            </p>
          </div>
          <Link
            to="/explore"
            className="shrink-0 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            Xem thêm →
          </Link>
        </div>
        <SuggestedStrip
          decks={suggestedDecks}
          loading={suggestedQuery.isLoading}
          emptyMessage="Chưa có deck công khai — hãy tạo deck và bật Công khai."
        />
      </section>
    </div>
  )
}
