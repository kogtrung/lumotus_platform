import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Compass,
  FileQuestion,
  Home,
  Plus,
  Trophy,
  Medal,
} from 'lucide-react'
import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react'
import LumotusLogo from '@/components/brand/LumotusLogo'
import UserMenu from '@/components/layout/UserMenu'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/home', label: 'Trang chủ', icon: Home, end: true },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/flashcard', label: 'Flashcard', icon: BookOpen },
  { to: '/quiz', label: 'Quiz', icon: FileQuestion },
  { to: '/progress', label: 'Tiến độ', icon: Trophy },
  { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Medal },
] as const

// ─── Browser-style tab ─────────────────────────────────────────────────────────

function BrowserTab({
  to,
  label,
  icon: Icon,
  end,
  flex,
}: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
  flex?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors duration-200 select-none cursor-pointer',
          flex ? 'flex-1 min-w-0 px-1 sm:px-3' : 'px-5',
          isActive ? 'z-10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Soft hover tint on idle */}
          {!isActive && (
            <div
              className="absolute inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-[var(--color-surface-hover)]"
            />
          )}

          {/* Icon */}
          <span className="relative z-10 flex shrink-0 items-center justify-center">
            <Icon
              className={cn(
                'h-4.5 w-4.5 transition-all duration-300',
                !isActive && 'group-hover:scale-110',
                isActive && 'drop-shadow-[var(--shadow-primary)] text-[var(--color-primary)]',
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
          </span>

          {/* Label */}
          <span
            className={cn(
              "relative z-10 leading-none whitespace-nowrap transition-colors duration-200",
              isActive && "font-bold text-[var(--color-primary)]"
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

// ─── Sliding tab indicator ─────────────────────────────────────────────────────

function TabStrip() {
  const location = useLocation()
  const navRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const updateIndicator = useCallback(() => {
    const nav = navRef.current
    const activeTab = nav?.querySelector('[aria-current="page"]')
    if (nav && activeTab) {
      const navRect = nav.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()
      setIndicatorStyle({
        left: tabRect.left - navRect.left + nav.scrollLeft,
        width: tabRect.width,
      })
    }
  }, [])

  useLayoutEffect(() => {
    updateIndicator()
  }, [location.pathname, updateIndicator])

  useEffect(() => {
    const handleResize = () => updateIndicator()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateIndicator])

  return (
    <nav
      ref={navRef}
      className="relative flex flex-1 items-stretch overflow-x-auto rounded-xl sm:rounded-2xl transition-colors duration-300 [&::-webkit-scrollbar]:hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    >
      {NAV_ITEMS.map((item) => (
        <BrowserTab
          key={item.to}
          to={item.to}
          label={item.label}
          icon={item.icon}
          end={'end' in item ? item.end : false}
          flex
        />
      ))}

      {/* Sliding indicator — single bar that glides between tabs */}
      <div
        ref={indicatorRef}
        aria-hidden
        className="absolute bottom-0 h-1 rounded-full pointer-events-none transition-all duration-500 ease-out bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)] bg-[size:200%_100%] shadow-[var(--shadow-primary)]"
        style={indicatorStyle}
      />
    </nav>
  )
}

// ─── Create FAB ────────────────────────────────────────────────────────────────

function CreateFab() {
  return (
    <Link
      to="/home?create=1"
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white',
        'transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20',
        'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] shadow-[var(--shadow-primary)]'
      )}
      aria-label="Tạo deck mới"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      <span className="hidden lg:inline">Tạo deck</span>
    </Link>
  )
}

// ─── Page transition wrapper ──────────────────────────────────────────────────

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className="h-full w-full animate-page-in"
    >
      {children}
    </div>
  )
}

// ─── Mobile header ────────────────────────────────────────────────────────────

function MobileHeader() {
  return (
    <header
      className="lg:hidden sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl shadow-[var(--shadow-header)] transition-colors duration-300"
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo + brand */}
        <div className="flex items-center gap-2">
          <LumotusLogo to="/" size="sm" showText />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 bg-[var(--color-bg)] transition-colors duration-500" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,var(--color-surface-hover),transparent,var(--color-surface-hover))] opacity-30" />

      {/* ── Desktop tab bar ── */}
      <header
        className="relative z-30 shrink-0 w-full hidden lg:block border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl shadow-[var(--shadow-header)] transition-colors duration-300"
      >
        {/* Top accent line — thin gradient strip at bottom of header */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50"
        />

        <div className="flex h-14 items-center w-full px-3 sm:px-5 lg:px-8">
          {/* Logo */}
          <div className="shrink-0 mr-2 sm:mr-4">
            <LumotusLogo to="/" size="sm" showText className="hidden sm:flex" />
            <LumotusLogo to="/" size="sm" showText={false} className="flex sm:hidden" />
          </div>

          {/* Tab strip with sliding indicator */}
          <TabStrip />

          {/* Actions */}
          <div className="ml-2 sm:ml-4 flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <CreateFab />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── Mobile/tablet header ── */}
      <MobileHeader />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:pb-8 pb-20">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        {/* ── Mobile/tablet bottom tab bar ── */}
        <nav
          className="flex lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl shadow-[var(--shadow-header-reverse)] shadow-inner transition-colors duration-300"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors duration-200',
                  isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-b-full pointer-events-none bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-[var(--shadow-primary)]" />
                  )}
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                      isActive ? 'bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/30' : '',
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", isActive ? "text-[var(--color-primary)] drop-shadow-[var(--shadow-primary)]" : "")}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </span>
                  <span className="leading-tight">{label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}