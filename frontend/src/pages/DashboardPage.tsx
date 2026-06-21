import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Flame, Star, TrendingUp, Target, ChevronRight, Zap, Sparkles, BookOpen, Trophy } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { reviewApi } from '@/api/review'
import {
  JumpBackStrip,
  RecentList,
  SuggestedStrip,
} from '@/components/dashboard/DashboardSections'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import type { DeckSummary } from '@/types/deck'

import heroImage from '@/assets/hero.png'

const HERO_IMAGE = heroImage

function pickRecent(decks: DeckSummary[], limit = 8) {
  return [...decks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

// Mock user progress data (seed data - will be replaced by real API)
const MOCK_USER_PROGRESS = {
  streak: 12,
  totalXp: 2450,
  dailyXp: 35,
  dailyGoal: 50,
  totalDecks: 8,
  totalCardsLearned: 156,
  rank: 127,
  rankTitle: 'Học sinh',
  weeklyXp: 420,
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1500, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const timeout = setTimeout(() => {
      let startTime: number
      let animationFrame: number

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(easeOut * end))

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }, delay)

    return () => clearTimeout(timeout)
  }, [end, duration, delay, hasStarted])

  return { count, ref }
}

// Animated stat card
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
}: {
  icon: typeof Star
  value: number
  label: string
  color: string
  delay?: number
}) {
  const { count, ref } = useAnimatedCounter(value, 1500, delay)

  return (
    <div
      ref={ref}
      className="group bg-[#252030]/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#3D3348] hover:border-[#EC4899]/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <p className="text-xl font-extrabold text-[#F5F0FA]">
            {count.toLocaleString()}
          </p>
          <p className="text-xs text-[#8B7A9E]">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Streak banner
function StreakBanner({ streak, xp, rank, rankTitle }: { streak: number; xp: number; rank: number; rankTitle: string }) {
  const { count: streakCount, ref: streakRef } = useAnimatedCounter(streak, 1000, 0)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (streak >= 7) {
      setShowCelebration(true)
    }
  }, [streak])

  return (
    <div ref={streakRef} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#F97316] p-6 shadow-xl">
      {/* Glow effect */}
      <div className="absolute -top-1/2 -right-1/4 w-64 h-64 rounded-full bg-[#EC4899]/30 blur-3xl" />
      <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 rounded-full bg-[#F97316]/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        {/* Left: Streak */}
        <div className="flex items-center gap-4">
          <div className={`relative ${streak > 0 ? 'animate-wiggle' : ''}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] flex items-center justify-center shadow-lg">
              <Flame className="w-8 h-8 text-[#EF4444] fill-[#EF4444]" />
            </div>
            {showCelebration && (
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#EF4444] text-white text-xs font-bold flex items-center justify-center shadow-lg animate-bounce">
                🔥
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{streakCount}</p>
            <p className="text-sm text-white/70">Ngày streak</p>
          </div>
        </div>

        {/* Center: XP */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center shadow-lg">
            <Star className="w-8 h-8 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{xp.toLocaleString()}</p>
            <p className="text-sm text-white/70">XP tổng cộng</p>
          </div>
        </div>

        {/* Right: Rank */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-[#EC4899]" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">#{rank}</p>
            <p className="text-sm text-white/70">{rankTitle}</p>
          </div>
        </div>

        {/* CTA */}
        <Button
          to="/library"
          size="sm"
          className="hidden xl:flex gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
        >
          <Zap className="w-4 h-4" />
          Học ngay
        </Button>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4">
        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] transition-all duration-1000"
            style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-white/60 mt-1">
          {streak >= 30 ? '🎉 Chúc mừng! Đạt streak 30 ngày!' : `${30 - streak} ngày nữa để đạt mốc 30 ngày`}
        </p>
      </div>
    </div>
  )
}

// Daily goal card
function DailyGoalCard({ current, goal }: { current: number; goal: number }) {
  const progress = Math.min((current / goal) * 100, 100)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 500)
    return () => clearTimeout(timeout)
  }, [progress])

  return (
    <div className="relative bg-[#252030]/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-[#3D3348] hover:border-[#EC4899]/40 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#EC4899]" />
          <span className="font-semibold text-[#F5F0FA]">Mục tiêu hôm nay</span>
        </div>
        <span className="text-sm text-[#8B7A9E]">
          <span className="font-bold text-[#EC4899]">{current}</span>/{goal} XP
        </span>
      </div>

      {/* Progress ring */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#3D3348" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#dailyGoalGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${animatedProgress * 2.64} 264`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="dailyGoalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[#EC4899] mb-1" />
          <span className="text-xl font-extrabold text-[#F5F0FA]">{Math.round(animatedProgress)}%</span>
        </div>
      </div>

      {progress >= 100 ? (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            Hoàn thành!
          </span>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-[#8B7A9E]">
          Còn <span className="font-bold text-[#EC4899]">{goal - current}</span> XP nữa để hoàn thành
        </p>
      )}
    </div>
  )
}

// Quick stats grid
function QuickStatsGrid({ totalDecks, totalCardsLearned, weeklyXp }: { totalDecks: number; totalCardsLearned: number; weeklyXp: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard icon={BookOpen} value={totalDecks} label="Deck của bạn" color="#EC4899" delay={100} />
      <StatCard icon={Star} value={totalCardsLearned} label="Thẻ đã học" color="#10B981" delay={200} />
      <StatCard icon={TrendingUp} value={weeklyXp} label="XP tuần này" color="#F97316" delay={300} />
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const mineQuery = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 24 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 24 }).then((r) => r.data),
  })

  const suggestedQuery = useQuery({
    queryKey: ['decks', { mine: false, page: 0, size: 8 }],
    queryFn: () => decksApi.list({ mine: false, page: 0, size: 8 }).then((r) => r.data),
  })

  const recentDecks = mineQuery.data ? pickRecent(mineQuery.data.content) : []
  const suggestedDecks = suggestedQuery.data?.content ?? []
  const jumpBackDecks = recentDecks.slice(0, 4)

  const dueQueries = useQueries({
    queries: jumpBackDecks.map((deck) => ({
      queryKey: ['review', 'due', deck.slug, 'summary'],
      queryFn: () => reviewApi.getDue({ deckRef: deck.slug, limit: 1 }).then((r) => r.data.dueCount),
      staleTime: 60_000,
    })),
  })

  const dueCounts = Object.fromEntries(
    jumpBackDecks.map((deck, i) => [deck.slug, dueQueries[i]?.data ?? 0]),
  )
  const dueLoading = dueQueries.some((q) => q.isLoading)

  // Calculate total due cards
  const totalDueCards = Object.values(dueCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#1A1520' }}>
      {/* Hero image as subtle background */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) saturate(1.2)',
        }}
      />
      {/* Soft gradient overlay for warmth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1520] via-[#252030]/95 to-[#1A1520] opacity-90" />
      {/* Subtle radial glow from center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(236,72,153,0.08)_0%,transparent_60%)]" />
      
      <div className="relative z-10 space-y-8">
      {/* Streak Banner */}
      <StreakBanner
        streak={MOCK_USER_PROGRESS.streak}
        xp={MOCK_USER_PROGRESS.totalXp}
        rank={MOCK_USER_PROGRESS.rank}
        rankTitle={MOCK_USER_PROGRESS.rankTitle}
      />

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Due cards alert */}
        <div className="relative overflow-hidden rounded-2xl bg-[#252030]/80 backdrop-blur-sm p-5 shadow-lg border border-[#3D3348]">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#EC4899]/8 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2D2538] flex items-center justify-center shadow-md">
              <span className="text-2xl">📚</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-[#F5F0FA]">
                {totalDueCards || MOCK_USER_PROGRESS.totalCardsLearned / 10} thẻ đến hạn
              </p>
              <p className="text-sm text-[#8B7A9E]">Cần ôn lại ngay</p>
            </div>
            <Button to="/library" size="sm" className="shrink-0">
              Ôn ngay
            </Button>
          </div>
        </div>

        {/* Daily Goal */}
        <DailyGoalCard current={MOCK_USER_PROGRESS.dailyXp} goal={MOCK_USER_PROGRESS.dailyGoal} />

        {/* Weekly XP */}
        <div className="relative overflow-hidden rounded-2xl bg-[#252030]/80 backdrop-blur-sm p-5 shadow-lg border border-[#3D3348]">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#F97316]/8 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2D2538] flex items-center justify-center shadow-md">
              <TrendingUp className="w-7 h-7 text-[#F97316]" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-[#F5F0FA]">
                +{MOCK_USER_PROGRESS.weeklyXp} XP
              </p>
              <p className="text-sm text-[#8B7A9E]">Tuần này</p>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC4899] to-[#F97316] border-2 border-[#252030] flex items-center justify-center text-white text-xs font-bold">
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsGrid
        totalDecks={recentDecks.length || MOCK_USER_PROGRESS.totalDecks}
        totalCardsLearned={MOCK_USER_PROGRESS.totalCardsLearned}
        weeklyXp={MOCK_USER_PROGRESS.weeklyXp}
      />

      {/* Empty State */}
      {!mineQuery.isLoading && recentDecks.length === 0 && (
        <section className="relative overflow-hidden rounded-3xl bg-[#252030]/60 backdrop-blur-sm p-8 text-center border border-[#3D3348] shadow-lg">
          <div className="absolute -top-1/2 -right-1/2 w-64 h-64 rounded-full bg-[#EC4899]/5 blur-3xl" />
          <div className="relative">
            <span className="text-6xl mb-4 block">🌱</span>
            <p className="text-xl font-bold text-[#F5F0FA] mb-2">Bắt đầu hành trình học tập</p>
            <p className="text-[#8B7A9E] mb-6 max-w-md mx-auto">
              Tạo deck đầu tiên hoặc khám phá kho deck công khai từ cộng đồng
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button to="/library" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Tạo deck mới
              </Button>
              <Button to="/explore" variant="outline" className="gap-2">
                Khám phá deck
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Jump Back Section */}
      {(mineQuery.isLoading || recentDecks.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Quay lại học ngay
            </h2>
            <Link
              to="/library"
              className="text-sm font-semibold text-[#EC4899] hover:text-[#F97316] flex items-center gap-1 transition-colors"
            >
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <JumpBackStrip
            decks={recentDecks}
            dueCounts={dueCounts}
            dueLoading={dueLoading}
            loading={mineQuery.isLoading}
          />
        </section>
      )}

      {/* Recent Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Gần đây
          </h2>
          <Link
            to="/library"
            className="text-sm font-semibold text-[#EC4899] hover:text-[#F97316] flex items-center gap-1 transition-colors"
          >
            Thư viện
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <RecentList
          decks={recentDecks}
          loading={mineQuery.isLoading}
          currentUsername={user?.username}
          emptyMessage="Chưa có deck — tạo mới hoặc copy từ Khám phá."
        />
      </section>

      {/* Suggested Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Gợi ý cho bạn
            </h2>
            <p className="text-sm text-[#A78BFA] mt-0.5">
              Deck công khai từ cộng đồng
            </p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-[#EC4899] hover:text-[#F97316] flex items-center gap-1 transition-colors"
          >
            Khám phá
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <SuggestedStrip
          decks={suggestedDecks}
          loading={suggestedQuery.isLoading}
          emptyMessage="Chưa có deck công khai — hãy tạo deck và bật Công khai."
        />
      </section>
      </div>
    </div>
  )
}
