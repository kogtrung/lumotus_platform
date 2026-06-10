import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, FileUp, GitBranch, Plus, Search, Settings, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { decksApi } from '@/api/decks'
import CardFormDialog, { type CardFormData } from '@/components/deck/CardFormDialog'
import CardGridItem from '@/components/deck/CardGridItem'
import CardGridSkeleton from '@/components/deck/CardGridSkeleton'
import CardListPagination from '@/components/deck/CardListPagination'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import EditDeckDialog from '@/components/deck/EditDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import { inputClass } from '@/components/ui/inputClass'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuthStore } from '@/store/authStore'
import type { Card } from '@/types/deck'

const CARD_PAGE_SIZE = 50

export default function DeckDetailPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const searchQ = useDebouncedValue(searchInput.trim(), 300)

  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editDeckOpen, setEditDeckOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)

  useEffect(() => {
    setPage(0)
  }, [searchQ])

  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
    enabled: !!deckRef,
    staleTime: 0,
  })

  const cardsQuery = useQuery({
    queryKey: ['cards', deckRef, page, searchQ],
    queryFn: () =>
      decksApi
        .listCards(deckRef, { page, size: CARD_PAGE_SIZE, q: searchQ || undefined })
        .then((r) => r.data),
    enabled: !!deckRef,
    staleTime: 0,
    placeholderData: (prev) => prev,
  })

  const deck = deckQuery.data
  const isOwner = deck && user?.id === deck.ownerId
  const cards = cardsQuery.data?.content ?? []
  const totalElements = cardsQuery.data?.totalElements ?? 0
  const totalPages = Math.max(cardsQuery.data?.totalPages ?? 1, 1)

  const refresh = async (options?: { resetPage?: boolean }) => {
    if (options?.resetPage) setPage(0)
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['deck', deckRef] }),
      queryClient.refetchQueries({ queryKey: ['cards', deckRef] }),
    ])
    queryClient.invalidateQueries({ queryKey: ['decks'] })
  }

  const deleteDeckMutation = useMutation({
    mutationFn: () => decksApi.remove(deckRef),
    onSuccess: () => {
      toast.success('Đã xóa deck')
      navigate('/library')
    },
    onError: () => toast.error('Không thể xóa deck'),
  })

  const copyMutation = useMutation({
    mutationFn: () => decksApi.copy(deckRef),
    onSuccess: (res) => {
      toast.success('Đã copy deck vào thư viện')
      navigate(`/decks/${res.data.slug}`)
    },
    onError: () => toast.error('Không thể copy deck'),
  })

  const saveCardMutation = useMutation({
    mutationFn: (data: CardFormData) => {
      const payload = {
        front: data.front,
        back: data.back,
        phonetic: data.phonetic || undefined,
        example: data.example || undefined,
        hint: data.hint || undefined,
        imageUrl: data.imageUrl || undefined,
      }
      return editingCard
        ? decksApi.updateCard(deckRef, editingCard.id, payload)
        : decksApi.addCard(deckRef, payload)
    },
    onSuccess: async () => {
      toast.success(editingCard ? 'Đã cập nhật thẻ' : 'Đã thêm thẻ')
      setCardDialogOpen(false)
      setEditingCard(null)
      if (!editingCard) setPage(0)
      await refresh()
    },
    onError: () => toast.error('Không thể lưu thẻ'),
  })

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => decksApi.deleteCard(deckRef, cardId),
    onSuccess: async () => {
      toast.success('Đã xóa thẻ')
      await refresh()
      if (cards.length <= 1 && page > 0) {
        setPage((p) => p - 1)
      }
    },
    onError: () => toast.error('Không thể xóa thẻ'),
  })

  const openAddCard = () => {
    setEditingCard(null)
    setCardDialogOpen(true)
  }

  const openEditCard = (card: Card) => {
    setEditingCard(card)
    setCardDialogOpen(true)
  }

  if (deckQuery.isLoading) {
    return (
      <div>
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[var(--color-bg)]" />
        <DeckGridSkeleton count={1} />
      </div>
    )
  }

  if (deckQuery.isError || !deck) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--color-danger)]">Không tìm thấy deck.</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-[var(--color-primary)]">
          Về trang chủ
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={isOwner ? '/library' : '/explore'}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      {deck.sourceDeckId && deck.sourceDeckTitle && (
        <Link
          to={`/decks/${deck.sourceDeckSlug ?? deck.sourceDeckId}`}
          className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <GitBranch className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Copy từ deck gốc: <strong className="font-medium">{deck.sourceDeckTitle}</strong>
            {deck.sourceOwnerUsername ? ` · ${deck.sourceOwnerUsername}` : ''}
          </span>
        </Link>
      )}

      {/* Deck header */}
      <header className="mt-4 border-b border-[var(--color-border)] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              {deck.isPublic ? (
                <span className="rounded-md bg-[var(--color-primary-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                  Công khai
                </span>
              ) : isOwner ? (
                <span className="rounded-md bg-[var(--color-bg)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                  Riêng tư
                </span>
              ) : null}
              {deck.topics.map((t) => (
                <span
                  key={t.id}
                  className="rounded-md px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                  style={{ backgroundColor: t.colorHex ? `${t.colorHex}22` : 'var(--color-bg)' }}
                >
                  {t.name}
                </span>
              ))}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                {deck.description}
              </p>
            )}
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {deck.cardCount} thẻ · {deck.languageFront.toUpperCase()} →{' '}
              {deck.languageBack.toUpperCase()}
              {!isOwner && deck.ownerUsername && <> · {deck.ownerUsername}</>}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!isOwner && deck.isPublic && deck.isCopyable && (
              <button type="button" onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending} className={btnSecondary}>
                <Copy className="h-4 w-4" />
                Copy
              </button>
            )}
            {isOwner && (
              <>
                <button type="button" onClick={() => setEditDeckOpen(true)} className={btnSecondary}>
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </button>
                <button type="button" onClick={() => setImportOpen(true)} className={btnSecondary}>
                  <FileUp className="h-4 w-4" />
                  Import
                </button>
                <button type="button" onClick={openAddCard} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Thêm thẻ
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Card list panel */}
      <section className="lumo-panel mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Bộ thẻ</h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {searchQ
              ? `${totalElements} kết quả · ${deck.cardCount} tổng`
              : `${deck.cardCount} thẻ`}
          </span>

          <div className="relative ml-auto min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm front, back, phiên âm..."
              className={inputClass() + ' h-9 py-1.5 pl-8 pr-8 text-sm'}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {cardsQuery.isLoading && !cardsQuery.data && <CardGridSkeleton count={10} />}

          {!cardsQuery.isLoading && cards.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[var(--color-text-muted)]">
                {searchQ ? 'Không có thẻ khớp tìm kiếm' : 'Chưa có thẻ nào'}
              </p>
              {isOwner && !searchQ && (
                <button type="button" onClick={openAddCard} className="mt-3 text-sm font-medium text-[var(--color-primary)]">
                  Thêm thẻ đầu tiên
                </button>
              )}
            </div>
          )}

          {cards.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${cardsQuery.isFetching ? 'opacity-60' : ''}`}
            >
              {cards.map((card) => (
                <CardGridItem
                  key={card.id}
                  card={card}
                  isOwner={!!isOwner}
                  onEdit={() => openEditCard(card)}
                  onDelete={() => {
                    if (window.confirm('Xóa thẻ này?')) deleteCardMutation.mutate(card.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {totalElements > 0 && (
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            <CardListPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={CARD_PAGE_SIZE}
              onPageChange={setPage}
              loading={cardsQuery.isFetching}
            />
          </div>
        )}
      </section>

      <EditDeckDialog
        open={editDeckOpen}
        deck={deck}
        deckRef={deckRef}
        onClose={() => setEditDeckOpen(false)}
        onUpdated={() => refresh()}
        onDelete={() => {
          if (window.confirm('Xóa deck này? Hành động không thể hoàn tác.')) {
            deleteDeckMutation.mutate()
          }
        }}
        deleting={deleteDeckMutation.isPending}
      />

      <ImportCsvDialog
        open={importOpen}
        deckRef={deckRef}
        onClose={() => setImportOpen(false)}
        onImported={() => refresh({ resetPage: true })}
      />

      <CardFormDialog
        open={cardDialogOpen}
        title={editingCard ? 'Sửa thẻ' : 'Thêm thẻ mới'}
        initial={editingCard}
        loading={saveCardMutation.isPending}
        onClose={() => {
          setCardDialogOpen(false)
          setEditingCard(null)
        }}
        onSubmit={(data) => saveCardMutation.mutate(data)}
      />
    </div>
  )
}

const btnSecondary =
  'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg)]'

const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]'
