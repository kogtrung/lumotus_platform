import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Copy,
  FileUp,
  GitBranch,
  Play,
  Plus,
  Search,
  Settings,
  X,
  LayoutGrid,
  List,
  Filter,
  Trophy,
} from 'lucide-react'
import { lumotoast } from '@/components/ui/Toast'
import ExitConfirmDialog from '@/components/ui/ExitConfirmDialog'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
import { reviewApi } from '@/api/review'
import CardFormDialog, { type CardFormData } from '@/components/deck/CardFormDialog'
import CardGridItem from '@/components/deck/CardGridItem'
import DeckTagsManager from '@/components/deck/DeckTagsManager'
import CardGridSkeleton from '@/components/deck/CardGridSkeleton'
import CardListPagination from '@/components/deck/CardListPagination'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import EditDeckDialog from '@/components/deck/EditDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckProgressBar from '@/components/flashcard/DeckProgressBar'
import Button from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editDeckOpen, setEditDeckOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<{ open: boolean; cardId?: string }>({ open: false })
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState(false)

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

  const progressQuery = useQuery({
    queryKey: ['deck-progress', deckRef],
    queryFn: () => reviewApi.getDeckProgress({ deckRef }).then((r) => r.data),
    enabled: !!deckRef,
    staleTime: 30_000,
  })

  const quizzesQuery = useQuery({
    queryKey: ['deck-quizzes', deck?.id],
    queryFn: () => deck ? quizApi.listByDeck(deck.id, { page: 0, size: 1 }).then((r) => r.data) : null,
    enabled: !!deck?.id,
    staleTime: 30_000,
  })

  const refresh = async (options?: { resetPage?: boolean }) => {
    if (options?.resetPage) setPage(0)
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['deck', deckRef] }),
      queryClient.refetchQueries({ queryKey: ['cards', deckRef] }),
      queryClient.refetchQueries({ queryKey: ['deck-quizzes', deck?.id] }),
    ])
    queryClient.invalidateQueries({ queryKey: ['decks'] })
  }

  const deleteDeckMutation = useMutation({
    mutationFn: () => decksApi.remove(deckRef),
    onSuccess: () => {
      lumotoast.success('Đã xóa deck')
      navigate('/home')
    },
    onError: () => lumotoast.error('Không thể xóa deck'),
  })

  const copyMutation = useMutation({
    mutationFn: () => decksApi.copy(deckRef),
    onSuccess: (res) => {
      lumotoast.success('Đã copy deck vào thư viện')
      navigate(`/decks/${res.data.slug}`)
    },
    onError: () => lumotoast.error('Không thể copy deck'),
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
        audioUrl: data.audioUrl || undefined,
      }
      return editingCard
        ? decksApi.updateCard(deckRef, editingCard.id, payload)
        : decksApi.addCard(deckRef, payload)
    },
    onMutate: async (data: CardFormData) => {
      await queryClient.cancelQueries({ queryKey: ['cards', deckRef] })
      await queryClient.cancelQueries({ queryKey: ['deck', deckRef] })
      const isNew = !editingCard
      const tempId = `temp-${Date.now()}`
      const newCard: Card = {
        id: tempId,
        deckId: deck?.id ?? '',
        front: data.front,
        back: data.back,
        phonetic: data.phonetic || null,
        partOfSpeech: null,
        hint: data.hint || null,
        example: data.example || null,
        imageUrl: data.imageUrl || null,
        icon: null,
        audioUrl: data.audioUrl || null,
        difficulty: null,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<{ content: Card[]; totalElements: number; totalPages: number }>(
        ['cards', deckRef, page, searchQ],
        (old: any) => {
          if (!old) return old
          const content = isNew ? [newCard, ...old.content] : old.content.map((c: Card) => c.id === editingCard?.id ? { ...newCard, id: editingCard.id } : c)
          return {
            ...old,
            content,
            totalElements: old.totalElements + (isNew ? 1 : 0),
          }
        }
      )
      queryClient.setQueryData<{ cardCount: number }>(['deck', deckRef], (old: any) => {
        if (!old) return old
        return { ...old, cardCount: old.cardCount + (isNew ? 1 : 0) }
      })
      return { isNew, tempId }
    },
    onSuccess: async (_res, _data, _ctx) => {
      lumotoast.success(editingCard ? 'Đã cập nhật thẻ' : 'Đã thêm thẻ')
      setCardDialogOpen(false)
      setEditingCard(null)
      if (!editingCard) setPage(0)
      await refresh()
    },
    onError: (_err, _data, _ctx) => {
      lumotoast.error('Không thể lưu thẻ')
      // Rollback
      queryClient.invalidateQueries({ queryKey: ['cards', deckRef] })
      queryClient.invalidateQueries({ queryKey: ['deck', deckRef] })
    },
  })

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => decksApi.deleteCard(deckRef, cardId),
    onMutate: async (cardId: string) => {
      await queryClient.cancelQueries({ queryKey: ['cards', deckRef] })
      await queryClient.cancelQueries({ queryKey: ['deck', deckRef] })
      queryClient.setQueryData<{ content: Card[]; totalElements: number; totalPages: number }>(
        ['cards', deckRef, page, searchQ],
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            content: old.content.filter((c: Card) => c.id !== cardId),
            totalElements: Math.max(0, old.totalElements - 1),
          }
        }
      )
      queryClient.setQueryData<{ cardCount: number }>(['deck', deckRef], (old: any) => {
        if (!old) return old
        return { ...old, cardCount: Math.max(0, old.cardCount - 1) }
      })
      return cardId
    },
    onSuccess: async (_data, _cardId, _ctx) => {
      lumotoast.success('Đã xóa thẻ')
      if (cards.length <= 1 && page > 0) {
        setPage((p) => p - 1)
      }
      await refresh()
    },
    onError: (_err, _cardId, _ctx) => {
      lumotoast.error('Không thể xóa thẻ')
      queryClient.invalidateQueries({ queryKey: ['cards', deckRef] })
      queryClient.invalidateQueries({ queryKey: ['deck', deckRef] })
    },
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
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[#2D2538]" />
        <DeckGridSkeleton />
      </div>
    )
  }

  if (deckQuery.isError || !deck) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#EF4444]">Không tìm thấy deck.</p>
        <Link to="/home" className="mt-4 inline-block text-sm text-[#EC4899]">
          Về trang chủ
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 md:mx-0">
      {/* Back nav */}
      <Link
        to={isOwner ? '/home' : '/explore'}
        className="inline-flex items-center gap-1.5 px-4 md:px-0 text-sm text-[#8B7A9E] transition-colors hover:text-[#EC4899]"
      >
        <ArrowLeft className="h-4 w-4" />
        {isOwner ? 'Thư viện' : 'Khám phá'}
      </Link>

      {/* Source deck banner */}
      {deck.sourceDeckId && deck.sourceDeckTitle && (
        <Link
          to={`/decks/${deck.sourceDeckSlug ?? deck.sourceDeckId}`}
          className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#3D3348] bg-[#252030]/60 px-4 py-2.5 text-sm text-[#C4B8D9] transition-all hover:border-[#EC4899] hover:text-[#EC4899]"
        >
          <GitBranch className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Copy từ deck gốc: <strong className="font-medium">{deck.sourceDeckTitle}</strong>
            {deck.sourceOwnerUsername ? ` · ${deck.sourceOwnerUsername}` : ''}
          </span>
        </Link>
      )}

      {/* Deck header */}
      <header className="mt-4 px-4 md:px-0">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#3D3348] bg-[#252030]/80 backdrop-blur-sm p-5 shadow-sm">
          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {deck.isPublic ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2.5 py-1 text-xs font-bold text-[#10B981]">
                  Công khai
                </span>
              ) : isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8B7A9E]/15 px-2.5 py-1 text-xs font-medium text-[#8B7A9E]">
                  Riêng tư
                </span>
              ) : null}
              {deck.topics.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: t.colorHex ? `${t.colorHex}22` : 'rgba(167, 139, 250, 0.15)',
                    color: t.colorHex ?? '#A78BFA',
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#F5F0FA] md:text-3xl">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="mt-1.5 max-w-2xl text-sm text-[#8B7A9E]">
                {deck.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8B7A9E]">
              <span className="font-semibold text-[#EC4899]">{deck.cardCount} thẻ</span>
              {quizzesQuery.data && quizzesQuery.data.totalElements > 0 && (
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-[#A78BFA]"
                  onClick={() => navigate('/quiz')}
                >
                  <Trophy className="h-3.5 w-3.5 text-[#A78BFA]" />
                  <span className="font-semibold text-[#A78BFA]">{quizzesQuery.data.totalElements} quiz</span>
                </span>
              )}
              <span>
                {deck.languageFront.toUpperCase()} → {deck.languageBack.toUpperCase()}
              </span>
              {!isOwner && deck.ownerUsername && <span>by {deck.ownerUsername}</span>}
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full max-w-xs">
              <DeckProgressBar
                mastered={progressQuery.data?.masteredCards ?? 0}
                total={progressQuery.data?.totalCards ?? deck.cardCount}
                showLabel={true}
                size="sm"
              />
            </div>

            {/* Personal tags */}
            <div className="mt-3">
              <DeckTagsManager deckId={deck.id} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-wrap gap-2">
            {!isOwner && deck.isPublic && deck.isCopyable && (
              <Button
                variant="outline"
                size="md"
                onClick={() => copyMutation.mutate()}
                disabled={copyMutation.isPending}
              >
                <Copy className="h-4 w-4" />
                Copy deck
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  size="md"
                  onClick={() => navigate(`/decks/${deckRef}/flashcard`)}
                >
                  <Play className="h-4 w-4" strokeWidth={2.5} />
                  Học Flashcard
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/quiz')}
                >
                  Quiz
                </Button>
                <Button variant="outline" size="md" onClick={() => setEditDeckOpen(true)}>
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </Button>
                <Button variant="outline" size="md" onClick={() => setImportOpen(true)}>
                  <FileUp className="h-4 w-4" />
                  Import
                </Button>
                <Button size="md" onClick={openAddCard}>
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Thêm thẻ
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Card list panel */}
      <section className="mt-5 px-4 md:px-0">
        {/* Panel header */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#3D3348] bg-[#252030]/80 backdrop-blur-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#F5F0FA]">Bộ thẻ</h2>
            <span className="rounded-full bg-[#2D2538] px-2.5 py-0.5 text-xs font-bold text-[#8B7A9E]">
              {searchQ
                ? `${totalElements} / ${deck.cardCount}`
                : deck.cardCount}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex rounded-lg border border-[#3D3348] bg-[#1A1520] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E]',
                )}
                title="Lưới"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E]',
                )}
                title="Danh sách"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B7A9E]" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm thẻ..."
                className={cn(inputClass(), 'h-9 py-1.5 pl-8 pr-8 text-sm')}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#8B7A9E] transition-colors hover:text-[#F5F0FA]"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cards area */}
        <div className="mt-3 min-h-[200px]">
          {cardsQuery.isLoading && !cardsQuery.data && <CardGridSkeleton count={10} />}

          {!cardsQuery.isLoading && cards.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#4A4060] bg-[#252030]/40 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2D2538]">
                <Filter className="h-7 w-7 text-[#8B7A9E]" />
              </div>
              <p className="text-sm font-semibold text-[#F5F0FA]">
                {searchQ ? 'Không có thẻ khớp tìm kiếm' : 'Chưa có thẻ nào'}
              </p>
              <p className="mt-1 text-xs text-[#8B7A9E]">
                {searchQ ? 'Thử từ khoá khác' : 'Thêm thẻ đầu tiên để bắt đầu ôn tập'}
              </p>
              {isOwner && !searchQ && (
                <Button size="sm" onClick={openAddCard} className="mt-4">
                  <Plus className="h-3.5 w-3.5" />
                  Thêm thẻ đầu tiên
                </Button>
              )}
              {searchQ && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="mt-3 text-xs font-bold text-[#EC4899] hover:underline"
                >
                  Xoá tìm kiếm
                </button>
              )}
            </div>
          )}

          {cards.length > 0 && (
            <div
              className={cn(
                'grid gap-2 transition-opacity',
                cardsQuery.isFetching && 'opacity-50',
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  : 'grid-cols-1',
              )}
            >
              {cards.map((card) => (
                <CardGridItem
                  key={card.id}
                  card={card}
                  isOwner={!!isOwner}
                  onEdit={() => openEditCard(card)}
                  onDelete={() => setConfirmDeleteCard({ open: true, cardId: card.id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalElements > 0 && (
          <div className="mt-3 rounded-2xl border border-[#3D3348] bg-[#252030]/80 backdrop-blur-sm px-4 py-3 shadow-sm">
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

      {/* Dialogs */}
      <EditDeckDialog
        open={editDeckOpen}
        deck={deck}
        deckRef={deckRef}
        onClose={() => setEditDeckOpen(false)}
        onUpdated={() => refresh()}
        onDelete={() => setConfirmDeleteDeck(true)}
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

      {/* Delete card confirm */}
      <ExitConfirmDialog
        open={confirmDeleteCard.open}
        title="Xóa thẻ?"
        body="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        confirmHint="Thẻ sẽ bị xóa vĩnh viễn"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (confirmDeleteCard.cardId) deleteCardMutation.mutate(confirmDeleteCard.cardId)
          setConfirmDeleteCard({ open: false })
        }}
        onCancel={() => setConfirmDeleteCard({ open: false })}
      />

      {/* Delete deck confirm */}
      <ExitConfirmDialog
        open={confirmDeleteDeck}
        title="Xóa deck?"
        body="Hành động này không thể hoàn tác. Tất cả thẻ trong deck cũng sẽ bị xóa."
        confirmLabel="Xóa deck"
        confirmHint="Xóa vĩnh viễn — không khôi phục được"
        cancelLabel="Hủy"
        onConfirm={() => {
          setConfirmDeleteDeck(false)
          deleteDeckMutation.mutate()
        }}
        onCancel={() => setConfirmDeleteDeck(false)}
      />
    </div>
  )
}
