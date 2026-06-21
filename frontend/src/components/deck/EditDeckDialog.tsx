import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Check, FileText, Globe, Hash, Lock, Save, Settings as SettingsIcon, Tag, X } from 'lucide-react'
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
  onDelete?: () => void
  deleting?: boolean
}

export default function EditDeckDialog({
  open,
  deck,
  deckRef,
  onClose,
  onUpdated,
  onDelete,
  deleting,
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

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

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
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['decks'] }),
        queryClient.refetchQueries({ queryKey: ['deck', deckRef] }),
      ])
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Đóng"
      />

      <div className="lumo-modal relative z-10 flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden animate-modal-in sm:rounded-2xl sm:shadow-2xl">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-subtle)] to-[var(--color-accent-warm)] shadow-sm">
              <SettingsIcon className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--color-text)]">Cài đặt deck</h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">Bật công khai để xuất hiện trên Khám phá</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Hash className="h-3 w-3" />
              Tên deck
            </label>
            <input
              className={inputClass(!!errors.title)}
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <FileText className="h-3 w-3" />
              Mô tả
            </label>
            <textarea
              rows={3}
              className={cn(inputClass(), 'resize-none')}
              {...register('description')}
            />
          </div>

          <button
            type="button"
            onClick={() => onPublicChange(!isPublic)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all',
              isPublic
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                isPublic
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)]',
              )}
            >
              {isPublic ? <Globe className="h-5 w-5" strokeWidth={2.25} /> : <Lock className="h-5 w-5" strokeWidth={2.25} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--color-text)]">
                {isPublic ? 'Công khai trên Khám phá' : 'Riêng tư'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {isPublic
                  ? 'Mọi người có thể xem và copy deck này'
                  : 'Chỉ bạn thấy deck này trong thư viện'}
              </p>
            </div>
            <div
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                isPublic ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                  isPublic ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </div>
          </button>

          {isPublic && topics.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Tag className="h-3 w-3" />
                Chủ đề hệ thống
              </p>
              <p className="mb-2.5 text-xs text-[var(--color-text-muted)]">
                Giúp người khác tìm deck theo danh mục trên Khám phá.
              </p>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => {
                  const active = selectedTopics.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopic(t.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                        active
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
                      )}
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </form>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-subtle)] disabled:opacity-50"
          >
            {deleting ? 'Đang xóa...' : 'Xóa deck'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              onClick={handleSubmit((d) => mutation.mutate(d))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Lưu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}