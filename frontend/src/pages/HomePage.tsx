import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Compass, FileUp, Plus } from 'lucide-react'
import { decksApi } from '@/api/decks'
import CreateDeckDialog from '@/components/deck/CreateDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['decks', { mine: true, page: 0 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 12 }).then((r) => r.data),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
        Xin chào, {user?.username ?? 'bạn'}
      </h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Smart Flashcard — học từ vựng tiếng Anh với SRS SM-2.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="lumo-card px-5 py-4">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">XP</p>
          <p className="text-xl font-bold text-[var(--color-primary)]">{user?.xp ?? 0}</p>
        </div>
        <div className="lumo-card px-5 py-4">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Streak</p>
          <p className="text-xl font-bold text-[var(--color-warning)]">{user?.streak ?? 0}</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Thư viện của tôi</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Deck riêng tư và deck bạn tạo — không hiển thị ở đây nếu chưa công khai
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            <Compass className="h-4 w-4" />
            Khám phá
          </Link>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            <FileUp className="h-4 w-4" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            Tạo deck
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <DeckGridSkeleton count={3} />}
        {!isLoading && data?.content.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
            <p className="font-medium text-[var(--color-text)]">Chưa có deck nào</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Tạo deck đầu tiên hoặc copy từ Khám phá
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              Tạo deck
            </button>
          </div>
        )}
        {data && data.content.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((deck) => (
              <DeckCard key={deck.id} deck={deck} variant="library" currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>

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
