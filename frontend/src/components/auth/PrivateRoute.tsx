import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function PrivateRoute() {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const location = useLocation()

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-muted)]">
        Đang tải...
      </div>
    )
  }

  if (!user) {
    // Save intended destination to sessionStorage before redirecting to login
    // This persists across page refreshes unlike React Router state
    const fromPath = location.pathname + location.search
    sessionStorage.setItem('pending_quiz_play', fromPath)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
