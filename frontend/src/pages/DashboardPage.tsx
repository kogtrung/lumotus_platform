import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { AlertTriangle, BookOpen, ChevronRight, Compass, FileUp, Flame, Globe, Layers, List, Lock, Play, Plus, Search, Sparkles, Zap } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { quizApi } from '@/api/study'
import { reviewApi } from '@/api/review'
import { statsApi } from '@/api/stats'
import { progressApi } from '@/api/progress'
import CreateDeckDialog from '@/components/deck/CreateDeckDialog'
import ImportCsvDialog from '@/components/deck/ImportCsvDialog'
import DeckCard from '@/components/deck/DeckCard'
import DeckGridSkeleton from '@/components/deck/DeckGridSkeleton'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { findAnyActiveSession, clearSession, relativeTime } from '@/utils/studySession'
import type { StudySession } from '@/utils/studySession'
import StreakProgressBar from '@/components/ui/StreakProgressBar'

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE'
type SortMode = 'newest' | 'oldest' | 'az' | 'za'

function useAnimatedCounter(end: number, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = { current: null as HTMLDivElement | null }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true) },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const t = setTimeout(() => {
      let t0: number
      const raf = (ts: number) => {
        if (!t0) t0 = ts
        const p = Math.min((ts - t0) / duration, 1)
        setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end))
        if (p < 1) requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [end, duration, delay, started])

  return { count, ref }
}

function StreakBanner({ streak, xpToday }: { streak: number; xpToday: number }) {
  const { count: streakCount, ref: streakRef } = useAnimatedCounter(streak, 1000, 0)
  const { count: xpCount, ref: xpRef } = useAnimatedCounter(xpToday, 1000, 200)

  return (
    <div
      ref={(el) => { (streakRef as any).current = el }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#F97316] p-5 shadow-xl"
    >
      <div className="absolute -top-1/2 -right-1/4 w-64 h-64 rounded-full bg-[#EC4899]/30 blur-3xl" />
      <div className="absolute -bottom-1/2 -left-1/4 w-48 h-48 rounded-full bg-[#F97316]/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Flame className="h-7 w-7 text-white fill-white/40" />
            </div>
            {streak >= 7 && (
              <span className="absolute -top-2 -right-2 animate-bounce rounded-full bg-[#EF4444] px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                🔥
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{streakCount}</p>
            <p className="text-xs text-white/70">Ngày streak</p>
          </div>
        </div>

        <div
          ref={(el) => { (xpRef as any).current = el }}
          className="flex items-center gap-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Zap className="h-7 w-7 text-yellow-300" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">+{xpCount}</p>
            <p className="text-xs text-white/70">XP hôm nay</p>
          </div>
        </div>

        <Button
          to="/flashcard"
          size="sm"
          className="gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
        >
          <Zap className="h-4 w-4" />
          Học ngay
        </Button>
      </div>

      <StreakProgressBar streak={streak} className="mt-2" />
    </div>
  )
}

function QuickCard({
  icon: Icon, value, label, color, onClick,
}: {
  icon: typeof Layers; value: string | number; label: string; color: string; onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] w-full flex-1",
        "shadow-[var(--shadow-card)]"
      )}
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rounded-full opacity-15 blur-xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon className="h-7 w-7" style={{ color }} />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
          <p className="text-sm text-[var(--color-text-muted)] font-medium">{label}</p>
        </div>
      </div>
    </button>
  )
}

