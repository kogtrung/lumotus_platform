import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  BookOpen,
  Copy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Lightbulb,
  Image,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import type { Card, Topic, UpdateDeckPayload } from '@/types/deck'
import { lumotoast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'
import { inputClassLight } from '@/components/ui/inputClass'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

// ─── Approve Dialog (with topic picker) ───────────────────────────────────────
function ApproveDialog({
  open,
  deckTitle,
  topics,
  currentTopicIds,
  onConfirm,
  onCancel,
}: {
  open: boolean
  deckTitle: string
  topics: Topic[]
  currentTopicIds: string[]
  onConfirm: (topicIds: string[]) => void
  onCancel: () => void
}) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelectedTopics(currentTopicIds)
  }, [open, currentTopicIds])

  if (!open) return null

  const toggle = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Check className="h-5 w-5 text-emerald-500" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Duyệt deck</h2>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{deckTitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {topics.length > 0 ? (
            <>
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <Tag className="h-3 w-3" />
                  Gắn chủ đề (tùy chọn)
                </label>
                <p className="mb-2.5 text-xs text-gray-400">
                  Giúp người dùng tìm deck theo danh mục trên Khám phá.
                </p>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => {
                    const active = selectedTopics.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggle(t.id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                          active
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600',
                        )}
                      >
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Chưa có chủ đề nào trong hệ thống.</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(selectedTopics)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600"
          >
            <Check className="h-4 w-4" />
            Duyệt
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────
function RejectDialog({
  open,
  deckTitle,
  onConfirm,
  onCancel,
}: {
  open: boolean
  deckTitle: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <X className="h-5 w-5 text-red-500" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Từ chối deck</h2>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{deckTitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Lý do từ chối
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả ngắn gọn lý do từ chối (sẽ được gửi đến người dùng)..."
              className={inputClassLight()}
              autoFocus
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(reason || 'Rejected by admin')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600"
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Warning Dialog (unpublish before delete) ───────────────────────────────────
function UnpublishWarningDialog({
  open,
  onUnpublish,
  onCancel,
}: {
  open: boolean
  onUnpublish: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
        <div className="flex justify-center pt-7 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
            <AlertTriangle className="h-7 w-7 text-amber-500" strokeWidth={2} />
          </div>
        </div>
        <div className="px-6 pb-2 text-center">
          <h2 className="mb-2 text-lg font-bold text-gray-900">Deck đang công khai</h2>
          <p className="text-sm leading-relaxed text-gray-500">
            Deck này đang hiển thị trên trang Khám phá. Hãy tắt <strong className="text-gray-700">Công khai</strong> trước, sau đó mới xóa được.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 px-5 py-5">
          <button
            onClick={onUnpublish}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-100"
          >
            Tắt Công khai &amp; xóa
          </button>
          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add/Edit Card Form ────────────────────────────────────────────────────────
function CardForm({
  card,
  onSave,
  onCancel,
  saving,
}: {
  card?: Card
  onSave: (data: { front: string; back: string; phonetic?: string; example?: string; hint?: string; imageUrl?: string }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [phonetic, setPhonetic] = useState(card?.phonetic ?? '')
  const [example, setExample] = useState(card?.example ?? '')
  const [hint, setHint] = useState(card?.hint ?? '')
  const [imageUrl, setImageUrl] = useState(card?.imageUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    onSave({
      front: front.trim(),
      back: back.trim(),
      phonetic: phonetic.trim() || undefined,
      example: example.trim() || undefined,
      hint: hint.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Mặt trước *</label>
          <textarea
            rows={2}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Từ / cụm từ..."
            className={inputClassLight()}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Mặt sau *</label>
          <textarea
            rows={2}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Định nghĩa / dịch nghĩa..."
            className={inputClassLight()}
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
            <span className="text-gray-400">/</span> Phiên âm
          </label>
          <input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/prəˌnʌnsiˈeɪʃən/" className={inputClassLight()} />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
            <MessageSquare className="h-3 w-3 text-gray-400" /> Ví dụ
          </label>
          <input value={example} onChange={(e) => setExample(e.target.value)} placeholder="This is an example sentence." className={inputClassLight()} />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
            <Lightbulb className="h-3 w-3 text-gray-400" /> Gợi ý
          </label>
          <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Hint for the front" className={inputClassLight()} />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
            <Image className="h-3 w-3 text-gray-400" /> Ảnh URL
          </label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputClassLight()} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          Hủy
        </button>
        <button
          type="submit"
          disabled={saving || !front.trim() || !back.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-5 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Đang lưu...</>
          ) : (
            <><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {card ? 'Lưu' : 'Thêm thẻ'}</>
          )}
        </button>
      </div>
    </form>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDeckDetailPage() {
  const { deckRef } = useParams<{ deckRef: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ref = deckRef || ''

  // ── Deck state ──
  const [deckTitle, setDeckTitle] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [deckPublic, setDeckPublic] = useState(false)
  const [deckCopyable, setDeckCopyable] = useState(true)
  const [deckTopicIds, setDeckTopicIds] = useState<string[]>([])
  const [showTopicPicker, setShowTopicPicker] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  // ── Card list state ──
  const [cardPage, setCardPage] = useState(0)
  const [cardSearch, setCardSearch] = useState('')
  const [addingCard, setAddingCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // ── Fetch deck ──
  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: ['admin', 'deck', ref],
    queryFn: () => decksApi.getAdminDeck(ref).then((r) => r.data),
    enabled: !!ref,
  })

  // ── Fetch topics ──
  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  // ── Fetch cards ──
  const { data: cardData, isLoading: cardsLoading } = useQuery({
    queryKey: ['admin', 'deck', ref, 'cards', cardPage, cardSearch],
    queryFn: () => decksApi.listAdminDeckCards(ref, { page: cardPage, size: 20, q: cardSearch || undefined }),
    enabled: !!ref,
  })

  const cards = cardData?.data?.content ?? []
  const totalCardPages = cardData?.data?.totalPages ?? 1
  const totalCards = cardData?.data?.totalElements ?? 0

  // Sync deck form
  useEffect(() => {
    if (!deck) return
    setDeckTitle(deck.title)
    setDeckDescription(deck.description ?? '')
    setDeckPublic(deck.isPublic)
    setDeckCopyable(deck.isCopyable)
    setDeckTopicIds(deck.topics.map((t: Topic) => t.id))
  }, [deck?.id])

  // ── Mutations ──
  const updateDeckMutation = useMutation({
    mutationFn: (data: UpdateDeckPayload) =>
      decksApi.update(deck?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'decks'] })
      lumotoast.success('Đã lưu thay đổi')
    },
    onError: () => lumotoast.error('Lỗi khi lưu'),
  })

  const addCardMutation = useMutation({
    mutationFn: (data: Parameters<typeof decksApi.addCard>[1]) => decksApi.addCard(deck?.id || '', data),
    onSuccess: () => {
      setAddingCard(false)
      setCardPage(0)
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref, 'cards'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref] })
      lumotoast.success('Đã thêm thẻ')
    },
    onError: () => lumotoast.error('Lỗi khi thêm thẻ'),
  })

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Parameters<typeof decksApi.updateCard>[2] }) =>
      decksApi.updateCard(deck?.id || '', cardId, data),
    onSuccess: () => {
      setEditingCardId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref, 'cards'] })
      lumotoast.success('Đã cập nhật thẻ')
    },
    onError: () => lumotoast.error('Lỗi khi cập nhật thẻ'),
  })

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => decksApi.deleteCard(deck?.id || '', cardId),
    onSuccess: () => {
      setConfirmDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref, 'cards'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref] })
      lumotoast.success('Đã xóa thẻ')
    },
    onError: () => lumotoast.error('Lỗi khi xóa thẻ'),
  })

  const approveMutation = useMutation({
    mutationFn: (topicIds: string[]) => decksApi.approveDeck(deck?.id || '', { topicIds }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'decks'] })
      lumotoast.success('Đã duyệt deck')
      setApproveOpen(false)
    },
    onError: () => lumotoast.error('Lỗi khi duyệt deck'),
  })

  const createTopicMutation = useMutation({
    mutationFn: (name: string) => {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      return topicsApi.create({ name, slug }).then((r) => r.data)
    },
    onSuccess: (newTopic: Topic) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      setDeckTopicIds((prev) => [...prev, newTopic.id])
      setNewTopicName('')
      lumotoast.success(`Đã tạo chủ đề "${newTopic.name}"`)
    },
    onError: () => lumotoast.error('Lỗi khi tạo chủ đề'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => decksApi.rejectDeck(deck?.id || '', reason).then((r) => r.data),
    onSuccess: () => {
      setRejectOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'deck', ref] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'decks'] })
      lumotoast.success('Đã từ chối deck')
    },
    onError: () => lumotoast.error('Lỗi khi từ chối deck'),
  })

  // ── Handlers ──
  const handleSaveDeck = useCallback(() => {
    if (!deckTitle.trim()) { lumotoast.error('Tên deck không được trống'); return }
    updateDeckMutation.mutate({
      title: deckTitle.trim(),
      description: deckDescription.trim() || undefined,
      isPublic: deckPublic,
      isCopyable: deckCopyable,
      topicIds: deckTopicIds,
    })
  }, [deckTitle, deckDescription, deckPublic, deckCopyable, deckTopicIds, updateDeckMutation])

  const handleDeleteDeck = useCallback(() => {
    if (deckPublic) {
      setConfirmDeleteOpen(true)
    } else {
      decksApi.remove(deck?.id || '')
        .then(() => {
          lumotoast.success('Đã xóa deck')
          navigate('/admin/decks')
        })
        .catch(() => lumotoast.error('Lỗi khi xóa deck'))
    }
  }, [deck?.id, deckPublic, navigate])

  // ── Loading ──
  if (deckLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Không tìm thấy deck</p>
        <button onClick={() => navigate('/admin/decks')} className="mt-4 text-pink-500 hover:underline">
          Quay lại
        </button>
      </div>
    )
  }

  const verificationStatus = deck.verificationStatus
  const isSaving = updateDeckMutation.isPending

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/decks')}
            className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 truncate max-w-md">{deck.title}</h1>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-600' :
                verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                'bg-gray-100 text-gray-600'
              )}>
                {verificationStatus || 'UNLISTED'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {deck.ownerUsername ? `by ${deck.ownerUsername}` : 'System deck'} · {totalCards} thẻ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Approve / Reject — only when PENDING */}
          {verificationStatus === 'PENDING' && (
            <>
              <button
                onClick={() => setApproveOpen(true)}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Duyệt
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={rejectMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Từ chối
              </button>
            </>
          )}

          {/* Save */}
          <button
            onClick={handleSaveDeck}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateDeckMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* ── Deck Info ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin Deck</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Tên deck</label>
            <input
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              disabled={isSaving}
              className={inputClassLight()}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Người tạo</label>
            <input value={deck.ownerUsername} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-600">Mô tả</label>
            <textarea
              rows={2}
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              disabled={isSaving}
              className={inputClassLight()}
            />
          </div>
          <div className="flex items-center gap-8">
            {/* Công khai — toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeckPublic(!deckPublic)}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2',
                  deckPublic ? 'bg-emerald-500' : 'bg-gray-200',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow-sm transition-transform',
                    deckPublic && 'translate-x-6',
                  )}
                />
              </button>
              <span className={cn('text-sm font-semibold', deckPublic ? 'text-emerald-600' : 'text-gray-400')}>
                {deckPublic ? 'Công khai' : 'Riêng tư'}
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <input
                type="checkbox"
                checked={deckCopyable}
                onChange={(e) => setDeckCopyable(e.target.checked)}
                disabled={isSaving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Copy className="h-4 w-4" /> Cho phép copy
            </label>
          </div>
          {deck.xpMultiplier !== undefined && (
            <div>
              <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                x{deck.xpMultiplier} XP multiplier
              </span>
            </div>
          )}

          {deck.requestedTopic && (
            <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
                <MessageSquare className="h-3.5 w-3.5" />
                Yêu cầu topic từ người dùng
              </div>
              <p className="text-sm text-amber-800">{deck.requestedTopic}</p>
            </div>
          )}

          {/* Topic picker */}
          <div className="md:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Tag className="h-4 w-4" /> Chủ đề đã gắn
            </label>
            {showTopicPicker ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => {
                    const active = deckTopicIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDeckTopicIds((prev) =>
                          prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                          active
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600',
                        )}
                      >
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        {t.name}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Tên chủ đề mới..."
                    className={inputClassLight()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTopicName.trim()) {
                        createTopicMutation.mutate(newTopicName.trim())
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => newTopicName.trim() && createTopicMutation.mutate(newTopicName.trim())}
                    disabled={!newTopicName.trim() || createTopicMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowTopicPicker(false); setNewTopicName('') }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                  >
                    Xong
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {deckTopicIds.length > 0 ? (
                  topics
                    .filter((t) => deckTopicIds.includes(t.id))
                    .map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {t.name}
                        <button
                          type="button"
                          onClick={() => setDeckTopicIds((prev) => prev.filter((id) => id !== t.id))}
                          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-emerald-200"
                        >
                          <X className="h-2.5 w-2.5" strokeWidth={3} />
                        </button>
                      </span>
                    ))
                ) : (
                  <span className="text-sm text-gray-400">Chưa gắn chủ đề</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowTopicPicker(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Gắn / tạo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{totalCards}</p>
            <p className="text-xs text-gray-500">Thẻ</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{deck.viewCount ?? 0}</p>
            <p className="text-xs text-gray-500">Lượt xem</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{deck.copyCount ?? 0}</p>
            <p className="text-xs text-gray-500">Lượt copy</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {deck.sourceType === 'OFFICIAL' ? 'Hệ thống' : deck.sourceType === 'COMMUNITY' ? 'Cộng đồng' : deck.sourceType || '—'}
            </p>
            <p className="text-xs text-gray-500">Nguồn</p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDeleteDeck}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" /> Xóa deck
          </button>
        </div>
      </div>

      {/* ── Card List ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Thẻ ({totalCards})</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm thẻ..."
                value={cardSearch}
                onChange={(e) => { setCardSearch(e.target.value); setCardPage(0) }}
                className="w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setAddingCard(true); setEditingCardId(null) }}
              disabled={isSaving}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold',
                isSaving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm thẻ
            </button>
          </div>
        </div>

        {/* Add card form */}
        {addingCard && (
          <div className="mb-4">
            <CardForm
              onSave={(data) => addCardMutation.mutate(data)}
              onCancel={() => setAddingCard(false)}
              saving={addCardMutation.isPending}
            />
          </div>
        )}

        {/* Edit card form — rendered outside the map for stable reconciliation */}
        {editingCardId && (() => {
          const card = cards.find((c) => c.id === editingCardId)
          if (!card) return null
          return (
            <div className="mb-4">
              <CardForm
                card={card}
                onSave={(data) => updateCardMutation.mutate({ cardId: card.id, data })}
                onCancel={() => setEditingCardId(null)}
                saving={updateCardMutation.isPending}
              />
            </div>
          )
        })()}

        {/* Cards — view mode only */}
        {cardsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 border border-gray-200" />
            ))}
          </div>
        ) : cards.length === 0 && !addingCard && !editingCardId ? (
          <div className="py-12 text-center text-gray-400">
            <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Không có thẻ nào{cardSearch ? ' phù hợp' : ''}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card: Card) => (
              <div
                key={card.id}
                className={
                  'group rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300'
                }
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{card.front}</span>
                      {card.phonetic && <span className="text-xs text-gray-400">/{card.phonetic}/</span>}
                      {card.partOfSpeech && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {card.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{card.back}</div>
                    {card.example && (
                      <p className="mt-1 text-xs text-gray-400 italic">"{card.example}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCardId(card.id)
                        setAddingCard(false)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Sửa thẻ"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(card.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500"
                      title="Xóa thẻ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card pagination */}
        {totalCardPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Trang {cardPage + 1} / {totalCardPages} · {totalCards} thẻ
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardPage((p) => Math.max(0, p - 1))}
                disabled={cardPage === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCardPage((p) => Math.min(totalCardPages - 1, p + 1))}
                disabled={cardPage >= totalCardPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reject Dialog ── */}
      <RejectDialog
        open={rejectOpen}
        deckTitle={deck.title}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        onCancel={() => setRejectOpen(false)}
      />

      {/* ── Approve Dialog ── */}
      <ApproveDialog
        open={approveOpen}
        deckTitle={deck.title}
        topics={topics}
        currentTopicIds={deck.topics.map((t: Topic) => t.id)}
        onConfirm={(topicIds) => approveMutation.mutate(topicIds)}
        onCancel={() => setApproveOpen(false)}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Xóa thẻ này?"
        body="Hành động không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        onConfirm={() => confirmDeleteId && deleteCardMutation.mutate(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* ── Delete Deck Warning (public deck) ── */}
      <UnpublishWarningDialog
        open={confirmDeleteOpen}
        onUnpublish={() => {
          setConfirmDeleteOpen(false)
          setDeckPublic(false)
          decksApi.remove(deck?.id || '')
            .then(() => {
              lumotoast.success('Đã tắt công khai và xóa deck')
              navigate('/admin/decks')
            })
            .catch(() => lumotoast.error('Lỗi khi xóa deck'))
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
