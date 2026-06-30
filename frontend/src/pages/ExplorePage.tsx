import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Compass, TrendingUp, Sparkles, Trophy, X, Plus, Play, Target, Users,
} from 'lucide-react'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function MiniQuizCard({ quiz, navigate }: { quiz: any; navigate: ReturnType<typeof useNavigate> }) {
  const score = quiz.avgScore != null ? Math.round(quiz.avgScore * 100) : null
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#3D3348] bg-[#252030]/80 transition-all hover:-translate-y-0.5 hover:border-[#EC4899]/30 hover:shadow-lg">
      {quiz.coverImageUrl && (
        <div className="relative h-28 overflow-hidden">
          <img src={quiz.coverImageUrl} alt={quiz.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#252030] to-transparent" />
        </div>
      )}
      <div className="flex h-1 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-sm font-bold text-[#F5F0FA] line-clamp-2 group-hover:text-[#EC4899] transition-colors">
          {quiz.title}
        </h3>
        <div className="mb-auto flex flex-wrap items-center gap-3 text-[10px] text-[#8B7A9E]">
          <span className="flex items-center gap-1"><Target className="h-3 w-3 text-[#10B981]" />{quiz.questionCount} câu</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3 text-[#A78BFA]" />{quiz.attemptCount} lượt</span>
          {score != null && <span className="text-[#F97316]">{score}% TB</span>}
        </div>
        <Button size="sm" className="mt-3 w-full gap-1.5" onClick={() => navigate(`/quiz/play/${quiz.id}`)}>
          <PlayIcon className="h-3 w-3" /> Chơi
        </Button>
      </div>
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
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} strokeWidth={2.5} />
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
    queryKey: ['quizzes', 'explore', urlQ],
    queryFn: () => quizApi.listExplore({ page: 0, size: 12 }).then((r) => r.data),
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]">Khám phá</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#F5F0FA] leading-tight">Khám phá nội dung</h1>
          <p className="text-xs text-[#8B7A9E] mt-0.5">
            {tab === 'decks' ? 'Copy deck về thư viện để bắt đầu học' : 'Thi đua top với các quiz đã duyệt'}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-xl shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7A9E] pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
            placeholder={tab === 'decks' ? 'Tìm kiếm deck...' : 'Tìm kiếm quiz...'}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-[#252030]/70 border border-[#3D3348] text-[#F5F0FA] placeholder:text-[#8B7A9E] focus:outline-none focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/10 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#2D2538] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#8B7A9E]" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
          >
            Tìm
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 rounded-xl border border-[#3D3348] bg-[#1A1520] p-1 w-fit">
        <button
          onClick={() => handleTabChange('decks')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
            tab === 'decks'
              ? 'bg-[#EC4899]/20 text-[#EC4899] shadow-sm'
              : 'text-[#8B7A9E] hover:text-[#F5F0FA]',
          )}
        >
          <Sparkles className="w-4 h-4" />
          Deck
        </button>
        <button
          onClick={() => handleTabChange('quizzes')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
            tab === 'quizzes'
              ? 'bg-[#F97316]/20 text-[#F97316] shadow-sm'
              : 'text-[#8B7A9E] hover:text-[#F5F0FA]',
          )}
        >
          <Trophy className="w-4 h-4" />
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
          <button onClick={clearSearch} className="text-[#EC4899] hover:underline font-medium">
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* ── Trending (only when not searching + deck tab) ── */}
      {!urlQ && tab === 'decks' && (
        <div className="rounded-xl border p-4 bg-[#252030]/50 backdrop-blur-sm border-[#3D3348]">
          <SectionTitle icon={TrendingUp} title="Xu hướng tuần này" />
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map((topic) => (
              <button
                key={topic.name}
                onClick={() => handleTrendingClick(topic.name)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${topic.color}15`,
                  borderColor: `${topic.color}40`,
                  color: topic.color,
                }}
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
          {/* Results header */}
          {totalDecks > 0 && (
            <SectionTitle
              icon={Sparkles}
              title={`${totalDecks} deck`}
              action={<span className="text-xs text-[#8B7A9E] font-normal">Trang {(data?.page ?? 0) + 1}</span>}
              accentColor="#F97316"
            />
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <DeckGridSkeleton key={i} />)}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-xl border p-5 text-center bg-[#252030]/50 backdrop-blur-sm border-[#3D3348]">
              <p className="text-sm font-semibold text-[#EF4444]">Không tải được danh sách deck</p>
              <p className="text-xs text-[#8B7A9E] mt-1">Vui lòng thử lại sau</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && totalDecks === 0 && (
            <div className="rounded-xl border p-8 text-center bg-[#252030]/50 backdrop-blur-sm border-[#3D3348]">
              <span className="text-3xl mb-3 block">🔍</span>
              <h2 className="text-base font-bold text-[#F5F0FA] mb-1">
                {urlQ ? 'Không tìm thấy kết quả' : 'Chưa có deck công khai'}
              </h2>
              <p className="text-xs text-[#8B7A9E] mb-4 max-w-sm mx-auto">
                {urlQ
                  ? `Không có deck nào phù hợp với "${urlQ}".`
                  : 'Hãy tạo deck đầu tiên và bật chế độ Công khai để chia sẻ.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {urlQ ? (
                  <Button onClick={clearSearch} variant="outline" size="sm">Xem tất cả</Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />Tạo deck mới
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Grid */}
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
                    Xem thêm <Sparkles className="w-3.5 h-3.5" />
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <SectionTitle
              icon={Trophy}
              title={`${totalQuizzes} quiz`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/quiz/create')}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3 w-3" />Tạo quiz
                </Button>
              }
              accentColor="#F97316"
            />
          </div>

          {/* Loading */}
          {quizLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4">
                  <div className="h-28 rounded-lg bg-[#3D3348] mb-3" />
                  <div className="h-4 w-3/4 rounded bg-[#3D3348] mb-2" />
                  <div className="h-4 w-1/2 rounded bg-[#3D3348]" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!quizLoading && quizzes.length === 0 && (
            <div className="rounded-xl border p-8 text-center bg-[#252030]/50 backdrop-blur-sm border-[#3D3348]">
              <span className="text-3xl mb-3 block">🏆</span>
              <h2 className="text-base font-bold text-[#F5F0FA] mb-1">
                {urlQ ? 'Không tìm thấy quiz phù hợp' : 'Chưa có quiz nào trong Khám phá'}
              </h2>
              <p className="text-xs text-[#8B7A9E] mb-4 max-w-sm mx-auto">
                {urlQ
                  ? `Không có quiz nào phù hợp với "${urlQ}".`
                  : 'Hãy tạo quiz đầu tiên và gửi duyệt để xuất hiện ở đây.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => navigate('/quiz/create')} size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />Tạo quiz
                </Button>
                {urlQ && (
                  <Button onClick={clearSearch} variant="outline" size="sm">Xóa bộ lọc</Button>
                )}
              </div>
            </div>
          )}

          {/* Grid */}
          {!quizLoading && quizzes.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quizzes.map((quiz) => (
                  <MiniQuizCard key={quiz.id} quiz={quiz} navigate={navigate} />
                ))}
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/quiz')}
                  className="gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" />Xem thêm quiz
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
