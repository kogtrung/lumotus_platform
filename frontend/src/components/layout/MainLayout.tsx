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
import { cn } from '@/utils/cn'
import heroImage from '@/assets/hero.png'

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
          isActive ? 'z-10' : 'text-[#7B6A8E] hover:text-[#B8A8CC]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Soft hover tint on idle */}
          {!isActive && (
            <div
              className="absolute inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          )}

          {/* Icon */}
          <span className="relative z-10 flex shrink-0 items-center justify-center">
            <Icon
              className={cn(
                'h-4.5 w-4.5 transition-all duration-300',
                !isActive && 'group-hover:scale-110',
                isActive && 'drop-shadow-[0_0_6px_rgba(236,72,153,0.7)]',
              )}
              strokeWidth={isActive ? 2.5 : 2}
              style={isActive ? { color: '#EC4899' } : {}}
            />
          </span>

          {/* Label */}
          <span
            className="relative z-10 leading-none whitespace-nowrap transition-colors duration-200"
            style={isActive ? { color: '#EC4899', fontWeight: 700 } : {}}
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
      className="relative flex flex-1 items-stretch overflow-x-auto rounded-xl sm:rounded-2xl [&::-webkit-scrollbar]:hidden"
      style={{
        background: 'rgba(37,32,48,0.4)',
        border: '1px solid rgba(61,51,72,0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
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
        className="absolute bottom-0 h-1 rounded-full pointer-events-none transition-all duration-500 ease-out"
        style={{
          ...indicatorStyle,
          background:
            'linear-gradient(to right, #EC4899 0%, #F97316 50%, #EC4899 100%)',
          backgroundSize: '200% 100%',
          boxShadow:
            '0 0 12px rgba(236,72,153,0.5), 0 0 4px rgba(249,115,22,0.4)',
        }}
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
        'transition-all duration-200 hover:scale-105 active:scale-95',
      )}
      style={{
        background: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.3), ' +
          '0 4px 12px rgba(236,72,153,0.45), ' +
          '0 0 0 1px rgba(236,72,153,0.3)',
      }}
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
      className="lg:hidden sticky top-0 z-40 w-full"
      style={{
        background:
          'linear-gradient(180deg, rgba(26,21,32,0.95) 0%, rgba(26,21,32,0.85) 100%)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: '1px solid rgba(61,51,72,0.4)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
      }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo + brand */}
        <div className="flex items-center gap-2">
          <LumotusLogo to="/" size="sm" showText />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) saturate(1.2)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1A1520] via-[#252030]/98 to-[#1A1520]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(236,72,153,0.08)_0%,transparent_50%)]" />

      {/* ── Desktop tab bar ── */}
      <header
        className="relative z-30 shrink-0 w-full hidden lg:block"
        style={{
          background:
            'linear-gradient(180deg, rgba(26,21,32,0.75) 0%, rgba(26,21,32,0.6) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderBottom: '1px solid rgba(61,51,72,0.4)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Top accent line — thin gradient strip at bottom of header */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.5) 30%, rgba(249,115,22,0.5) 70%, transparent 100%)',
          }}
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
          className="flex lg:hidden fixed bottom-0 inset-x-0 z-40"
          style={{
            background: 'rgba(37, 32, 48, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid rgba(61, 51, 72, 0.5)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
          }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors duration-200',
                  isActive ? 'text-white' : 'text-[#8B7A9E]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 rounded-b-full pointer-events-none"
                      style={{
                        background: 'linear-gradient(to right, #EC4899, #F97316)',
                        boxShadow: '0 0 8px rgba(236,72,153,0.6)',
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-[rgba(236,72,153,0.15)] border border-[rgba(236,72,153,0.3)]'
                        : '',
                    )}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={isActive ? 2.5 : 2}
                      style={
                        isActive
                          ? {
                              color: '#EC4899',
                              filter: 'drop-shadow(0 0 4px rgba(236,72,153,0.6))',
                            }
                          : {}
                      }
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