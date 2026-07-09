import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { lumotoast } from '@/components/ui/Toast'
import { FileText, Tag, X, Send, Loader2 } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { inputClass } from '@/components/ui/inputClass'
import { getApiErrorMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'

const schema = z.object({
  description: z.string().max(2000).optional().or(z.literal('')),
  topicIds: z.array(z.string()).default([]),
  requestedTopic: z.string().max(200).optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface SubmitForApprovalDialogProps {
  open: boolean
  deckRef: string
  onClose: () => void
  onSuccess: () => void
}

export default function SubmitForApprovalDialog({
  open,
  deckRef,
  onClose,
  onSuccess,
}: SubmitForApprovalDialogProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { description: '', topicIds: [], requestedTopic: '' },
  })

  const topicIds = watch('topicIds')

  const { data: topics } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      decksApi.submitForApproval(deckRef, {
        description: data.description || undefined,
        topicIds: data.topicIds?.length ? data.topicIds : undefined,
        requestedTopic: data.requestedTopic || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
      queryClient.invalidateQueries({ queryKey: ['deck', deckRef] })
      lumotoast.success('Đã gửi yêu cầu duyệt')
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => lumotoast.error(getApiErrorMessage(err, 'Không thể gửi duyệt deck')),
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const toggleTopic = (id: string) => {
    const next = topicIds.includes(id) ? topicIds.filter((x) => x !== id) : [...topicIds, id]
    setValue('topicIds', next, { shouldDirty: true })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 8, 20, 0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="lumo-modal relative z-10 flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden animate-modal-in sm:rounded-2xl sm:shadow-2xl">
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-subtle)] to-[var(--color-accent-warm)] shadow-sm">
              <Send className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.25} />
            </div>
            <h2 className="text-base font-extrabold text-[var(--color-text)]">Gửi yêu cầu duyệt</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
        >
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <FileText className="h-3 w-3" />
              Mô tả deck (tuỳ chọn)
            </label>
            <textarea
              rows={3}
              className={cn(inputClass(), 'resize-none')}
              placeholder="Tóm tắt nội dung deck giúp admin duyệt nhanh..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Tag className="h-3 w-3" />
              Chọn topic liên quan
            </label>
            <div className="flex flex-wrap gap-2">
              {topics?.map((topic) => {
                const active = topicIds.includes(topic.id)
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                      active
                        ? 'border-[#EC4899] bg-[#EC4899]/10 text-[#EC4899]'
                        : 'border-[#3D3348] text-[#8B7A9E] hover:border-[#EC4899]/60 hover:text-[#EC4899]',
                    )}
                  >
                    {topic.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Tag className="h-3 w-3" />
              Yêu cầu topic liên quan
            </label>
            <textarea
              rows={2}
              className={cn(inputClass(), 'resize-none')}
              placeholder="VD: Gửi deck vào topic IELTS, TOEIC..."
              {...register('requestedTopic')}
            />
            {errors.requestedTopic && (
              <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">
                {errors.requestedTopic.message}
              </p>
            )}
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
              Admin sẽ xem xét và gắn deck vào topic phù hợp
            </p>
          </div>

          <div className="rounded-xl bg-[var(--color-accent-warm)] px-3 py-2.5 text-xs text-[var(--color-warning)]">
            Gửi duyệt sẽ đánh dấu deck ở chế độ cộng đồng và hiển thị cho admin trong danh sách chờ
            duyệt.
          </div>
        </form>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                Gửi duyệt
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
