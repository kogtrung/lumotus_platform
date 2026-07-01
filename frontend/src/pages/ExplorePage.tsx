import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Compass, TrendingUp, Sparkles, Trophy, X, Plus, Target, Users,
  Crown, Clock, ArrowUpDown, Flame, ChevronDown,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { quizApi, LeaderboardEntry } from '@/api/study'
import { topicsApi } from '@/api/topics'
import { useAuthStore } from '@/store/authStore'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import TopicFilter from '@/components/deck/TopicFilter'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const TRENDING_TOPICS = [
  { name: 'IELTS Vocabulary', count: 156, color: '#EC4899' },
  { name: 'Business English', count: 89, color: '#10B981' },
  { name: 'TOEFL Prep', count: 67, color: '#F97316' },
  { name: 'Daily Conversation', count: 234, color: '#A78BFA' },
]

type ExploreTab = 'decks' | 'quizzes'
type QuizSort = 'popular' | 'newest' | 'trending'

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function MiniPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
    >
      <PlayIcon className="h-3 w-3" />
      Chơi
    </button>
  )
}

// ─── Quiz Stack Card (list view) ───────────────────────────────────────────────
function QuizStackCard({
  quiz,
  navigate,
  rank,
}: {
  quiz: any
  navigate: ReturnType<typeof useNavigate>
  rank?: number
}) {
  const score = quiz.avgScore != null ? Math.round(quiz.avgScore * 100) : null

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-400', text: 'text-yellow-900', emoji: '🥇' }
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-700', emoji: '🥈' }
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', emoji: '🥉' }
    return null
  }

  const badge = rank ? getRankBadge(rank) : null

  return (
    <div
      className="group relative flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/80 p-4 transition-all hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:bg-[#252030] hover:shadow-lg"
      onClick={() => navigate(`/quiz/play/${quiz.id}`)}
    >
      {/* Rank badge for top 3 */}
      {badge && (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', badge.bg)}>
          {badge.emoji}
        </div>
      )}

      {/* Cover image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#2D2538]">
        {quiz.coverImageUrl ? (
          <img src={quiz.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Trophy className="h-6 w-6 text-[#EC4899]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-[#F5F0FA] group-hover:text-[#EC4899] transition-colors">
          {quiz.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#8B7A9E]">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3 text-[#10B981]" />
            {quiz.questionCount} câu
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#A78BFA]" />
            {quiz.attemptCount} lượt
          </span>
          {score != null && (
            <span className="flex items-center gap-1 font-semibold text-[#F97316]">
              <Flame className="h-3 w-3" />
              {score}% TB
            </span>
          )}
        </div>
      </div>

      {/* Mini play button */}
      <MiniPlayButton onClick={() => navigate(`/quiz/play/${quiz.id}`)} />
    </div>
  )
}

