import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { lumotoast } from '@/components/ui/Toast'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import AuthDivider from '@/components/auth/AuthDivider'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setAuth(res.data.accessToken, res.data.user)
      const fromState = (location.state as { from?: { pathname: string } })?.from?.pathname
      const pendingQuiz = sessionStorage.getItem('pending_quiz_play')
      const redirectTo = res.data.user.role === 'ADMIN'
        ? '/admin'
        : fromState
          || (pendingQuiz && pendingQuiz.startsWith('/quiz/play/') ? pendingQuiz : null)
          || '/home'
      if (pendingQuiz?.startsWith('/quiz/play/')) {
        sessionStorage.removeItem('pending_quiz_play')
      }
      navigate(redirectTo, { replace: true })
      lumotoast.success('Đăng nhập thành công')
    } catch {
      lumotoast.error('Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F9A8D4] mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0F172A]">Chào mừng trở lại</h2>
        <p className="mt-1 text-[#64748B]">Đăng nhập để tiếp tục hành trình học tập</p>
      </div>

      {/* Google Login */}
      <div>
        <GoogleLoginButton />
      </div>

      <AuthDivider />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#374151]">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="nguyen@example.com"
            className={cn(
              'w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition-all',
              'focus:ring-4 focus:ring-[#EC4899]/10',
              errors.email
                ? 'border-[#EF4444] focus:border-[#EF4444]'
                : 'border-[#E2E5EC] focus:border-[#EC4899]'
            )}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-[#374151]">Mật khẩu</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#EC4899] hover:text-[#DB2777]"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 text-sm text-[#0F172A] outline-none transition-all',
                'focus:ring-4 focus:ring-[#EC4899]/10',
                errors.password
                  ? 'border-[#EF4444] focus:border-[#EF4444]'
                  : 'border-[#E2E5EC] focus:border-[#EC4899]'
              )}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#EC4899] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-base"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-[#64748B]">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-semibold text-[#EC4899] hover:text-[#DB2777] transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
