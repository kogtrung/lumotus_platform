import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '@/components/auth/PrivateRoute'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<PlaceholderPage title="Khám phá" />} />
          <Route path="progress" element={<PlaceholderPage title="Tiến độ" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
