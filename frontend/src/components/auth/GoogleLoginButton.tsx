import { GoogleLogin } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import { lumotoast } from '@/components/ui/Toast'
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
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/home'
      navigate(from, { replace: true })
      lumotoast.success('Đăng nhập Google thành công')
    } catch {
      lumotoast.error('Đăng nhập Google thất bại')
    }
  }

  return (
    <div className="google-login-btn flex w-full justify-center overflow-hidden rounded-lg">
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) {
            handleSuccess(res.credential)
          } else {
            lumotoast.error('Không nhận được credential Google')
          }
        }}
        onError={() => lumotoast.error('Đăng nhập Google thất bại')}
        theme="outline"
        size="large"
        width="360"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  )
}
