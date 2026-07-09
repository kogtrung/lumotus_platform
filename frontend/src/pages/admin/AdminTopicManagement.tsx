import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Hash,
} from 'lucide-react'
import { topicsApi, type CreateTopicPayload, type UpdateTopicPayload } from '@/api/topics'
import type { Topic } from '@/types/deck'
import { lumotoast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

// ============================================================
// Topic Card
// ============================================================

function TopicCard({
  topic,
  onEdit,
  onDelete,
}: {
  topic: Topic
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/60 p-5 transition-all hover:bg-white/80">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Color indicator */}
          {topic.colorHex && (
            <div
              className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
              style={{ backgroundColor: topic.colorHex }}
            >
              {topic.icon && (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {topic.icon}
                </div>
              )}
            </div>
          )}
          {!topic.colorHex && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500">
              <Tag className="h-6 w-6 text-white" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{topic.name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                <Hash className="h-3 w-3" />
                {topic.slug}
              </span>
            </div>
            {topic.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{topic.description}</p>
            )}
            <div className="mt-2 text-xs text-gray-400">
              Sort order: {topic.sortOrder}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            title="Sửa topic"
            className="flex items-center justify-center rounded-lg p-2 text-[#EC4899] transition-all hover:bg-[#EC4899]/20"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            title="Xóa topic"
            className="flex items-center justify-center rounded-lg p-2 text-[#EF4444] transition-all hover:bg-[#EF4444]/20"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Create/Edit Dialog
// ============================================================

function TopicDialog({
  open,
  onClose,
  onSave,
  topic,
  isLoading,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: CreateTopicPayload | UpdateTopicPayload) => void
  topic?: Topic
  isLoading?: boolean
}) {
  const [name, setName] = useState(topic?.name ?? '')
  const [slug, setSlug] = useState(topic?.slug ?? '')
  const [description, setDescription] = useState(topic?.description ?? '')
  const [icon, setIcon] = useState(topic?.icon ?? '')
  const [colorHex, setColorHex] = useState(topic?.colorHex ?? '#EC4899')
  const [sortOrder, setSortOrder] = useState(topic?.sortOrder?.toString() ?? '0')
  const [autoSlug, setAutoSlug] = useState(!topic)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleNameChange = (value: string) => {
    setName(value)
    if (autoSlug && !topic) {
      setSlug(value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'))
    }
  }

  const handleSave = () => {
    if (!name.trim()) { lumotoast.error('Vui lòng nhập tên topic'); return }
    if (!slug.trim()) { lumotoast.error('Vui lòng nhập slug'); return }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { lumotoast.error('Slug phải là kebab-case (viết thường, dùng dấu gạch ngang)'); return }
    if (colorHex && !/^#[0-9A-Fa-f]{6}$/.test(colorHex)) { lumotoast.error('Màu phải là #RRGGBB'); return }
    onSave({ name: name.trim(), slug: slug.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined, colorHex: colorHex || undefined, sortOrder: parseInt(sortOrder) || 0 })
  }

  const isEditing = !!topic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-dialog-in">
        {/* Gradient accent bar */}
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-100 bg-pink-50">
              <Tag className="h-5 w-5 text-[#EC4899]" strokeWidth={2.25} />
            </div>
            <h2 className="text-base font-extrabold text-gray-900">{isEditing ? 'Sửa Topic' : 'Tạo Topic mới'}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              Tên <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: IELTS Vocabulary"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                Slug <span className="text-rose-400">*</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={autoSlug} onChange={(e) => setAutoSlug(e.target.checked)} disabled={isEditing} className="h-3.5 w-3.5 rounded border-gray-200 accent-pink-500" />
                Tự động
              </label>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ielts-vocabulary"
              disabled={isEditing}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none disabled:bg-gray-100 disabled:opacity-60"
            />
            <p className="mt-1 text-[11px] text-gray-500/60">Kebab-case: chữ thường, dùng dấu gạch ngang</p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả topic..."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Icon (emoji)</label>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none" />
            </div>
            {/* Sort Order */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Thứ tự</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none" />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Màu</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#EC4899"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899] focus:outline-none"
              />
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-gray-200 bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all hover:border-gray-200 hover:bg-gray-100 hover:text-gray-900"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#F472B6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Đang lưu...</>
            ) : isEditing ? 'Lưu thay đổi' : 'Tạo Topic'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function AdminTopicManagement() {
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    body?: string
    onConfirm: () => void
  }>({ open: false, title: '', body: '', onConfirm: () => {} })

  // Fetch topics
  const {
    data: topics = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
    staleTime: 30_000,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTopicPayload) => topicsApi.create(data),
    onSuccess: () => {
      lumotoast.success('Tạo topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
      setShowDialog(false)
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi tạo topic')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ ref, data }: { ref: string; data: UpdateTopicPayload }) =>
      topicsApi.update(ref, data),
    onSuccess: () => {
      lumotoast.success('Cập nhật topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
      setShowDialog(false)
      setEditingTopic(undefined)
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi cập nhật topic')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ref: string) => topicsApi.delete(ref),
    onSuccess: () => {
      lumotoast.success('Xóa topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
    },
    onError: (err: any) => {
      lumotoast.error(err?.response?.data?.message || 'Lỗi khi xóa topic')
    },
  })

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setShowDialog(true)
  }

  const handleDelete = (topic: Topic) => {
    setConfirmDialog({
      open: true,
      title: `Xóa topic "${topic.name}"?`,
      body: 'Hành động không thể hoàn tác.',
      onConfirm: () => deleteMutation.mutate(topic.slug),
    })
  }

  const handleSave = (data: CreateTopicPayload | UpdateTopicPayload) => {
    if (editingTopic) {
      updateMutation.mutate({ ref: editingTopic.slug, data })
    } else {
      createMutation.mutate(data as CreateTopicPayload)
    }
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingTopic(undefined)
  }

  // Sort by sortOrder
  const sortedTopics = [...topics].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Topics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý danh mục chủ đề hệ thống cho phân loại Deck và Quiz
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            onClick={() => {
              setEditingTopic(undefined)
              setShowDialog(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80"
          >
            <Plus className="h-4 w-4" />
            Tạo Topic
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Tổng cộng: {topics.length} topics
      </div>

      {/* Topic List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/60 border border-gray-200" />
          ))}
        </div>
      ) : sortedTopics.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center">
          <Tag className="mx-auto mb-3 h-12 w-12 text-gray-500/40" />
          <p className="text-gray-500">Chưa có topic nào</p>
          <button
            onClick={() => setShowDialog(true)}
            className="mt-4 rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80"
          >
            Tạo topic đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onEdit={() => handleEdit(topic)}
              onDelete={() => handleDelete(topic)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TopicDialog
        open={showDialog}
        onClose={handleCloseDialog}
        onSave={handleSave}
        topic={editingTopic}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          body={confirmDialog.body}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          onConfirm={() => {
            confirmDialog.onConfirm()
            setConfirmDialog((p) => ({ ...p, open: false }))
          }}
          onCancel={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        />
      )}
    </div>
  )
}
