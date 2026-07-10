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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/5 dark:bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        <div className="flex justify-center pt-7 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10">
            <AlertTriangle className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
        </div>

        <div className="px-6 pb-2 text-center">
          <h2 id="exit-dialog-title" className="mb-2 text-lg font-bold text-[var(--color-text)]">{title}</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-5">
          {thirdLabel && onThird && (
            <button
              onClick={() => { onCancel(); onThird() }}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
            >
              {thirdIcon ?? <Clock className="h-4 w-4" />}
              {thirdLabel}
            </button>
          )}
          {thirdLabel && onThird && thirdHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[var(--color-text-muted)]/60">{thirdHint}</p>
          )}

          <button
            onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            <LogOut className="h-4 w-4 text-[var(--color-primary)]" />
            {confirmLabel}
          </button>
          {confirmHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[var(--color-text-muted)]/60">{confirmHint}</p>
          )}

          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-[var(--color-text-muted)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {cancelLabel}
          </button>
          {cancelHint && (
            <p className="-mt-1.5 pl-1 text-xs text-[var(--color-text-muted)]/60">{cancelHint}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
