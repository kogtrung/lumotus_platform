import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Flame, Star, Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import LumotusLogo from '@/components/brand/LumotusLogo'
import Button from '@/components/ui/Button'

const features = [
  { icon: Flame, label: 'Streak', color: '#EF4444' },
  { icon: Star, label: 'XP', color: '#F59E0B' },
  { icon: Trophy, label: 'Rank', color: '#EC4899' },
  { icon: TrendingUp, label: 'Progress', color: '#10B981' },
]

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Decorative */}
      <aside className="hidden lg:flex w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4C1D95]" />

        {/* Glow effects */}
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[#EC4899]/20 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-[#F97316]/15 blur-3xl" />

        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-4 h-4 rounded-full bg-white/10 animate-float" />
        <div className="absolute top-40 right-32 w-6 h-6 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-40 w-3 h-3 rounded-full bg-white/10 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-20 w-5 h-5 rounded-full bg-white/5 animate-float" style={{ animationDelay: '0.5s' }} />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col h-full">
          {/* Logo */}
          <LumotusLogo to="/" size="lg" />

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-md">
              {/* Headline */}
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
                Bắt đầu hành trình
                <br />
                <span className="bg-gradient-to-r from-[#F9A8D4] via-[#A78BFA] to-[#F97316] bg-clip-text text-transparent">
                  học tập ngay hôm nay
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-white/70 mb-8">
                Lumotus giúp bạn học từ vựng hiệu quả với thuật toán thông minh và gamification hấp dẫn.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-4 mb-8">
                {features.map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-white">50K+</p>
                  <p className="text-xs text-white/60">Người dùng</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-white">500K+</p>
                  <p className="text-xs text-white/60">Từ vựng</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-white">5M+</p>
                  <p className="text-xs text-white/60">Lượt học</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">© {new Date().getFullYear()} Lumotus</p>
            <Button
              to="/"
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Về trang chủ
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Right Panel - Form */}
      <main className="flex w-full flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <LumotusLogo to="/" size="md" />
        </div>

        {/* Form container */}
        <div className="w-full max-w-md">
          {/* Card decoration */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/10 to-[#F97316]/10 rounded-3xl blur-xl transform scale-105" />

            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-[#E2E5EC]">
              <Outlet />
            </div>
          </div>

          {/* Mobile footer link */}
          <p className="mt-6 text-center text-sm text-[#64748B] lg:hidden">
            <Link to="/" className="text-[#EC4899] hover:underline font-medium">
              Về trang chủ
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
