import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Lightbulb, Mic, Quote, Sparkles, Type, Volume2, X } from 'lucide-react'
import ImageUploadField from '@/components/ui/ImageUploadField'
import AudioUploadField from '@/components/ui/AudioUploadField'
import { inputClass } from '@/components/ui/inputClass'
import { cn } from '@/utils/cn'
import type { Card } from '@/types/deck'

const schema = z.object({
  front: z.string().min(1, 'Nhập mặt trước'),
  back: z.string().min(1, 'Nhập mặt sau'),
  phonetic: z.string().max(200).optional(),
  example: z.string().optional(),
  hint: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

export type CardFormData = FormFields & { imageUrl?: string | null; audioUrl?: string | null }

interface CardFormDialogProps {
  open: boolean
  title: string
  initial?: Card | null
  loading?: boolean
  onClose: () => void
  onSubmit: (data: CardFormData) => void
}

export default function CardFormDialog({
  open,
  title,
  initial,
  loading,
  onClose,
  onSubmit,
}: CardFormDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: { front: '', back: '', phonetic: '', example: '', hint: '' },
  })

  const frontValue = watch('front')
  const backValue = watch('back')

  useEffect(() => {
    if (open) {
      reset({
        front: initial?.front ?? '',
        back: initial?.back ?? '',
        phonetic: initial?.phonetic ?? '',
        example: initial?.example ?? '',
        hint: initial?.hint ?? '',
      })
      setImageUrl(initial?.imageUrl ?? null)
      setAudioUrl(initial?.audioUrl ?? null)
    }
  }, [open, initial, reset])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop với blur */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Đóng"
      />

      {/* Modal */}
      <div className="lumo-modal relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden animate-modal-in sm:rounded-2xl sm:shadow-2xl">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-subtle)] to-[var(--color-accent-warm)] shadow-sm">
              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.25} />
            </div>
            <h2 className="text-base font-extrabold text-[var(--color-text)]">{title}</h2>
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

        <form
          onSubmit={handleSubmit((data) => onSubmit({ ...data, imageUrl, audioUrl }))}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
        >
          {/* Front / Back - 2 cột preview trực quan */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Type className="h-3 w-3" />
                Mặt trước (EN)
              </label>
              <input
                className={cn(inputClass(!!errors.front), 'flashcard-front')}
                placeholder="hello"
                autoFocus={!initial}
                {...register('front')}
              />
              {errors.front && (
                <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">
                  {errors.front.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Type className="h-3 w-3" />
                Mặt sau (VI)
              </label>
              <input
                className={cn(inputClass(!!errors.back), 'flashcard-back')}
                placeholder="xin chào"
                {...register('back')}
              />
              {errors.back && (
                <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">
                  {errors.back.message}
                </p>
              )}
            </div>
          </div>

          {/* Live preview */}
          {(frontValue || backValue) && (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[#FDF2F8] to-[#F0FDF4] p-3 animate-fade-in">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Preview
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-white/80 p-2 text-center">
                  <p className="flashcard-front text-sm font-bold text-[var(--color-text)]">
                    {frontValue || '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-2 text-center">
                  <p className="flashcard-back text-sm font-bold text-[var(--color-text)]">
                    {backValue || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Media: ảnh + audio - 2 cột */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
              <ImageUploadField
                label="Ảnh minh họa"
                folder="cards"
                value={imageUrl}
                onChange={setImageUrl}
              />
              <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                <ImagePlus className="h-3 w-3" />
                Tùy chọn — giúp ghi nhớ nhanh hơn
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
              <AudioUploadField label="Phát âm" value={audioUrl} onChange={setAudioUrl} />
              <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                <Mic className="h-3 w-3" />
                File mp3/wav — dùng trong lúc ôn
              </p>
            </div>
          </div>

          {/* Phonetic + Hint */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Volume2 className="h-3 w-3" />
                Phiên âm
              </label>
              <input
                className={inputClass()}
                placeholder="/həˈloʊ/"
                {...register('phonetic')}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Lightbulb className="h-3 w-3" />
                Gợi ý
              </label>
              <input
                className={inputClass()}
                placeholder="Hai chữ L..."
                {...register('hint')}
              />
            </div>
          </div>

          {/* Example */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Quote className="h-3 w-3" />
              Ví dụ
            </label>
            <textarea
              rows={2}
              className={cn(inputClass(), 'resize-none')}
              placeholder='Hello, how are you?'
              {...register('example')}
            />
          </div>
        </form>

        {/* Footer sticky */}
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
            disabled={loading}
            onClick={handleSubmit((data) => onSubmit({ ...data, imageUrl, audioUrl }))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang lưu...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                {initial ? 'Cập nhật' : 'Thêm thẻ'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}