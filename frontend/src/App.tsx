import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '@/components/auth/PrivateRoute'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import MinimalLayout from '@/components/layout/MinimalLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import LibraryPage from '@/pages/LibraryPage'
import ExplorePage from '@/pages/ExplorePage'
import DeckDetailPage from '@/pages/DeckDetailPage'
import ReviewPage from '@/pages/ReviewPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        {/* Review trước — path cụ thể hơn decks/:deckRef */}
        <Route path="decks/:deckRef/review" element={<MinimalLayout />}>
          <Route index element={<ReviewPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="home" element={<DashboardPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="decks/:deckRef" element={<DeckDetailPage />} />
          <Route path="progress" element={<PlaceholderPage title="Tiến độ" />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
