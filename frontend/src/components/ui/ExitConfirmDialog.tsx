import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, LogOut, ArrowLeft, Clock } from 'lucide-react'

interface ExitConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  confirmHint?: string
  cancelLabel: string
  cancelHint?: string
  thirdLabel?: string
  thirdHint?: string
  thirdIcon?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  onThird?: () => void
}

export default function ExitConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmHint,
  cancelLabel,
  cancelHint,
  thirdLabel,
  thirdHint,
  thirdIcon,
  onConfirm,
  onCancel,
  onThird,
}: ExitConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#3D3348] bg-[#1F1A28] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        <div className="flex justify-center pt-7 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.1)]">
            <AlertTriangle className="h-6 w-6 text-[#EC4899]" />
          </div>
        </div>

        <div className="px-6 pb-2 text-center">
          <h2 id="exit-dialog-title" className="mb-2 text-lg font-bold text-[#F5F0FA]">{title}</h2>
          <p className="text-sm leading-relaxed text-[#8B7A9E]">{body}</p>
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-5">
          {thirdLabel && onThird && (
            <button
              onClick={() => { onCancel(); onThird() }}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.08)] px-4 py-3 text-sm font-semibold text-[#EC4899]"
            >
              {thirdIcon ?? <Clock className="h-4 w-4" />}
              {thirdLabel}
            </button>
          )}
          {thirdLabel && onThird && thirdHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{thirdHint}</p>
          )}

          <button
            onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-3 text-sm font-semibold text-[#F5F0FA]"
          >
            <LogOut className="h-4 w-4 text-[#EC4899]" />
            {confirmLabel}
          </button>
          {confirmHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{confirmHint}</p>
          )}

          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-[#8B7A9E]"
          >
            <ArrowLeft className="h-4 w-4" />
            {cancelLabel}
          </button>
          {cancelHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{cancelHint}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
