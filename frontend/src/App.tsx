import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from '@/components/auth/PrivateRoute'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import MinimalLayout from '@/components/layout/MinimalLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import ExplorePage from '@/pages/ExplorePage'
import ProgressPage from '@/pages/ProgressPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import DeckDetailPage from '@/pages/DeckDetailPage'
import FlashcardPage from '@/pages/FlashcardPage'
import FlashcardStudyPage from '@/pages/FlashcardStudyPage'
import QuizPage from '@/pages/QuizPage'
import QuizPlayPage from '@/pages/QuizPlayPage'
import QuizLeaderboardPage from '@/pages/QuizLeaderboardPage'
import QuizDetailPage from '@/pages/QuizDetailPage'
import QuizHistoryPage from '@/pages/QuizHistoryPage'
import ProfilePage from '@/pages/ProfilePage'
// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminDeckManagement from '@/pages/admin/AdminDeckManagement'
import AdminQuizManagement from '@/pages/admin/AdminQuizManagement'
import AdminQuizEditPage from '@/pages/admin/AdminQuizEditPage'
import AdminQuizHistory from '@/pages/admin/AdminQuizHistory'
import AdminTopicManagement from '@/pages/admin/AdminTopicManagement'
import AdminUsers from '@/pages/admin/AdminUsers'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        {/* Flashcard study session */}
        <Route path="decks/:deckRef/flashcard" element={<MinimalLayout />}>
          <Route index element={<FlashcardStudyPage />} />
        </Route>

        {/* Main app layout */}
        <Route element={<MainLayout />}>
          <Route path="home" element={<DashboardPage />} />
          <Route path="flashcard" element={<FlashcardPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz/history" element={<QuizHistoryPage />} />
          <Route path="quiz/detail/:quizRef" element={<QuizDetailPage />} />
          <Route path="quiz/leaderboard" element={<QuizLeaderboardPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="decks/:deckRef" element={<DeckDetailPage />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>

        {/* Admin layout - separate from main app */}
        <Route element={<AdminLayout />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/decks" element={<AdminDeckManagement />} />
          <Route path="admin/quizzes" element={<AdminQuizManagement />} />
          <Route path="admin/quizzes/:quizRef" element={<AdminQuizEditPage />} />
          <Route path="admin/quiz-history" element={<AdminQuizHistory />} />
          <Route path="admin/topics" element={<AdminTopicManagement />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>

        {/* Legacy /library routes → /home */}
        <Route path="library" element={<Navigate to="/home" replace />} />
        <Route path="library/:rest" element={<Navigate to="/home" replace />} />

        {/* Quiz play session (no layout chrome) */}
        <Route path="quiz/play/:quizRef" element={<QuizPlayPage />} />
        <Route path="quiz/result/:attemptId" element={<QuizPlayPage />} />
        <Route path="decks/:deckRef/quiz" element={<Navigate to="/quiz" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
