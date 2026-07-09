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

  const filteredDecks = decks.filter((deck) =>
    deck.title.toLowerCase().includes(searchInput.toLowerCase()),
  )

  const progress = progressQuery.data
  const total = progress?.totalCards ?? selectedDeck?.cardCount ?? 0
  const learned = progress?.learnedCards ?? 0
  const mastered = progress?.masteredCards ?? 0

  return (
    <div className="min-h-screen space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[rgba(236,72,153,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
          Flashcard
        </div>
        <h1 className="text-3xl font-extrabold text-[#F5F0FA]">Học Flashcard</h1>
        <p className="mt-1 text-sm text-[#8B7A9E]">
          Chọn deck để bắt đầu ôn tập với SRS thông minh
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Deck list */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-4 shadow-lg">
            {/* Tabs */}
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setTab('personal'); setSearchInput(''); setSelectedDeck(null) }}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  tab === 'personal'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
                )}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Của bạn ({personalDecks.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('explore'); setSearchInput(''); setSelectedDeck(null) }}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  tab === 'explore'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-[#8B7A9E] hover:bg-[#2D2538] hover:text-[#F5F0FA]',
                )}
              >
                <span className="flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5" />
                  Khám phá ({exploreDecks.length})
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7A9E]" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm deck..."
                className="w-full rounded-xl border border-[#3D3348] bg-[#1A1520] py-2.5 pl-10 pr-4 text-sm text-[#F5F0FA] placeholder-[#8B7A9E] outline-none transition-all focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/20"
              />
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-[#3D3348] bg-[#1A1520] p-4">
                    <div className="h-5 w-3/4 rounded bg-[#3D3348]" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-[#3D3348]" />
                    <div className="mt-4 h-8 w-full rounded bg-[#3D3348]" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && filteredDecks.length === 0 && (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-[#3D3348]" />
                <p className="mt-3 font-semibold text-[#8B7A9E]">
                  {searchInput ? 'Không tìm thấy deck' : tab === 'personal' ? 'Chưa có deck nào' : 'Chưa có deck công khai'}
                </p>
                <p className="mt-1 text-sm text-[#8B7A9E]">
                  {searchInput ? 'Thử từ khóa khác' : tab === 'personal' ? 'Tạo deck đầu tiên để bắt đầu' : 'Hãy khám phá thêm deck từ cộng đồng'}
                </p>
              </div>
            )}

            {/* Deck list */}
            {!isLoading && filteredDecks.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredDecks.map((deck) => (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => setSelectedDeck(deck)}
                    className={cn(
                      'group relative rounded-xl border-2 p-4 text-left transition-all duration-200',
                      selectedDeck?.id === deck.id
                        ? 'border-[#EC4899] bg-[#EC4899]/10 shadow-lg shadow-[#EC4899]/10'
                        : 'border-[#3D3348] bg-[#1A1520] hover:border-[#4A4060]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-bold text-[#F5F0FA] group-hover:text-[#EC4899] transition-colors">
                            {deck.title}
                          </h3>
                          {tab === 'explore' && user?.id && deck.ownerId === user.id && (
                            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                              Của bạn
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#8B7A9E]">
                          <span className="font-semibold text-[#EC4899]">{deck.cardCount} thẻ</span>
                          {tab === 'explore' && deck.isPublic && (
                            <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[#10B981]">
                              Công khai
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#8B7A9E] transition-transform group-hover:translate-x-1 group-hover:text-[#EC4899]" />
                    </div>

                    {deck.topics && deck.topics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {deck.topics.slice(0, 2).map((topic) => (
                          <span
                            key={topic.id}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: topic.colorHex ? `${topic.colorHex}22` : 'rgba(167, 139, 250, 0.15)',
                              color: topic.colorHex ?? '#A78BFA',
                            }}
                          >
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected deck preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-2xl border border-[#3D3348] bg-[#252030]/80 p-5 shadow-lg">
            {selectedDeck ? (
              <>
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#EC4899]">Deck đã chọn</h2>
                <div className="rounded-xl border border-[#3D3348] bg-[#1A1520] p-4 mt-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#F5F0FA]">{selectedDeck.title}</h3>
                    {tab === 'explore' && user?.id && selectedDeck.ownerId === user.id && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                        Của bạn
                      </span>
                    )}
                  </div>
                  {selectedDeck.description && (
                    <p className="mt-1 text-sm text-[#8B7A9E]">{selectedDeck.description}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#252030] p-2 text-center">
                      <p className="text-lg font-extrabold text-[#EC4899]">{total}</p>
                      <p className="text-xs text-[#8B7A9E]">Thẻ</p>
                    </div>
                    <div className="rounded-lg bg-[#252030] p-2 text-center">
                      <p className="text-lg font-extrabold text-[#10B981]">{learned}</p>
                      <p className="text-xs text-[#8B7A9E]">Đã học</p>
                    </div>
                    <div className="rounded-lg bg-[#252030] p-2 text-center">
                      <p className="text-lg font-extrabold text-[#F97316]">{mastered}</p>
                      <p className="text-xs text-[#8B7A9E]">Thành thạo</p>
                    </div>
                  </div>

                  <DeckProgressBar
                    mastered={mastered}
                    total={total}
                    size="md"
                  />
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/decks/${selectedDeck.slug}/flashcard`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#F97316] px-4 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#EC4899]/30 active:scale-[0.98]"
                  >
                    <Play className="h-5 w-5" />
                    Bắt đầu học
                  </button>
                  <Link
                    to={`/decks/${selectedDeck.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#3D3348] px-4 py-3 font-semibold text-[#8B7A9E] transition-colors hover:border-[#EC4899] hover:text-[#EC4899]"
                  >
                    Xem chi tiết deck
                  </Link>
                </div>

                {/* Tips */}
                <div className="mt-4 rounded-xl border border-[#3D3348] bg-[#1A1520] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F0FA]">
                    <TrendingUp className="h-4 w-4 text-[#10B981]" />
                    Mẹo học hiệu quả
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#8B7A9E]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#EC4899] shrink-0">•</span>
                      Học đều đặn mỗi ngày để não ghi nhớ tốt hơn
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#EC4899] shrink-0">•</span>
                      Nhấn "Again" cho thẻ chưa nhớ, "Good" cho thẻ đã thuộc
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#EC4899] shrink-0">•</span>
                      Mastered = đã ôn tập 21+ ngày không quên
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D2538]">
                  <Zap className="h-8 w-8 text-[#EC4899]" />
                </div>
                <p className="font-semibold text-[#8B7A9E]">Chọn một deck</p>
                <p className="mt-1 text-sm text-[#8B7A9E]">
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
