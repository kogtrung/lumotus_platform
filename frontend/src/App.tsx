import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '@/components/auth/PrivateRoute'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import MinimalLayout from '@/components/layout/MinimalLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import ExplorePage from '@/pages/ExplorePage'
import ProgressPage from '@/pages/ProgressPage'
import DeckDetailPage from '@/pages/DeckDetailPage'
import ReviewPage from '@/pages/ReviewPage'
import FlashcardPage from '@/pages/FlashcardPage'
import FlashcardStudyPage from '@/pages/FlashcardStudyPage'
import QuizPage from '@/pages/QuizPage'
import QuizPlayPage from '@/pages/QuizPlayPage'
import QuizCreatePage from '@/pages/QuizCreatePage'
import QuizLeaderboardPage from '@/pages/QuizLeaderboardPage'
import QuizDetailPage from '@/pages/QuizDetailPage'
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
        {/* Review = dedicated flashcard review page */}
        <Route path="decks/:deckRef/review" element={<MinimalLayout />}>
          <Route index element={<ReviewPage />} />
        </Route>

        {/* Flashcard study session */}
        <Route path="decks/:deckRef/flashcard" element={<MinimalLayout />}>
          <Route index element={<FlashcardStudyPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="home" element={<DashboardPage />} />
          <Route path="flashcard" element={<FlashcardPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz/create" element={<QuizCreatePage />} />
          <Route path="quiz/detail/:quizId" element={<QuizDetailPage />} />
          <Route path="quiz/leaderboard/:quizId" element={<QuizLeaderboardPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="decks/:deckRef" element={<DeckDetailPage />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>

        {/* Legacy /library routes → /home */}
        <Route path="library" element={<Navigate to="/home" replace />} />
        <Route path="library/:rest" element={<Navigate to="/home" replace />} />

        {/* Quiz play session (no layout chrome) */}
        <Route path="quiz/play/:quizId" element={<QuizPlayPage />} />
        <Route path="decks/:deckRef/quiz" element={<Navigate to="/quiz" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