function DeckRow({ deck }: { deck: any }) {
  const { data: progress } = useQuery({
    queryKey: ['review', 'deck-progress', deck.id],
    queryFn: () => reviewApi.getDeckProgress({ deckRef: deck.slug }).then((r) => r.data),
    staleTime: 60_000,
  })
  const { data: dueData } = useQuery({
    queryKey: ['review', 'due', deck.slug],
    queryFn: () => reviewApi.getDue({ deckRef: deck.slug, limit: 1 }).then((r) => r.data),
    staleTime: 30_000,
  })

  const total = progress?.totalCards ?? deck.cardCount ?? 0
  const learned = progress?.learnedCards ?? 0
  const mastered = progress?.masteredCards ?? 0
  const due = dueData?.dueCount ?? 0
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0

  return (
    <Link
      to={`/decks/${deck.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary-subtle)] hover:bg-[var(--color-surface-hover)]"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface-hover)]">
        {deck.coverImageUrl
          ? <img src={deck.coverImageUrl} alt="" className="h-full w-full object-cover" />
          : <Layers className="mx-auto mt-2.5 h-6 w-6 text-[var(--color-primary)]" />
        }
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
          {deck.title}
        </p>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />{total} thẻ
          </span>
          {due > 0 && (
            <span className="font-semibold text-[#EC4899]">📚 {due} đến hạn</span>
          )}
          {deck.isPublic && <Globe className="h-3 w-3 text-[#10B981]" />}
          {!deck.isPublic && <Lock className="h-3 w-3" />}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-[#3D3348] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#10B981] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#8B7A9E] w-8 text-right">{pct}%</span>
        </div>
        <p className="mt-0.5 text-[10px] text-[#8B7A9E]">
          {mastered} thành thạo
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-[#8B7A9E] transition-transform group-hover:translate-x-1 group-hover:text-[#EC4899]" />
    </Link>
  )
}

function FlashcardSessionBanner({
  deckRef, session, onDismiss,
}: {
  deckRef: string
  session: StudySession
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const stats = session.progress.stats
  const total = session.sessionCardIds.length
  const answered = stats.again + stats.hard + stats.good + stats.easy

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#EC4899]/40 bg-gradient-to-r from-[#831843]/90 via-[#BE185D]/70 to-[#F97316]/50 p-4 shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#EC4899]/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 shadow">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">📖 Học Flashcard</p>
            </div>
            <p className="text-xs text-white/70">
              {answered}/{total} câu đã làm · {relativeTime(session.savedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Bỏ qua
          </button>
          <Button
            size="sm"
            className="gap-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/30"
            onClick={() => navigate(`/flashcard?deck=${encodeURIComponent(deckRef)}&resume=1`)}
          >
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

function QuizSessionBanner({
  attemptId: _attemptId,
  quizSlug,
  quizTitle,
  timeRemaining: _timeRemaining,
  onDismiss,
}: {
  attemptId: string
  quizSlug: string | null
  quizTitle: string
  timeRemaining: number | null
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const [displaySeconds, setDisplaySeconds] = useState(_timeRemaining ?? null)

  useEffect(() => {
    if (_timeRemaining !== null) {
      setDisplaySeconds(_timeRemaining)
    }
  }, [_timeRemaining])

  useEffect(() => {
    if (displaySeconds === null || displaySeconds <= 0) return
    const id = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev === null || prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const m = displaySeconds !== null ? Math.floor(displaySeconds / 60) : null
  const s = displaySeconds !== null ? displaySeconds % 60 : null
  const resumeRef = quizSlug ?? _attemptId

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F97316]/40 bg-gradient-to-r from-[#7C2D12]/90 via-[#C2410C]/70 to-[#F97316]/50 p-4 shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#F97316]/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 shadow">
              <AlertTriangle className="h-3 w-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">🎯 Đang làm Quiz</p>
              {displaySeconds !== null && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                  {m}:{s != null ? s.toString().padStart(2, '0') : '00'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 line-clamp-1">{quizTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Bỏ qua
          </button>
          <Button
            size="sm"
            className="gap-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/30"
            onClick={() => navigate(`/quiz/play/${resumeRef}`)}
          >
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}

function LibrarySection({
  decks,
  totalDecks,
  loading,
  onCreateOpen,
  onImportOpen,
  sectionRef,
}: {
  decks: ReturnType<typeof useMemo<any[]>>
  totalDecks: number
  loading: boolean
  onCreateOpen: () => void
  onImportOpen: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}) {
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = [...decks]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (d) => d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
      )
    }
    if (visibility === 'PUBLIC') list = list.filter((d) => d.isPublic)
    if (visibility === 'PRIVATE') list = list.filter((d) => !d.isPublic)
    list.sort((a, b) => {
      switch (sort) {
        case 'az': return a.title.localeCompare(b.title, 'vi')
        case 'za': return b.title.localeCompare(a.title, 'vi')
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
    return list
  }, [decks, query, visibility, sort])

  return (
    <div ref={sectionRef} className="space-y-5 scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">Thư viện Deck</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            <span className="font-bold text-[var(--color-primary)]">{totalDecks}</span> deck ·{' '}
            {totalDecks === 0 ? 'Bắt đầu tạo deck đầu tiên' : 'Quản lý bộ từ của bạn'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                  viewMode === mode
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
                )}
              >
                {mode === 'grid' ? <Layers className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Button variant="outline" size="md" onClick={() => navigate('/explore')}>
            <Compass className="h-4 w-4" />
            Khám phá
          </Button>
          <Button variant="outline" size="md" onClick={onImportOpen}>
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button size="md" onClick={onCreateOpen}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Tạo deck
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm deck..."
            className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] shadow-[var(--shadow-card)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="h-10 cursor-pointer appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-8 text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
        <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-1">
          {([
            { id: 'ALL' as const, label: 'Tất cả' },
            { id: 'PUBLIC' as const, label: 'Công khai' },
            { id: 'PRIVATE' as const, label: 'Riêng tư' },
          ] as const).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setVisibility(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                visibility === f.id
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' : 'space-y-3'}>
          {Array.from({ length: 8 }).map((_, i) => <DeckGridSkeleton key={i} />)}
        </div>
      )}

      {!loading && totalDecks === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-hover)]/40 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] shadow-[var(--shadow-primary)]">
            <Sparkles className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">Thư viện trống</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
            Tạo deck đầu tiên hoặc khám phá kho deck công khai từ cộng đồng.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={onCreateOpen}><Sparkles className="h-4 w-4" />Tạo deck</Button>
            <Button variant="outline" onClick={() => navigate('/explore')}>Khám phá</Button>
          </div>
        </div>
      )}

      {!loading && totalDecks > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-hover)]/40 p-8 text-center">
          <p className="text-sm font-semibold text-[var(--color-text)]">Không có deck phù hợp</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setVisibility('ALL') }}
            className="mt-2 text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-sm text-[var(--color-text-muted)]">
            Hiển thị <span className="font-bold text-[var(--color-text)]">{filtered.length}</span> /{' '}
            <span className="font-bold text-[var(--color-primary)]">{totalDecks}</span> deck
          </p>
          <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' : 'space-y-2'}>
            {filtered.map((deck) => (
              <DeckCard key={deck.id} deck={deck} variant="library" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const librarySectionRef = useRef<HTMLDivElement | null>(null)
  const setLibrarySectionRef = useCallback((el: HTMLDivElement | null) => {
    librarySectionRef.current = el
  }, [])

  // Active flashcard session (localStorage)
  const [activeFlashcardSession, setActiveFlashcardSession] = useState<{ deckRef: string; session: StudySession } | null>(null)
  // Active quiz sessions (from API)
  const [activeQuizSession, setActiveQuizSession] = useState<{
    attemptId: string; quizId: string; quizSlug: string | null
    quizTitle: string; timeRemaining: number | null
  } | null>(null)

  useEffect(() => {
    setActiveFlashcardSession(findAnyActiveSession())
  }, [])

  // Fetch active quiz sessions from API
  const qc = useQueryClient()
  const { data: activeQuizSessions } = useQuery({
    queryKey: ['quiz', 'active-sessions'],
    queryFn: () => quizApi.getActiveSessions().then((r) => r.data),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  const quizBannerDismissedRef = useRef(false)

  useEffect(() => {
    if (quizBannerDismissedRef.current) return
    if (activeQuizSessions && activeQuizSessions.length > 0) {
      const s = activeQuizSessions[0]
      setActiveQuizSession({
        attemptId: s.attemptId,
        quizId: s.quizId ?? '',
        quizSlug: s.quizSlug ?? null,
        quizTitle: s.quizTitle ?? 'Quiz',
        timeRemaining: s.remainingSeconds >= 0 ? s.remainingSeconds : null,
      })
    } else {
      setActiveQuizSession(null)
    }
  }, [activeQuizSessions])

  const handleDismissFlashcardSession = () => {
    if (activeFlashcardSession) {
      clearSession(activeFlashcardSession.deckRef, 'FLASHCARD')
      setActiveFlashcardSession(null)
    }
  }

  const handleDismissQuizSession = useCallback(async () => {
    if (!activeQuizSession?.attemptId) {
      setActiveQuizSession(null)
      return
    }

    try {
      await quizApi.quitSession(activeQuizSession.attemptId)
    } catch (err) {
      console.error(err)
    } finally {
      quizBannerDismissedRef.current = true
      setActiveQuizSession(null)
      qc.invalidateQueries({ queryKey: ['quiz', 'active-sessions'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'attempts'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'me'] })
      qc.invalidateQueries({ queryKey: ['progress', 'me'] })
      qc.invalidateQueries({ queryKey: ['stats', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['stats', 'activity'] })
    }
  }, [activeQuizSession, qc])

  // Open create dialog from ?create=1
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // My decks
  const { data, isLoading } = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 50 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 50 }).then((r) => r.data),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Public decks for suggestions
  const { data: publicData } = useQuery({
    queryKey: ['decks', { public: true, page: 0, size: 8 }],
    queryFn: () => decksApi.list({ mine: false, page: 0, size: 8 }).then((r) => r.data),
  })

  // Stats data
  const { data: dashboardStats } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => statsApi.getDashboard().then((r) => r.data),
  })

  // Real progress data (for rank)
  const { data: progressData } = useQuery({
    queryKey: ['progress', 'me'],
    queryFn: () => progressApi.getMyProgress().then((r) => r.data),
    staleTime: 60_000,
  })

  const myDecks = data?.content ?? []
  const totalDecks = data?.totalElements ?? 0
  const suggestedDecks = publicData?.content ?? []

  const recentDecks = useMemo(
    () => [...myDecks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [myDecks],
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 space-y-10">
        {/* ── Streak banner ── */}
        <StreakBanner
          streak={progressData?.streak ?? dashboardStats?.streak ?? user?.streak ?? 0}
          xpToday={dashboardStats?.xpToday ?? 0}
        />

        {/* ── Active sessions ── */}
        {(activeFlashcardSession || activeQuizSession) && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-yellow-400">Phiên đang dang dở</h2>
            </div>
            <div className="space-y-2">
              {activeFlashcardSession && (
                <FlashcardSessionBanner
                  deckRef={activeFlashcardSession.deckRef}
                  session={activeFlashcardSession.session}
                  onDismiss={handleDismissFlashcardSession}
                />
              )}
              {activeQuizSession && (
                <QuizSessionBanner
                  attemptId={activeQuizSession.attemptId}
                  quizSlug={activeQuizSession.quizSlug}
                  quizTitle={activeQuizSession.quizTitle}
                  timeRemaining={activeQuizSession.timeRemaining}
                  onDismiss={handleDismissQuizSession}
                />
              )}
            </div>
          </section>
        )}

        {/* ── Quick stats ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <QuickCard icon={Layers} value={dashboardStats?.cardsToday ?? 0} label="Card học trong ngày" color="var(--color-success)" />
          <QuickCard icon={Sparkles} value={`${dashboardStats?.quizzesToday ?? 0}`} label="Quiz đã làm trong ngày" color="var(--color-primary)" />
        </div>



        {/* ── Library management ── */}
        <LibrarySection
          decks={myDecks}
          totalDecks={totalDecks}
          loading={isLoading}
          onCreateOpen={() => setCreateOpen(true)}
          onImportOpen={() => setImportOpen(true)}
          sectionRef={setLibrarySectionRef}
        />

        {/* ── Recent decks with real progress ── */}
        {!isLoading && recentDecks.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                📋 Deck gần đây
              </h2>
            </div>
            <div className="space-y-2">
              {recentDecks.slice(0, 6).map((deck) => (
                <DeckRow key={deck.id} deck={deck} />
              ))}
            </div>
            {recentDecks.length > 6 && (
              <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
                +{recentDecks.length - 6} deck khác
              </p>
            )}
          </section>
        )}

        {/* ── Suggested decks ── */}
        {!isLoading && suggestedDecks.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                ✨ Gợi ý từ cộng đồng
              </h2>
              <Link
                to="/explore"
                className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] flex items-center gap-1 transition-colors"
              >
                Khám phá <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {suggestedDecks.slice(0, 8).map((deck) => (
                <DeckCard key={deck.id} deck={deck} variant="explore" />
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateDeckDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(slug) => navigate(`/decks/${slug}`)}
      />
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(slug) => navigate(`/decks/${slug}`)}
      />
    </div>
  )
}
