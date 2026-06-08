import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

export type CardFormData = z.infer<typeof schema>

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(schema),
    defaultValues: { front: '', back: '', phonetic: '', example: '', hint: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        front: initial?.front ?? '',
        back: initial?.back ?? '',
        phonetic: initial?.phonetic ?? '',
        example: initial?.example ?? '',
        hint: initial?.hint ?? '',
      })
    }
  }, [open, initial, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Mặt trước (EN)
            </label>
            <input className={cn(inputClass(!!errors.front), 'flashcard-front')} {...register('front')} />
            {errors.front && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.front.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Mặt sau (VI)
            </label>
            <input className={cn(inputClass(!!errors.back), 'flashcard-back')} {...register('back')} />
            {errors.back && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.back.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Phiên âm
              </label>
              <input className={inputClass()} {...register('phonetic')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Gợi ý
              </label>
              <input className={inputClass()} {...register('hint')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Ví dụ
            </label>
            <textarea rows={2} className={cn(inputClass(), 'resize-none')} {...register('example')} />
          </div>

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
              disabled={loading}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
