import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

export default function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearAuth()
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary-subtle)] text-sm font-semibold text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)]"
        aria-label="Menu tài khoản"
        aria-expanded={open}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-sm font-semibold text-[var(--color-primary)]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{user.username}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
            </div>
          </div>

          <div className="py-1">
            <MenuLink to="/progress" icon={Trophy} onClick={() => setOpen(false)}>
              Tiến độ & thành tựu
            </MenuLink>
            <MenuButton icon={Settings} onClick={() => setOpen(false)} disabled>
              Cài đặt
            </MenuButton>
          </div>

          <div className="border-t border-[var(--color-border)] py-1">
            <MenuButton icon={LogOut} onClick={handleLogout} variant="danger">
              Đăng xuất
            </MenuButton>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  to,
  icon: Icon,
  children,
  onClick,
}: {
  to: string
  icon: typeof Trophy
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  )
}

function MenuButton({
  icon: Icon,
  children,
  onClick,
  variant = 'default',
  disabled,
}: {
  icon: typeof Trophy
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'danger'
          ? 'text-[var(--color-danger)] hover:bg-[var(--color-bg)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]',
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}
