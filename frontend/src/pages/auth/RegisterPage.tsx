import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { lumotoast } from '@/components/ui/Toast'
import { Eye, EyeOff, Sparkles, Check } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import AuthDivider from '@/components/auth/AuthDivider'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const schema = z
  .object({
    username: z
      .string()
      .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
      .max(50, 'Tên đăng nhập tối đa 50 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// Password strength checker
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Ít nhất 8 ký tự', valid: password.length >= 8 },
    { label: 'Có chữ hoa', valid: /[A-Z]/.test(password) },
    { label: 'Có chữ số', valid: /[0-9]/.test(password) },
  ]

  const strength = checks.filter((c) => c.valid).length

  const colors = ['#EF4444', '#F59E0B', '#10B981']
  // Labels for password strength indicator (unused but kept for future use)
  void ['Yếu', 'Trung bình', 'Mạnh']

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i < strength ? colors[strength - 1] : '#E2E5EC',
            }}
          />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-xs">
            <div
              className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
                check.valid ? 'bg-[#10B981] text-white' : 'bg-[#E2E5EC] text-transparent'
              }`}
            >
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className={check.valid ? 'text-[#10B981]' : 'text-[#94A3B8]'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#374151]">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">{error}</p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchedPassword = watch('password', '')

  const onSubmit = async ({ username, email, password }: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.register({ username, email, password })
      setAuth(res.data.accessToken, res.data.user)
      navigate('/home', { replace: true })
      lumotoast.success('Đăng ký thành công')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đăng ký thất bại'
      lumotoast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#EA580C] mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0F172A]">Tạo tài khoản</h2>
        <p className="mt-1 text-[#64748B]">Đăng ký miễn phí và bắt đầu học ngay</p>
      </div>

      {/* Google Login */}
      <div>
        <GoogleLoginButton />
      </div>

      <AuthDivider />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username */}
        <Field label="Tên đăng nhập" error={errors.username?.message}>
          <input
            type="text"
            autoComplete="username"
            placeholder="nguyen_vocab"
            className={cn(
              'w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition-all',
              'focus:ring-4 focus:ring-[#EC4899]/10',
              errors.username
                ? 'border-[#EF4444] focus:border-[#EF4444]'
                : 'border-[#E2E5EC] focus:border-[#EC4899]'
            )}
            {...register('username')}
          />
        </Field>

        {/* Email */}
        <Field label="Email" error={errors.email?.message}>
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
        </Field>

        {/* Password */}
        <Field label="Mật khẩu" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          {watchedPassword && <PasswordStrength password={watchedPassword} />}
        </Field>

        {/* Confirm Password */}
        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                'w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 text-sm text-[#0F172A] outline-none transition-all',
                'focus:ring-4 focus:ring-[#EC4899]/10',
                errors.confirmPassword
                  ? 'border-[#EF4444] focus:border-[#EF4444]'
                  : 'border-[#E2E5EC] focus:border-[#EC4899]'
              )}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#EC4899] transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full py-3 text-base">
          {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
        </Button>
      </form>

      {/* Terms */}
      <p className="text-center text-xs text-[#94A3B8]">
        Bằng việc đăng ký, bạn đồng ý với{' '}
        <Link to="/terms" className="text-[#EC4899] hover:underline">
          Điều khoản sử dụng
        </Link>{' '}
        và{' '}
        <Link to="/privacy" className="text-[#EC4899] hover:underline">
          Chính sách bảo mật
        </Link>
      </p>

      {/* Footer */}
      <p className="text-center text-sm text-[#64748B]">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#EC4899] hover:text-[#DB2777] transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
