import { create } from 'zustand'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogType = 'confirm' | 'exit' | 'custom'

interface DialogEntry {
  id: string
  type: DialogType
  props: Record<string, unknown>
}

interface DialogStore {
  dialogs: DialogEntry[]
  open: (type: DialogType, id: string, props?: Record<string, unknown>) => void
  close: (id: string) => void
  closeAll: () => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDialogStore = create<DialogStore>((set) => ({
  dialogs: [],
  open: (type, id, props = {}) =>
    set((s) => {
      if (s.dialogs.some((d) => d.id === id)) return s
      return { dialogs: [...s.dialogs, { type, id, props }] }
    }),
  close: (id) => set((s) => ({ dialogs: s.dialogs.filter((d) => d.id !== id) })),
  closeAll: () => set({ dialogs: [] }),
}))

// ─── Body lock ───────────────────────────────────────────────────────────────

function useBodyLock(open: boolean) {
  const ref = useRef(false)
  useEffect(() => {
    if (open && !ref.current) {
      document.body.style.overflow = 'hidden'
      ref.current = true
    }
    return () => {
      if (ref.current) {
        document.body.style.overflow = ''
        ref.current = false
      }
    }
  }, [open])
}

// ─── Backdrop & Lock ─────────────────────────────────────────────────────────

function DialogBackdrop({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  useBodyLock(true)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      {children}
    </div>,
    document.body,
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * useDialog lets any component open a dialog.
 * Dialog content is rendered via Portal at document.body — always centered on viewport.
 *
 * Usage:
 *   const { open, close } = useDialog()
 *   open('confirm', 'delete-123', { title: 'Delete?', onConfirm: () => {} })
 *   open('custom', 'my-modal', { render: () => <MyModal onClose={close} /> })
 */
export function useDialog() {
  const { open, close } = useDialogStore()
  return { open, close }
}

// ─── Renderer ───────────────────────────────────────────────────────────────

/**
 * <DialogManager /> must be placed once at App root (inside QueryClientProvider).
 * Renders all open dialogs via Portal.
 */
export function DialogManager() {
  const dialogs = useDialogStore((s) => s.dialogs)
  const close = useDialogStore((s) => s.close)

  if (dialogs.length === 0) return null

  return (
    <>
      {dialogs.map(({ id, type, props }) => {
        const onClose = () => close(id)

        return (
          <DialogBackdrop key={id} onClose={onClose}>
            {type === 'confirm' && (
              <ConfirmDialogContent {...(props as unknown as ConfirmDialogProps)} onClose={onClose} />
            )}
            {type === 'exit' && (
              <ExitDialogContent {...(props as unknown as ExitDialogProps)} onClose={onClose} />
            )}
            {type === 'custom' && typeof props.render === 'function' && (
              (props.render as (props: { onClose: () => void }) => ReactNode)({ onClose })
            )}
          </DialogBackdrop>
        )
      })}
    </>
  )
}

// ─── Shared confirm dialog content ─────────────────────────────────────────

interface ConfirmDialogProps {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm?: () => void
  onClose: () => void
}

function ConfirmDialogContent({
  title,
  body,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 to-orange-400" />
      <div className="flex justify-center pt-7 pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <div className="px-6 pb-2 text-center">
        <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
        {body && <p className="text-sm leading-relaxed text-gray-500">{body}</p>}
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-5">
        <button
          onClick={() => { onConfirm?.(); onClose() }}
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
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Shared exit dialog content ─────────────────────────────────────────────

interface ExitDialogProps {
  title: string
  body: string
  confirmLabel: string
  confirmHint?: string
  cancelLabel: string
  cancelHint?: string
  thirdLabel?: string
  thirdHint?: string
  thirdIcon?: ReactNode
  onConfirm?: () => void
  onThird?: () => void
  onClose: () => void
}

function ExitDialogContent({
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
  onThird,
  onClose,
}: ExitDialogProps) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#3D3348] bg-[#1F1A28] shadow-2xl">
      <div className="h-0.5 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316]" />
      <div className="flex justify-center pt-7 pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.1)]">
          <svg className="h-6 w-6 text-[#EC4899]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <div className="px-6 pb-2 text-center">
        <h2 className="mb-2 text-lg font-bold text-[#F5F0FA]">{title}</h2>
        <p className="text-sm leading-relaxed text-[#8B7A9E]">{body}</p>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-5">
        {thirdLabel && (
          <button
            onClick={() => { onClose(); onThird?.() }}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.08)] px-4 py-3 text-sm font-semibold text-[#EC4899]"
          >
            {thirdIcon}
            {thirdLabel}
          </button>
        )}
        {thirdLabel && thirdHint && (
          <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{thirdHint}</p>
        )}
        <button
          onClick={() => { onConfirm?.(); onClose() }}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#3D3348] bg-[#252030] px-4 py-3 text-sm font-semibold text-[#F5F0FA]"
        >
          <svg className="h-4 w-4 text-[#EC4899]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {confirmLabel}
        </button>
        {confirmHint && (
          <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{confirmHint}</p>
        )}
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-[#8B7A9E]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          {cancelLabel}
        </button>
        {cancelHint && (
          <p className="-mt-1.5 pl-1 text-xs text-[#8B7A9E]/60">{cancelHint}</p>
        )}
      </div>
    </div>
  )
}
