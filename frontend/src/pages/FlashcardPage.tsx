import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronRight, Compass, Play, Search, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { decksApi } from '@/api/decks'
import { reviewApi } from '@/api/review'
import { useAuthStore } from '@/store/authStore'
import DeckProgressBar from '@/components/flashcard/DeckProgressBar'
import { cn } from '@/utils/cn'
import type { DeckSummary } from '@/types/deck'

type Tab = 'personal' | 'explore'

export default function FlashcardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('personal')
  const [searchInput, setSearchInput] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState<DeckSummary | null>(null)

  const { data: personalData, isLoading: loadingPersonal } = useQuery({
    queryKey: ['decks', { mine: true, page: 0, size: 100 }],
    queryFn: () => decksApi.list({ mine: true, page: 0, size: 100 }).then((r) => r.data),
  })

  const { data: exploreData, isLoading: loadingExplore } = useQuery({
    queryKey: ['decks', { mine: false, page: 0, size: 100 }],
    queryFn: () => decksApi.list({ mine: false, page: 0, size: 100 }).then((r) => r.data),
  })

  const personalDecks = useMemo(() => personalData?.content ?? [], [personalData])
  const exploreDecks = useMemo(() => exploreData?.content ?? [], [exploreData])

  const availableTopics = useMemo(() => {
    const map = new Map<string, any>()
    exploreDecks.forEach((d) => d.topics?.forEach((t) => map.set(t.id, t)))
    return Array.from(map.values())
  }, [exploreDecks])

  const progressQuery = useQuery({
    queryKey: ['review', 'deck-progress', selectedDeck?.id],
    queryFn: async () => {
      if (!selectedDeck?.id) return null
      try {
        return (await reviewApi.getDeckProgress({ deckId: selectedDeck.id })).data
      } catch {
        return { deckId: selectedDeck.id, totalCards: selectedDeck.cardCount, learnedCards: 0, masteredCards: 0 }
      }
    },
    enabled: !!selectedDeck?.id,
  })

  const decks = tab === 'personal' ? personalDecks : exploreDecks
  const isLoading = tab === 'personal' ? loadingPersonal : loadingExplore

  const filteredDecks = useMemo(() => {
    let result = decks.filter((deck) => {
      const searchLower = searchInput.toLowerCase()
      const matchSearch = deck.title.toLowerCase().includes(searchLower) || deck.topics?.some(t => t.name.toLowerCase().includes(searchLower))
      const matchTopic = (tab === 'explore' && selectedTopicId) ? deck.topics?.some(t => t.id === selectedTopicId) : true
      return matchSearch && matchTopic
    })
    
    if (tab === 'explore') {
      if (sortAsc) {
        result = [...result].sort((a, b) => a.title.localeCompare(b.title))
      } else {
        result = [...result].sort((a, b) => {
          const popA = (a.viewCount ?? 0) + (a.copyCount ?? 0)
          const popB = (b.viewCount ?? 0) + (b.copyCount ?? 0)
          return popB - popA
        })
      }
    }
    return result
  }, [decks, searchInput, tab, selectedTopicId, sortAsc])

  const progress = progressQuery.data
  const total = progress?.totalCards ?? selectedDeck?.cardCount ?? 0
  const learned = progress?.learnedCards ?? 0
  const mastered = progress?.masteredCards ?? 0

  return (
    <div className="min-h-screen space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-subtle)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
            Flashcard
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text)]">Học Flashcard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Chọn deck để bắt đầu ôn tập với SRS thông minh
          </p>
        </div>

        {/* Tips */}
        <div className="hidden sm:block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 md:max-w-sm shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-1">
            <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
            Mẹo học hiệu quả
          </div>
          <ul className="space-y-0.5 text-[11px] text-[var(--color-text-muted)] leading-tight">
            <li className="flex items-start gap-1.5"><span className="text-[var(--color-primary)] shrink-0">•</span>Học đều đặn mỗi ngày để não ghi nhớ tốt hơn</li>
            <li className="flex items-start gap-1.5"><span className="text-[var(--color-primary)] shrink-0">•</span>"Again" cho thẻ chưa nhớ, "Good/Easy" thẻ đã thuộc</li>
            <li className="flex items-start gap-1.5"><span className="text-[var(--color-primary)] shrink-0">•</span>Mastered = thẻ đạt mức 21+ ngày (Thành thạo)</li>
          </ul>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-6 xl:grid-cols-5">
        {/* Deck list */}
        <div className="lg:col-span-4 xl:col-span-4 min-w-0">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)]">
            {/* Tabs */}
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setTab('personal'); setSearchInput(''); setSelectedDeck(null) }}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-all',
                  tab === 'personal'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
                )}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Của bạn ({personalDecks.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('explore'); setSearchInput(''); setSelectedDeck(null) }}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-all',
                  tab === 'explore'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
                )}
              >
                <span className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  Khám phá ({exploreDecks.length})
                </span>
              </button>
            </div>

            {/* Filters Row */}
            <div className="mb-5 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px] group">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm deck hoặc topic..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
                />
              </div>
              
              {tab === 'explore' && (
                <>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
                  >
                    <option value="">Tất cả chủ đề</option>
                    {availableTopics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortAsc(!sortAsc)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors", 
                      sortAsc ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-subtle)]"
                    )}
                  >
                    A-Z
                  </button>
                </>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                    <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-border)]" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && filteredDecks.length === 0 && (
              <div className="py-16 text-center animate-fade-in border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]">
                <BookOpen className="mx-auto h-12 w-12 text-[var(--color-text-muted)] opacity-50" />
                <p className="mt-3 font-semibold text-[var(--color-text)]">
                  {searchInput ? 'Không tìm thấy deck' : tab === 'personal' ? 'Chưa có deck nào' : 'Chưa có deck công khai'}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {searchInput ? 'Thử từ khóa khác' : tab === 'personal' ? 'Tạo deck đầu tiên để bắt đầu' : 'Hãy khám phá thêm deck từ cộng đồng'}
                </p>
              </div>
            )}

            {/* Deck list */}
            {!isLoading && filteredDecks.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filteredDecks.map((deck) => (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => setSelectedDeck(deck)}
                    className={cn(
                      'group relative rounded-xl border p-3 text-left transition-all duration-200 min-w-0',
                      selectedDeck?.id === deck.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/50 shadow-md transform scale-[1.01]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary-subtle)] hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1.5 w-full overflow-hidden">
                      <div className="min-w-0 flex-1 w-full overflow-hidden">
                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="truncate font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors pr-1">
                              {deck.title}
                            </h3>
                            <span className="shrink-0 rounded bg-[var(--color-primary)]/10 px-1 py-0.5 text-[9px] font-bold text-[var(--color-primary)] whitespace-nowrap">
                              {deck.cardCount} thẻ
                            </span>
                            {tab === 'personal' && deck.sourceType === 'CLONE' && (
                              <span className="shrink-0 rounded bg-[var(--color-text-muted)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-text-muted)] whitespace-nowrap">
                                Clone
                              </span>
                            )}
                          </div>
                          {tab === 'explore' && user?.id && deck.ownerId === user.id && (
                            <span className="shrink-0 rounded bg-[var(--color-warning-subtle)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-warning)]">
                              Của bạn
                            </span>
                          )}
                        </div>
                        
                        {deck.topics && deck.topics.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {deck.topics.slice(0, 3).map((topic) => (
                              <span
                                key={topic.id}
                                className="rounded px-1.5 py-0.5 text-[9px] font-medium tracking-wide truncate max-w-[80px]"
                                style={{
                                  backgroundColor: topic.colorHex ? `color-mix(in srgb, ${topic.colorHex} 15%, transparent)` : 'var(--color-secondary-subtle)',
                                  color: topic.colorHex ?? 'var(--color-secondary)',
                                }}
                              >
                                {topic.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-300 translate-y-0.5",
                        selectedDeck?.id === deck.id ? "text-[var(--color-primary)] translate-x-0.5" : "text-[var(--color-text-muted)] group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected deck preview */}
        <div className="lg:col-span-2 xl:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
            {selectedDeck ? (
              <div className="animate-fade-in">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">Deck đã chọn</h2>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 mt-2 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-extrabold text-[var(--color-text)]">{selectedDeck.title}</h3>
                    {tab === 'explore' && user?.id && selectedDeck.ownerId === user.id && (
                      <span className="rounded-full bg-[var(--color-warning-subtle)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-warning)]">
                        Của bạn
                      </span>
                    )}
                  </div>
                  {selectedDeck.description && (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{selectedDeck.description}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-[var(--color-primary)]">{total}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">Thẻ</p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-[var(--color-success)]">{learned}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">Đã học</p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-[var(--color-accent)]">{mastered}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">Thạo</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <DeckProgressBar
                      mastered={mastered}
                      total={total}
                      size="md"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/decks/${selectedDeck.slug}/flashcard`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-3 font-bold text-white transition-all hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98]"
                  >
                    <Play className="h-5 w-5" />
                    Bắt đầu học
                  </button>
                  <Link
                    to={`/decks/${selectedDeck.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
                  >
                    Xem chi tiết deck
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] mt-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                  <Zap className="h-8 w-8 text-[var(--color-primary)]" />
                </div>
                <p className="font-semibold text-[var(--color-text)]">Chọn một deck</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Nhấn vào deck để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
