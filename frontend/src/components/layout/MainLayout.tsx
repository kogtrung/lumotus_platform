import { NavLink, Outlet, Link } from 'react-router-dom'
import { Compass, Home, Library, Menu, Plus, Trophy } from 'lucide-react'
import LumotusLogo from '@/components/brand/LumotusLogo'
import AppSearchBar from '@/components/layout/AppSearchBar'
import UserMenu from '@/components/layout/UserMenu'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import heroImage from '@/assets/hero.png'

const mainNav = [
  { to: '/home', label: 'Trang chủ', icon: Home, end: true },
  { to: '/library', label: 'Thư viện của bạn', icon: Library },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/progress', label: 'Tiến độ', icon: Trophy },
] as const

function SidebarNavItem({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
}: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-150',
          collapsed
            ? 'h-10 w-10 justify-center'
            : 'gap-3 px-3 py-2.5',
          isActive
            ? collapsed
              ? 'lumo-sidebar-icon-active'
              : 'lumo-nav-active lumo-nav-active-3d'
            : collapsed
              ? 'lumo-sidebar-icon-idle'
              : 'lumo-nav-item-idle',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function MainLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Background image with blur */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) saturate(1.2)',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1520] via-[#1A1520]/98 to-[#1A1520] pointer-events-none" />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(236,72,153,0.06)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="lumo-header lumo-header-3d flex h-14 shrink-0 items-center gap-2 px-3 md:gap-3 md:px-6">
          <button
            type="button"
            onClick={toggleSidebar}
            className="lumo-menu-btn hidden shrink-0 md:inline-flex"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-expanded={!collapsed}
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <LumotusLogo to="/" size="sm" showText className="shrink-0" />

          <AppSearchBar className="hidden min-w-0 flex-1 sm:ml-4 sm:block" />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/library?create=1"
              className="lumo-fab-plus flex h-10 w-10 items-center justify-center rounded-full text-white"
              aria-label="Tạo deck mới"
              title="Tạo deck"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </Link>
            <UserMenu />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              'lumo-sidebar lumo-sidebar-3d hidden shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out md:flex',
              collapsed ? 'w-[4.5rem]' : 'w-[15.5rem]',
            )}
          >
            <nav
              className={cn(
                'flex flex-1 flex-col gap-0.5 py-3',
                collapsed ? 'items-center px-2' : 'px-3',
              )}
            >
              {mainNav.map(({ to, label, icon, ...rest }) => (
                <SidebarNavItem
                  key={to}
                  to={to}
                  label={label}
                  icon={icon}
                  collapsed={collapsed}
                  end={'end' in rest ? rest.end : false}
                />
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <main className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 lg:px-12">
              <AppSearchBar className="mb-6 sm:hidden" />
              <Outlet />
            </main>

            <nav className="flex border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-bar-top)] md:hidden">
              {mainNav.map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={'end' in rest ? rest.end : false}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                    )
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  {label.split(' ')[0]}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
