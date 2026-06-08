import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, FileUp, Plus, Settings, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { decksApi } from '@/api/decks'
import CardFormDialog, { type CardFormData } from '@/components/deck/CardFormDialog'
import EditDeckDialog from '@/components/deck/EditDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import CardGridItem from '@/components/deck/CardGridItem'
import CardGridSkeleton from '@/components/deck/CardGridSkeleton'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import { useAuthStore } from '@/store/authStore'
import type { Card } from '@/types/deck'

export default function DeckDetailPage() {
  const { deckRef = '' } = useParams<{ deckRef: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editDeckOpen, setEditDeckOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)

  const deckQuery = useQuery({
    queryKey: ['deck', deckRef],
    queryFn: () => decksApi.get(deckRef).then((r) => r.data),
    enabled: !!deckRef,
  })

  const cardsQuery = useQuery({
    queryKey: ['cards', deckRef],
    queryFn: () => decksApi.listCards(deckRef).then((r) => r.data),
    enabled: !!deckRef,
  })

  const deck = deckQuery.data
  const isOwner = deck && user?.id === deck.ownerId

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deck', deckRef] })
    queryClient.invalidateQueries({ queryKey: ['cards', deckRef] })
    queryClient.invalidateQueries({ queryKey: ['decks'] })
  }

  const copyMutation = useMutation({
    mutationFn: () => decksApi.copy(deckRef),
    onSuccess: (res) => {
      toast.success('Đã copy deck vào thư viện')
      navigate(`/decks/${res.data.slug}`)
    },
    onError: () => toast.error('Không thể copy deck'),
  })

  const deleteDeckMutation = useMutation({
    mutationFn: () => decksApi.remove(deckRef),
    onSuccess: () => {
      toast.success('Đã xóa deck')
      navigate('/home')
    },
    onError: () => toast.error('Không thể xóa deck'),
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
    onSuccess: () => {
      toast.success(editingCard ? 'Đã cập nhật thẻ' : 'Đã thêm thẻ')
      setCardDialogOpen(false)
      setEditingCard(null)
      invalidate()
    },
    onError: () => toast.error('Không thể lưu thẻ'),
  })

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => decksApi.deleteCard(deckRef, cardId),
    onSuccess: () => {
      toast.success('Đã xóa thẻ')
      invalidate()
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
      <div className="text-center py-16">
        <p className="text-[var(--color-danger)]">Không tìm thấy deck.</p>
        <Link to="/home" className="mt-4 inline-block text-sm text-[var(--color-primary)]">
          Về trang chủ
        </Link>
      </div>
    )
  }

  const cards = cardsQuery.data?.content ?? []

  return (
    <div>
      <Link
        to={isOwner ? '/home' : '/explore'}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {deck.isPublic ? (
              <span className="rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                Công khai · Khám phá
              </span>
            ) : isOwner ? (
              <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                Riêng tư
              </span>
            ) : null}
            {deck.topics.map((t) => (
              <span
                key={t.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]"
                style={{ backgroundColor: t.colorHex ? `${t.colorHex}22` : 'var(--color-bg)' }}
              >
                {t.name}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">{deck.title}</h1>
          {deck.description && (
            <p className="mt-2 max-w-2xl text-[var(--color-text-secondary)]">{deck.description}</p>
          )}
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {deck.cardCount} thẻ · {deck.languageFront.toUpperCase()} → {deck.languageBack.toUpperCase()}
            {!isOwner && deck.ownerUsername && <> · bởi {deck.ownerUsername}</>}
          </p>
          {isOwner && !deck.isPublic && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Deck riêng tư — chỉ bạn thấy. Mở{' '}
              <button
                type="button"
                onClick={() => setEditDeckOpen(true)}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                Cài đặt deck
              </button>{' '}
              để công khai lên Khám phá.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isOwner && deck.isPublic && deck.isCopyable && (
            <button
              type="button"
              onClick={() => copyMutation.mutate()}
              disabled={copyMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-60"
            >
              <Copy className="h-4 w-4" />
              Copy deck
            </button>
          )}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setEditDeckOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              >
                <Settings className="h-4 w-4" />
                Cài đặt
              </button>
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
                onClick={openAddCard}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
              >
                <Plus className="h-4 w-4" />
                Thêm thẻ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Xóa deck này? Hành động không thể hoàn tác.')) {
                    deleteDeckMutation.mutate()
                  }
                }}
                disabled={deleteDeckMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)] px-3 py-2 text-sm font-medium text-[var(--color-danger)] hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Xóa deck
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Bộ thẻ
            {cards.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                ({cards.length} thẻ)
              </span>
            )}
          </h2>
        </div>

        {cardsQuery.isLoading && <CardGridSkeleton />}

        {!cardsQuery.isLoading && cards.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
            <p className="text-[var(--color-text-muted)]">Chưa có thẻ nào</p>
            {isOwner && (
              <button
                type="button"
                onClick={openAddCard}
                className="mt-3 text-sm font-medium text-[var(--color-primary)]"
              >
                Thêm thẻ đầu tiên
              </button>
            )}
          </div>
        )}

        {cards.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

      <EditDeckDialog
        open={editDeckOpen}
        deck={deck}
        deckRef={deckRef}
        onClose={() => setEditDeckOpen(false)}
        onUpdated={() => invalidate()}
      />

      <ImportCsvDialog
        open={importOpen}
        deckRef={deckRef}
        onClose={() => setImportOpen(false)}
        onImported={() => invalidate()}
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
