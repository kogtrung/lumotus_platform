import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import toast from 'react-hot-toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastData {
  type: ToastType
  message: string
  duration?: number
  toastId: string
}

let toastIdCounter = 0

const ICONS = {
  success: <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 shrink-0 text-rose-400" />,
  warning: <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />,
  info: <Info className="h-5 w-5 shrink-0 text-sky-400" />,
}

const BORDERS = {
  success: 'border-emerald-500/30',
  error: 'border-rose-500/30',
  warning: 'border-amber-500/30',
  info: 'border-sky-500/30',
}

const BGS = {
  success: 'bg-emerald-950/60',
  error: 'bg-rose-950/60',
  warning: 'bg-amber-950/60',
  info: 'bg-sky-950/60',
}

const BAR_COLORS = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
}

function ToastItem({ type, message, duration = 4000, toastId }: ToastData) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(true)

  const handleDismiss = useCallback(() => {
    toast.dismiss(toastId)
  }, [toastId])

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        setVisible(false)
        setTimeout(handleDismiss, 300)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [duration, handleDismiss])

  return (
    <div
      className={`
        relative flex w-80 items-start gap-3 overflow-hidden rounded-xl border px-4 py-3.5 shadow-2xl
        backdrop-blur-sm transition-all duration-300
        ${BGS[type]} ${BORDERS[type]}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
    >
      {/* Top progress bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10">
        <div
          className={`h-full transition-all duration-75 ease-linear ${BAR_COLORS[type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Icon */}
      <div className="mt-0.5">{ICONS[type]}</div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug text-[#F5F0FA]">{message}</p>

      {/* Dismiss */}
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(handleDismiss, 300)
        }}
        className="ml-1 rounded-lg p-1 text-[#8B7A9E] transition-colors hover:bg-white/10 hover:text-[#F5F0FA]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Toast API helpers ────────────────────────────────────────────────────────

export const lumotoast = {
  success: (message: string, duration?: number) => {
    const id = String(++toastIdCounter)
    toast.custom(
      () => <ToastItem key={id} type="success" message={message} duration={duration} toastId={id} />,
      { id, position: 'top-right', duration: Infinity }
    )
    return toastIdCounter
  },
  error: (message: string, duration?: number) => {
    const id = String(++toastIdCounter)
    toast.custom(
      () => <ToastItem key={id} type="error" message={message} duration={duration ?? 5000} toastId={id} />,
      { id, position: 'top-right', duration: Infinity }
    )
    return toastIdCounter
  },
  warning: (message: string, duration?: number) => {
    const id = String(++toastIdCounter)
    toast.custom(
      () => <ToastItem key={id} type="warning" message={message} duration={duration} toastId={id} />,
      { id, position: 'top-right', duration: Infinity }
    )
    return toastIdCounter
  },
  info: (message: string, duration?: number) => {
    const id = String(++toastIdCounter)
    toast.custom(
      () => <ToastItem key={id} type="info" message={message} duration={duration} toastId={id} />,
      { id, position: 'top-right', duration: Infinity }
    )
    return toastIdCounter
  },
  dismiss: (id?: number | string) => toast.dismiss(id != null ? String(id) : undefined),
  loading: (message: string) => toast.loading(message, { id: 'lumotus-loading' }),
  removeLoading: () => toast.remove('lumotus-loading'),
}