// ─── Quiz Leaderboard Sidebar ─────────────────────────────────────────────────
function QuizLeaderboardSidebar({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['global-leaderboard'],
    queryFn: () => quizApi.getGlobalLeaderboard(10).then((r) => r.data),
  })

  const getRankStyle = (rank: number) => {
    if (rank === 0) return { bg: 'bg-yellow-400', text: 'text-yellow-900', icon: '🥇' }
    if (rank === 1) return { bg: 'bg-gray-300', text: 'text-gray-700', icon: '🥈' }
    if (rank === 2) return { bg: 'bg-amber-600', text: 'text-amber-100', icon: '🥉' }
    return { bg: 'bg-gray-700/50', text: 'text-gray-300', icon: `#${rank + 1}` }
  }

  return (
    <div className="rounded-xl border border-[#3D3348] bg-[#252030]/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-400" strokeWidth={2.5} />
        <h3 className="text-sm font-bold text-[#F5F0FA]">Bảng xếp hạng</h3>
      </div>
      <p className="mb-3 text-[10px] text-[#8B7A9E]">Top người chơi quiz giỏi nhất</p>

      <div className="space-y-2">
        {leaderboard.map((entry, idx) => {
          const rank = getRankStyle(idx)
          return (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#2D2538]/50"
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold', rank.bg, rank.text)}>
                {rank.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#F5F0FA]">{entry.username}</p>
                <p className="text-[10px] text-[#8B7A9E]">{entry.totalAttempts} lượt • {entry.bestCorrectAnswers} đúng</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-[#10B981]">{Math.round(entry.bestScore * 100)}%</p>
                <p className="text-[10px] text-[#8B7A9E]">điểm TB</p>
              </div>
            </div>
          )
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="py-6 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-[#8B7A9E]/50" />
          <p className="text-xs text-[#8B7A9E]">Chưa có dữ liệu</p>
          <p className="text-[10px] text-[#8B7A9E]/70">Hãy làm quiz để xuất hiện trên bảng xếp hạng!</p>
        </div>
      )}

      <button
        onClick={() => navigate('/progress')}
        className="mt-3 w-full rounded-lg border border-[#3D3348] bg-[#2D2538]/50 px-3 py-2 text-xs font-semibold text-[#B8A8CC] transition-colors hover:border-[#EC4899]/30 hover:text-[#EC4899]"
      >
        Xem toàn bộ bảng xếp hạng
      </button>
    </div>
  )
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: QuizSort; onChange: (v: QuizSort) => void }) {
  const [open, setOpen] = useState(false)

  const options: { value: QuizSort; label: string; icon: typeof Flame }[] = [
    { value: 'popular', label: 'Phổ biến nhất', icon: Flame },
    { value: 'newest', label: 'Mới nhất', icon: Clock },
    { value: 'trending', label: 'Xu hướng', icon: TrendingUp },
  ]

  const current = options.find((o) => o.value === value) || options[0]
  const Icon = current.icon

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-[#3D3348] bg-[#252030]/80 px-3 py-2 text-xs font-semibold text-[#F5F0FA] transition-colors hover:border-[#EC4899]/30"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-[#8B7A9E]" />
        <Icon className="h-3.5 w-3.5" style={{ color: '#EC4899' }} />
        {current.label}
        <ChevronDown className={cn('h-3 w-3 text-[#8B7A9E] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-[#3D3348] bg-[#252030] p-1 shadow-xl">
          {options.map((opt) => {
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  value === opt.value ? 'bg-[#EC4899]/20 text-[#EC4899]' : 'text-[#B8A8CC] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
                )}
              >
                <OptIcon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  action,
  accentColor = '#EC4899',
}: {
  icon: typeof Compass
  title: string
  action?: React.ReactNode
  accentColor?: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} strokeWidth={2.5} />
        <h2 className="text-sm font-semibold text-[#C4B8D9]">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export default function ExplorePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [topicSlug, setTopicSlug] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(urlQ)
  const [tab, setTab] = useState<ExploreTab>('decks')
  const [quizSort, setQuizSort] = useState<QuizSort>('popular')

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.list().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['decks', { mine: false, topicSlug, q: urlQ, page: 0 }],
    queryFn: () =>
      decksApi
        .list({ mine: false, topicSlug: topicSlug ?? undefined, q: urlQ || undefined, page: 0, size: 24 })
        .then((r) => r.data),
    enabled: tab === 'decks',
  })

  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['quizzes', 'explore', quizSort],
    queryFn: () => quizApi.listExplore({ page: 0, size: 20, sort: quizSort }).then((r) => r.data),
    enabled: tab === 'quizzes',
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(localSearch ? { q: localSearch } : {})
  }

  const clearSearch = () => {
    setLocalSearch('')
    setSearchParams({})
  }

  const handleTrendingClick = (name: string) => {
    setLocalSearch(name)
    setSearchParams({ q: name })
  }

  const totalDecks = data?.totalElements ?? 0
  const quizzes = quizData?.content ?? []
  const totalQuizzes = quizData?.totalElements ?? 0

  const handleTabChange = (newTab: ExploreTab) => {
    setTab(newTab)
    setLocalSearch('')
    setSearchParams({})
    setTopicSlug(null)
  }

  return (
    <div className="space-y-6">
      {/* ── Header + Search row ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#EC4899]" strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]">Khám phá</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight text-[#F5F0FA]">Khám phá nội dung</h1>
          <p className="mt-0.5 text-xs text-[#8B7A9E]">
            {tab === 'decks' ? 'Copy deck về thư viện để bắt đầu học' : 'Thi đua top với các quiz đã duyệt'}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-xl shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
            placeholder={tab === 'decks' ? 'Tìm kiếm deck...' : 'Tìm kiếm quiz...'}
            className="w-full rounded-xl border border-[#3D3348] bg-[#252030]/70 py-2.5 pl-10 pr-10 text-sm text-[#F5F0FA] placeholder:text-[#8B7A9E] transition-all focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/10"
          />
          {localSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-[#2D2538]"
            >
              <X className="h-3.5 w-3.5 text-[#8B7A9E]" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
          >
            Tìm
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex w-fit gap-1 rounded-xl border border-[#3D3348] bg-[#1A1520] p-1">
        <button
          onClick={() => handleTabChange('decks')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
            tab === 'decks' ? 'bg-[#EC4899]/20 text-[#EC4899] shadow-sm' : 'text-[#8B7A9E] hover:text-[#F5F0FA]',
          )}
        >
          <Sparkles className="h-4 w-4" />
          Deck
        </button>
        <button
          onClick={() => handleTabChange('quizzes')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
            tab === 'quizzes' ? 'bg-[#F97316]/20 text-[#F97316] shadow-sm' : 'text-[#8B7A9E] hover:text-[#F5F0FA]',
          )}
        >
          <Trophy className="h-4 w-4" />
          Quiz
        </button>
      </div>

      {/* ── Search result meta ── */}
      {urlQ && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8B7A9E]">
            Kết quả cho <span className="font-semibold text-[#F5F0FA]">"{urlQ}"</span>
            {tab === 'decks' && totalDecks > 0 && ` — ${totalDecks} deck`}
            {tab === 'quizzes' && totalQuizzes > 0 && ` — ${totalQuizzes} quiz`}
          </span>
          <button onClick={clearSearch} className="font-medium text-[#EC4899] hover:underline">
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* ── Trending (deck tab only) ── */}
      {!urlQ && tab === 'decks' && (
        <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-4 backdrop-blur-sm">
          <SectionTitle icon={TrendingUp} title="Xu hướng tuần này" />
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map((topic) => (
              <button
                key={topic.name}
                onClick={() => handleTrendingClick(topic.name)}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${topic.color}15`, borderColor: `${topic.color}40`, color: topic.color }}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black">{topic.name[0]}</span>
                {topic.name}
                <span className="opacity-60">{topic.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Topics filter (deck tab only) ── */}
      {tab === 'decks' && topics.length > 0 && (
        <div>
          <SectionTitle icon={Compass} title="Chủ đề" />
          <TopicFilter topics={topics} selectedSlug={topicSlug} onChange={setTopicSlug} />
        </div>
      )}

      {/* ══════════════ DECKS SECTION ══════════════ */}
      {tab === 'decks' && (
        <>
          {totalDecks > 0 && (
            <SectionTitle
              icon={Sparkles}
              title={`${totalDecks} deck`}
              action={<span className="text-xs font-normal text-[#8B7A9E]">Trang {(data?.page ?? 0) + 1}</span>}
              accentColor="#F97316"
            />
          )}

          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <DeckGridSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-5 text-center backdrop-blur-sm">
              <p className="text-sm font-semibold text-[#EF4444]">Không tải được danh sách deck</p>
              <p className="mt-1 text-xs text-[#8B7A9E]">Vui lòng thử lại sau</p>
            </div>
          )}

          {!isLoading && !isError && totalDecks === 0 && (
            <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-8 text-center backdrop-blur-sm">
              <span className="mb-3 block text-3xl">🔍</span>
              <h2 className="mb-1 text-base font-bold text-[#F5F0FA]">
                {urlQ ? 'Không tìm thấy kết quả' : 'Chưa có deck công khai'}
              </h2>
              <p className="mx-auto mb-4 max-w-sm text-xs text-[#8B7A9E]">
                {urlQ ? `Không có deck nào phù hợp với "${urlQ}".` : 'Hãy tạo deck đầu tiên và bật chế độ Công khai để chia sẻ.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {urlQ ? (
                  <Button onClick={clearSearch} variant="outline" size="sm">
                    Xem tất cả
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Tạo deck mới
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isLoading && !isError && totalDecks > 0 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data?.content.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} variant="explore" currentUserId={user?.id} />
                ))}
              </div>
              {totalDecks > 12 && (
                <div className="text-center">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Xem thêm <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════ QUIZZES SECTION ══════════════ */}
      {tab === 'quizzes' && (
        <>
          <div className="flex items-center justify-between">
            <SectionTitle
              icon={Trophy}
              title={`${totalQuizzes} quiz`}
              action={
                <div className="flex items-center gap-2">
                  <SortDropdown value={quizSort} onChange={setQuizSort} />
                  <Button variant="outline" size="sm" onClick={() => navigate('/quiz/create')} className="gap-1.5 text-xs">
                    <Plus className="h-3 w-3" />
                    Tạo quiz
                  </Button>
                </div>
              }
              accentColor="#F97316"
            />
          </div>

          <div className="flex gap-6">
            {/* Main content */}
            <div className="min-w-0 flex-1">
              {quizLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl border border-[#3D3348] bg-[#252030]/80 p-4">
                      <div className="h-10 w-10 rounded-xl bg-[#3D3348]" />
                      <div className="h-16 w-16 rounded-lg bg-[#3D3348]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-[#3D3348]" />
                        <div className="h-3 w-1/2 rounded bg-[#3D3348]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!quizLoading && quizzes.length === 0 && (
                <div className="rounded-xl border border-[#3D3348] bg-[#252030]/50 p-8 text-center backdrop-blur-sm">
                  <span className="mb-3 block text-3xl">🏆</span>
                  <h2 className="mb-1 text-base font-bold text-[#F5F0FA]">
                    {urlQ ? 'Không tìm thấy quiz phù hợp' : 'Chưa có quiz nào trong Khám phá'}
                  </h2>
                  <p className="mx-auto mb-4 max-w-sm text-xs text-[#8B7A9E]">
                    {urlQ ? `Không có quiz nào phù hợp với "${urlQ}".` : 'Hãy tạo quiz đầu tiên và gửi duyệt để xuất hiện ở đây.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => navigate('/quiz/create')} size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Tạo quiz
                    </Button>
                    {urlQ && (
                      <Button onClick={clearSearch} variant="outline" size="sm">
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!quizLoading && quizzes.length > 0 && (
                <>
                  <div className="space-y-2">
                    {quizzes.map((quiz, idx) => (
                      <QuizStackCard
                        key={quiz.id}
                        quiz={quiz}
                        navigate={navigate}
                        rank={quizSort === 'popular' && idx < 3 ? idx + 1 : undefined}
                      />
                    ))}
                  </div>

                  {totalQuizzes > 20 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => navigate('/quiz')} className="gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />
                        Xem thêm quiz ({totalQuizzes - 20} còn lại)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar - Leaderboard */}
            <div className="w-72 shrink-0 space-y-4">
              <QuizLeaderboardSidebar navigate={navigate} />

              <div className="rounded-xl border border-[#3D3348] bg-[#252030]/80 p-4">
                <h3 className="mb-3 text-sm font-bold text-[#F5F0FA]">📊 Thống kê</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8B7A9E]">Tổng quiz</span>
                    <span className="font-bold text-[#F5F0FA]">{totalQuizzes}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8B7A9E]">Quiz phổ biến</span>
                    <span className="font-bold text-[#F97316]">
                      {Math.max(0, ...quizzes.map((q) => q.attemptCount || 0))} lượt
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8B7A9E]">Điểm TB cao nhất</span>
                    <span className="font-bold text-[#10B981]">
                      {quizzes.filter((q) => q.avgScore != null).length > 0
                        ? `${Math.round(Math.max(...quizzes.filter((q) => q.avgScore != null).map((q) => q.avgScore || 0)) * 100)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
