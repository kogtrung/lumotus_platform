import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import AuthDivider from '@/components/auth/AuthDivider'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
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

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ username, email, password }: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.register({ username, email, password })
      setAuth(res.data.accessToken, res.data.user)
      navigate('/', { replace: true })
      toast.success('Đăng ký thành công')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đăng ký thất bại'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-text)]">Đăng ký</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Tạo tài khoản Lumotus miễn phí</p>

      <div className="mt-6">
        <GoogleLoginButton />
      </div>

      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tên đăng nhập" error={errors.username?.message}>
          <input
            type="text"
            autoComplete="username"
            className={inputClass(!!errors.username)}
            {...register('username')}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className={inputClass(!!errors.email)}
            {...register('email')}
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(!!errors.password)}
            {...register('password')}
          />
        </Field>

        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(!!errors.confirmPassword)}
            {...register('confirmPassword')}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
          Đăng nhập
        </Link>
      </p>
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
      <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)]',
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
  )
}
