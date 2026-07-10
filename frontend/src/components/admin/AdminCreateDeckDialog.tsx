import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { lumotoast } from '@/components/ui/Toast'
import { FileText, Hash, Layers, Sparkles, X } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { inputClassLight } from '@/components/ui/inputClass'
import { getApiErrorMessage } from '@/utils/apiError'

let _createPortalRoot: HTMLDivElement | null = null
function getPortalRoot(): HTMLDivElement {
  if (!_createPortalRoot) {
    _createPortalRoot = document.createElement('div')
    _createPortalRoot.id = 'admin-create-deck-portal'
    document.body.appendChild(_createPortalRoot)
  }
  return _createPortalRoot
}

const schema = z.object({
  title: z.string().min(1, 'Nhập tên deck').max(200),
  description: z.string().max(2000).optional(),
})

type FormData = z.infer<typeof schema>

interface AdminCreateDeckDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (slug: string) => void
}

export default function AdminCreateDeckDialog({ open, onClose, onCreated }: AdminCreateDeckDialogProps) {
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
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      ])
      lumotoast.success('Đã tạo official deck')
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
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-modal-in">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 shadow-sm">
              <Layers className="h-5 w-5 text-gray-600" strokeWidth={2.25} />
            </div>
            <h2 className="text-base font-extrabold text-gray-900">Tạo deck mới</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Hash className="h-3 w-3" />
              Tên deck
            </label>
            <input
              className={inputClassLight(!!errors.title)}
              placeholder="VD: 1000 từ vựng TOEIC"
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <FileText className="h-3 w-3" />
              Mô tả
            </label>
            <textarea
              rows={3}
              className={inputClassLight()}
              placeholder="Mô tả ngắn về nội dung deck..."
              {...register('description')}
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            Deck mới được tạo bởi Admin và tự động là deck chính thức (OFFICIAL).
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            onClick={handleSubmit((d) => mutation.mutate(d))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
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
    getPortalRoot(),
  )
}
