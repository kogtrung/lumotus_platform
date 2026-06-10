import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileUp, Plus } from 'lucide-react'
import { decksApi } from '@/api/decks'
import CreateDeckDialog from '@/components/deck/CreateDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Thư viện của bạn</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {data?.totalElements ?? 0} deck · tạo, import và chỉnh sửa bộ thẻ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Tạo deck
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {isLoading && <DeckGridSkeleton count={3} />}
        {!isLoading && data?.content.length === 0 && (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center">
            <p className="font-semibold text-[var(--color-text)]">Chưa có deck nào</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Tạo deck đầu tiên hoặc copy từ Khám phá
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              Tạo deck
            </Button>
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
