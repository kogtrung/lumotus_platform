import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { inputClass } from '@/components/ui/inputClass'
import { cn } from '@/utils/cn'
import { getApiErrorMessage } from '@/utils/apiError'
import type { DeckSummary } from '@/types/deck'

const schema = z.object({
  title: z.string().min(1, 'Nhập tên deck').max(200),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean(),
  topicIds: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

interface EditDeckDialogProps {
  open: boolean
  deck: DeckSummary
  deckRef: string
  onClose: () => void
  onUpdated?: () => void
}

export default function EditDeckDialog({
  open,
  deck,
  deckRef,
  onClose,
  onUpdated,
}: EditDeckDialogProps) {
  const queryClient = useQueryClient()
  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: deck.title,
      description: deck.description ?? '',
      isPublic: deck.isPublic,
      topicIds: deck.topics.map((t) => t.id),
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: deck.title,
        description: deck.description ?? '',
        isPublic: deck.isPublic,
        topicIds: deck.topics.map((t) => t.id),
      })
    }
  }, [open, deck, reset])

  const selectedTopics = watch('topicIds')
  const isPublic = watch('isPublic')

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      decksApi.update(deckRef, {
        title: data.title,
        description: data.description || undefined,
        isPublic: data.isPublic,
        isCopyable: data.isPublic,
        topicIds: data.isPublic ? data.topicIds : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
      queryClient.invalidateQueries({ queryKey: ['deck', deckRef] })
      toast.success('Đã cập nhật deck')
      onClose()
      onUpdated?.()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật deck')),
  })

  if (!open) return null

  const toggleTopic = (id: string) => {
    const adding = !selectedTopics.includes(id)
    const next = adding
      ? [...selectedTopics, id]
      : selectedTopics.filter((t) => t !== id)
    setValue('topicIds', next)
    if (adding) {
      setValue('isPublic', true)
    }
  }

  const onPublicChange = (checked: boolean) => {
    setValue('isPublic', checked)
    if (!checked) {
      setValue('topicIds', [])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Cài đặt deck</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Bật công khai để deck xuất hiện trên Khám phá.
        </p>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Tên deck
            </label>
            <input className={inputClass(!!errors.title)} {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Mô tả
            </label>
            <textarea
              rows={3}
              className={cn(inputClass(), 'resize-none')}
              {...register('description')}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              className="rounded"
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
            />
            Công khai trên Khám phá
          </label>

          {isPublic && topics.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                Chủ đề hệ thống
              </p>
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                Giúp người khác tìm deck theo danh mục trên Khám phá.
              </p>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedTopics.includes(t.id)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]',
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPublic && topics.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Chưa có chủ đề hệ thống — Admin cần tạo topic trước.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
