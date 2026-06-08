import { GoogleLogin } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function GoogleLoginButton() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()

  if (!googleClientId) {
    return (
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Thêm VITE_GOOGLE_CLIENT_ID vào .env để bật đăng nhập Google
      </p>
    )
  }

  const handleSuccess = async (credential: string) => {
    try {
      const res = await authApi.googleLogin({ idToken: credential })
      setAuth(res.data.accessToken, res.data.user)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
      toast.success('Đăng nhập Google thành công')
    } catch {
      toast.error('Đăng nhập Google thất bại')
    }
  }

  return (
    <div className="google-login-btn flex w-full justify-center overflow-hidden rounded-lg">
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) {
            handleSuccess(res.credential)
          } else {
            toast.error('Không nhận được credential Google')
          }
        }}
        onError={() => toast.error('Đăng nhập Google thất bại')}
        theme="outline"
        size="large"
        width="360"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  )
}
