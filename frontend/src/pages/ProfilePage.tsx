import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, Zap } from 'lucide-react'
import { lumotoast } from '@/components/ui/Toast'
import { authApi } from '@/api/auth'
import ImageUploadField from '@/components/ui/ImageUploadField'
import { inputClass } from '@/components/ui/inputClass'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiError'

const profileSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự').max(50),
})

type ProfileData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Tối thiểu 8 ký tự').max(100),
})

type PasswordData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)

  // Profile form
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null)
  const [saving, setSaving] = useState(false)
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username ?? '' },
  })

  // Password form
  const [showPasswords, setShowPasswords] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: pwErrors },
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileData) => {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await authApi.updateProfile({
        username: data.username,
        avatarUrl: avatarUrl ?? undefined,
      })
      setAuth(accessToken, res.data)
      lumotoast.success('Đã cập nhật hồ sơ')
    } catch (err) {
      lumotoast.error(getApiErrorMessage(err, 'Không thể cập nhật'))
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordData) => {
    setPwSaving(true)
    try {
      await authApi.changePassword(data)
      lumotoast.success('Đổi mật khẩu thành công')
      resetPassword()
    } catch (err) {
      lumotoast.error(getApiErrorMessage(err, 'Không thể đổi mật khẩu'))
    } finally {
      setPwSaving(false)
    }
  }

  const roleLabel = user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Cài đặt tài khoản</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Quản lý thông tin và bảo mật tài khoản</p>
      </div>

      {/* Two-column layout on md+ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile section */}
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="lumo-card space-y-5 p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Hồ sơ</h2>

          <ImageUploadField
            label="Ảnh đại diện"
            folder="avatars"
            value={avatarUrl}
            onChange={setAvatarUrl}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Tên hiển thị
            </label>
            <input className={inputClass(!!profileErrors.username)} {...registerProfile('username')} />
            {profileErrors.username && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{profileErrors.username.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        {/* Change password section */}
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="lumo-card space-y-5 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Shield className="h-4 w-4" />
            Đổi mật khẩu
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                className={inputClass(!!pwErrors.currentPassword)}
                {...registerPassword('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.currentPassword && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{pwErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Mật khẩu mới
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className={inputClass(!!pwErrors.newPassword)}
              {...registerPassword('newPassword')}
            />
            {pwErrors.newPassword && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{pwErrors.newPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {pwSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>

        {/* Account info — full width */}
        <div className="lumo-card p-6 md:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Zap className="h-4 w-4" />
            Thông tin tài khoản
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[var(--color-text-muted)] text-xs">Email</p>
              <p className="font-medium text-[var(--color-text)]">{user?.email}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] text-xs">Vai trò</p>
              <p className="font-medium text-[var(--color-text)]">{roleLabel}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] text-xs">XP</p>
              <p className="font-medium text-[var(--color-text)]">{user?.xp?.toLocaleString() ?? 0}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] text-xs">Streak</p>
              <p className="font-medium text-[var(--color-text)]">{user?.streak ?? 0} ngày</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
