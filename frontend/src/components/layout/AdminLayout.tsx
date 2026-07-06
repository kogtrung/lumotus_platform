import { NavLink, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  LogOut,
  Shield,
  Tag,
  History,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/decks', label: 'Quản lý Deck', icon: BookOpen },
  { to: '/admin/quizzes', label: 'Quản lý Quiz', icon: FileQuestion },
  { to: '/admin/quiz-history', label: 'Lịch sử Quiz', icon: History },
  { to: '/admin/cooldown', label: 'Cài đặt Cooldown', icon: Clock },
  { to: '/admin/topics', label: 'Quản lý Topics', icon: Tag },
  { to: '/admin/users', label: 'Quản lý Users', icon: Users },
] as const

function AdminNavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
          isActive
            ? 'bg-gray-100 text-gray-900 border border-gray-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        )
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)

  // Redirect non-admin users
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white shadow-sm"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#EC4899] to-[#F97316]">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Admin Panel</p>
            <p className="text-xs text-gray-500">Lumotus</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="mb-2 px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Quản lý
            </p>
          </div>
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              end={'end' in item ? item.end : false}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-4">
          {/* User info */}
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899] to-[#F97316] text-sm font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{user.username}</p>
              <p className="truncate text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <NavLink
              to="/home"
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <LogOut className="h-4 w-4" />
              Quay về App
            </NavLink>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 pl-64">
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
