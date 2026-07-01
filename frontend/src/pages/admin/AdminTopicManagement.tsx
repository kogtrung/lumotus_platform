import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Palette,
  Hash,
} from 'lucide-react'
import { topicsApi, type CreateTopicPayload, type UpdateTopicPayload } from '@/api/topics'
import type { Topic } from '@/types/deck'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

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

  if (!open) return null

  const handleNameChange = (value: string) => {
    setName(value)
    if (autoSlug && !topic) {
      // Auto-generate slug from name
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên topic')
      return
    }
    if (!slug.trim()) {
      toast.error('Vui lòng nhập slug')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast.error('Slug phải là kebab-case (viết thường, dùng dấu gạch ngang)')
      return
    }
    if (colorHex && !/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      toast.error('Màu phải là #RRGGBB')
      return
    }

    onSave({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
      colorHex: colorHex || undefined,
      sortOrder: parseInt(sortOrder) || 0,
    })
  }

  const isEditing = !!topic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Sửa Topic' : 'Tạo Topic mới'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: IELTS Vocabulary"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              Slug <span className="text-red-500">*</span>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                  disabled={isEditing}
                />
                Tự động
              </label>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ielts-vocabulary"
              disabled={isEditing}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-400">Kebab-case: chữ thường, dùng dấu gạch ngang</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả topic..."
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Icon (emoji)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📚"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Thứ tự</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Màu</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  placeholder="#EC4899"
                  className="w-36 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
                />
              </div>
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              'rounded-lg bg-[#EC4899] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#EC4899]/80',
              isLoading && 'cursor-not-allowed opacity-60'
            )}
          >
            {isLoading ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo Topic'}
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
  const [dialogLoading, setDialogLoading] = useState(false)

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
      toast.success('Tạo topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
      setShowDialog(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo topic')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ ref, data }: { ref: string; data: UpdateTopicPayload }) =>
      topicsApi.update(ref, data),
    onSuccess: () => {
      toast.success('Cập nhật topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
      setShowDialog(false)
      setEditingTopic(undefined)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật topic')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ref: string) => rawTopicsApi.delete(ref),
    onSuccess: () => {
      toast.success('Xóa topic thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi xóa topic')
    },
  })

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setShowDialog(true)
  }

  const handleDelete = (topic: Topic) => {
    if (confirm(`Xóa topic "${topic.name}"? Hành động không thể hoàn tác.`)) {
      deleteMutation.mutate(topic.slug)
    }
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
    </div>
  )
}
