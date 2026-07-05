import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  ChevronLeft,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard, color: '#EC4899' },
  { label: 'Quản lý Deck', href: '/admin/decks', icon: BookOpen, color: '#10B981' },
  { label: 'Quản lý Quiz', href: '/admin/quizzes', icon: FileQuestion, color: '#F97316' },
  { label: 'Quản lý Users', href: '/admin/users', icon: Users, color: '#A78BFA' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">Lumotus</span>
              <span className="text-xs text-gray-500 block">Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/admin"}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: NAV_ITEMS.find(n => n.href === item.href)?.color }}
                />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ChevronLeft className="w-4 h-4" />
              <a href="/" className="hover:text-gray-900 transition-colors">Về trang chủ</a>
            </div>
            <div className="text-xs text-gray-400">
              Quản trị viên
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
