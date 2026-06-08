import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Compass, Home, Trophy } from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/progress', label: 'Tiến độ', icon: Trophy },
] as const

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <BookOpen className="h-7 w-7 text-[var(--color-primary)]" strokeWidth={2.25} />
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">Lumotus</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-[var(--color-text-muted)]">Sprint 0 — shell layout</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
            <span className="font-bold text-[var(--color-text)]">Lumotus</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>

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
