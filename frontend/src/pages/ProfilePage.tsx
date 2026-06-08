import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import ImageUploadField from '@/components/ui/ImageUploadField'
import { inputClass } from '@/components/ui/inputClass'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiError'

const schema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự').max(50),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: user?.username ?? '' },
  })

  const onSubmit = async (data: FormData) => {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await authApi.updateProfile({
        username: data.username,
        avatarUrl: avatarUrl ?? undefined,
      })
      setAuth(accessToken, res.data)
      toast.success('Đã cập nhật hồ sơ')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Cài đặt tài khoản</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user?.email}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="lumo-card mt-6 space-y-5 p-6">
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
          <input className={inputClass(!!errors.username)} {...register('username')} />
          {errors.username && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.username.message}</p>
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
    </div>
  )
}
