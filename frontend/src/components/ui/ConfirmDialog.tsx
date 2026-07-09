import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 to-orange-400" />

        <div className="flex justify-center pt-7 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <div className="px-6 pb-2 text-center">
          <h2 id="confirm-dialog-title" className="mb-2 text-lg font-bold text-gray-900">
            {title}
          </h2>
          {body && <p className="text-sm leading-relaxed text-gray-500">{body}</p>}
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-5">
          <button
            onClick={onConfirm}
            className={[
              'flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold',
              danger
                ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100',
            ].join(' ')}
          >
            {confirmLabel}
          </button>

          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
