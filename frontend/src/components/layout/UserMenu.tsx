import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number } | null>(null)

  // Tính lại vị trí mỗi khi mở
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 240
    const gap = 8

    let left = rect.right - menuWidth
    if (left < 8) left = 8
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8
    }

    setPosition({
      top: rect.bottom + gap,
      left,
      minWidth: menuWidth,
    })
  }, [open])

  // Cập nhật lại vị trí khi scroll/resize
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 240
      const gap = 8
      let left = rect.right - menuWidth
      if (left < 8) left = 8
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8
      }
      setPosition({
        top: rect.bottom + gap,
        left,
        minWidth: menuWidth,
      })
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Click outside
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // ESC để đóng
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearAuth()
    navigate('/login', { replace: true })
    toast.success('Đã đăng xuất')
  }

  if (!user) return null

  const initials = (user.username || 'U').slice(0, 2).toUpperCase()

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full',
          'bg-[var(--color-primary-subtle)] text-sm font-bold text-[var(--color-primary)]',
          'ring-2 ring-transparent transition',
          'hover:ring-[var(--color-primary-subtle)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2'
        )}
        aria-label="Menu tài khoản"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) {
                const span = parent.querySelector('span')
                if (span) span.classList.remove('hidden')
              }
            }}
          />
        ) : null}
        <span className={user.avatarUrl ? 'hidden' : ''}>{initials}</span>
      </button>

      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            minWidth: position.minWidth,
            zIndex: 99999,
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="rounded-xl bg-[var(--color-surface)] shadow-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-sm font-bold text-[var(--color-primary)] overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const span = parent.querySelector('span')
                        if (span) span.classList.remove('hidden')
                      }
                    }}
                  />
                ) : null}
                <span className={user.avatarUrl ? 'hidden' : ''}>{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{user.username}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
              </div>
            </div>

            <div className="py-1" role="none">
              <MenuLink to="/progress" icon={Trophy} onClick={() => setOpen(false)}>
                Tiến độ
              </MenuLink>
              <MenuLink to="/settings" icon={Settings} onClick={() => setOpen(false)}>
                Cài đặt
              </MenuLink>
            </div>

            <div className="border-t border-[var(--color-border)] py-1" role="none">
              <MenuButton icon={LogOut} onClick={handleLogout} variant="danger">
                Đăng xuất
              </MenuButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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
      role="menuitem"
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
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
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        variant === 'danger'
          ? 'text-[var(--color-danger)] hover:bg-[var(--color-bg)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]',
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {children}
    </button>
  )
}
