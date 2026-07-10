import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { lumotoast } from '@/components/ui/Toast'
import { FileText, Hash, Layers, Sparkles, X } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { inputClass } from '@/components/ui/inputClass'
import { getApiErrorMessage } from '@/utils/apiError'

const schema = z.object({
  title: z.string().min(1, 'Nhập tên deck').max(200),
  description: z.string().max(2000).optional(),
})

type FormData = z.infer<typeof schema>

interface CreateDeckDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (slug: string) => void
}

export default function CreateDeckDialog({ open, onClose, onCreated }: CreateDeckDialogProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      decksApi.create({
        title: data.title,
        description: data.description || undefined,
      }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['decks'] }),
        queryClient.invalidateQueries({ queryKey: ['stats', 'dashboard'] })
      ])
      lumotoast.success('Đã tạo deck')
      reset()
      onClose()
      onCreated?.(res.data.slug)
    },
    onError: (err) => lumotoast.error(getApiErrorMessage(err, 'Không thể tạo deck')),
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
              <Layers className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.25} />
            </div>
            <h2 className="text-base font-extrabold text-[var(--color-text)]">Tạo deck mới</h2>
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

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Hash className="h-3 w-3" />
              Tên deck
            </label>
            <input
              className={inputClass(!!errors.title)}
              placeholder="VD: 1000 từ vựng TOEIC"
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
              className={inputClass()}
              placeholder="Mô tả ngắn về nội dung deck..."
              {...register('description')}
            />
          </div>

          <div className="rounded-xl bg-[var(--color-accent-warm)] px-3 py-2.5 text-xs text-[var(--color-warning)]">
            Deck mới được tạo ở chế độ riêng tư. Sau khi thêm thẻ, bạn có thể gửi yêu cầu duyệt để xuất hiện trên Khám phá.
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
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang tạo...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                Tạo deck
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
