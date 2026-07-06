import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overflowHiddenRef = useRef(false)

  useEffect(() => {
    if (open && !overflowHiddenRef.current) {
      document.body.style.overflow = 'hidden'
      overflowHiddenRef.current = true
    }
    return () => {
      if (overflowHiddenRef.current) {
        document.body.style.overflow = ''
        overflowHiddenRef.current = false
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#3D3348] bg-[#1F1A28] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        <div className="flex justify-center pt-7 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.1)]">
            <AlertTriangle className="h-6 w-6 text-[#EC4899]" />
          </div>
        </div>

        <div className="px-6 pb-2 text-center">
          <h2 id="confirm-dialog-title" className="mb-2 text-lg font-bold text-[#F5F0FA]">
            {title}
          </h2>
          {body && <p className="text-sm leading-relaxed text-[#8B7A9E]">{body}</p>}
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-5">
          <button
            onClick={onConfirm}
            className={[
              'flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold',
              danger
                ? 'border border-[#EF4444]/60 bg-[#EF4444]/15 text-[#EF4444]'
                : 'border border-[#EC4899]/60 bg-[#EC4899]/15 text-[#EC4899]',
            ].join(' ')}
          >
            {confirmLabel}
          </button>

          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-[#8B7A9E]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
