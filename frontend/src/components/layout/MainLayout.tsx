import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Compass, Home, PanelLeft, Trophy } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/home', label: 'Trang chủ', icon: Home, end: true },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/progress', label: 'Tiến độ', icon: Trophy },
] as const

export default function MainLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center border-b border-[var(--color-border)]',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            <BookOpen className="h-6 w-6 shrink-0 text-[var(--color-primary)]" strokeWidth={2.25} />
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">Lumotus</span>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                  isActive
                    ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {collapsed && (
          <div className="border-t border-[var(--color-border)] p-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center rounded-lg py-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — desktop + mobile */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 shadow-[var(--shadow-nav)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] md:inline-flex"
              aria-label="Ẩn/hiện sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
              <span className="font-bold text-[var(--color-text)]">Lumotus</span>
            </div>
          </div>
          <UserMenu />
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
