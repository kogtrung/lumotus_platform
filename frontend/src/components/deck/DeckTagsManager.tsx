import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, X } from 'lucide-react'
import { deckTagsApi } from '@/api/deckTags'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface DeckTagsManagerProps {
  deckId: string
  className?: string
}

export default function DeckTagsManager({ deckId, className }: DeckTagsManagerProps) {
  const queryClient = useQueryClient()
  const [newTag, setNewTag] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['deck-tags', deckId],
    queryFn: () => deckTagsApi.getTags(deckId).then((r) => r.data.tags),
    staleTime: 30_000,
  })

  const updateMutation = useMutation({
    mutationFn: (newTags: string[]) => deckTagsApi.updateTags(deckId, newTags),
    onSuccess: (response) => {
      queryClient.setQueryData(['deck-tags', deckId], response.data)
      toast.success('Đã cập nhật tags')
      setNewTag('')
      setIsAdding(false)
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật tags')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tagName: string) => deckTagsApi.deleteTag(deckId, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck-tags', deckId] })
    },
    onError: () => {
      toast.error('Lỗi khi xóa tag')
    },
  })

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (!tag) return
    if (tags.includes(tag)) {
      toast.error('Tag đã tồn tại')
      return
    }
    if (tag.length > 50) {
      toast.error('Tag quá dài (tối đa 50 ký tự)')
      return
    }
    updateMutation.mutate([...tags, tag])
  }

  const handleDeleteTag = (tagName: string) => {
    deleteMutation.mutate(tagName)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTag('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-[#A78BFA]" />
        <span className="text-sm font-medium text-[#8B7A9E]">Tags cá nhân</span>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#A78BFA] transition-all hover:bg-[#A78BFA]/10"
          >
            <Plus className="h-3 w-3" />
            Thêm tag
          </button>
        )}
      </div>

      {/* Tags display */}
      {isLoading ? (
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-[#2D2538]" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#2D2538]" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tags.length === 0 && !isAdding && (
            <span className="text-xs text-[#6B5A7A]">Chưa có tags</span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[#A78BFA]/15 px-2.5 py-1 text-xs font-medium text-[#A78BFA]"
            >
              #{tag}
              <button
                onClick={() => handleDeleteTag(tag)}
                className="ml-0.5 rounded-full p-0.5 transition-all hover:bg-[#A78BFA]/30"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {isAdding && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D2538] px-2.5 py-1">
              <span className="text-xs text-[#A78BFA]">#</span>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                onKeyDown={handleKeyDown}
                placeholder="new-tag"
                autoFocus
                className="w-20 bg-transparent text-xs text-[#A78BFA] placeholder-[#6B5A7A] focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                disabled={updateMutation.isPending}
                className="rounded-full p-0.5 transition-all hover:bg-[#A78BFA]/30 disabled:opacity-50"
              >
                <Plus className="h-3 w-3 text-[#A78BFA]" />
              </button>
              <button
                onClick={() => {
                  setIsAdding(false)
                  setNewTag('')
                }}
                className="rounded-full p-0.5 transition-all hover:bg-[#EF4444]/20"
              >
                <X className="h-3 w-3 text-[#EF4444]" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
