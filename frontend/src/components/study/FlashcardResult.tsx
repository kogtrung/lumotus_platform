import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

interface FlashcardStats {
  again: number
  hard: number
  good: number
  easy: number
  xp: number
}

interface FlashcardResultProps {
  deckRef: string
  totalCards: number
  stats: FlashcardStats
  onRestart: () => void
}

export function FlashcardResult({ deckRef, totalCards, stats, onRestart }: FlashcardResultProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)] shadow-lg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#10B981]">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-[#F5F0FA]">Hoàn thành!</h2>
        <p className="mt-2 text-sm text-[#8B7A9E]">
          Đã ôn <span className="font-extrabold text-[#F5F0FA]">{totalCards}</span> thẻ
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid w-full grid-cols-4 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] px-3 py-3">
          <span className="text-xl font-extrabold text-[#EF4444]">{stats.again}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">Quên</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.1)] px-3 py-3">
          <span className="text-xl font-extrabold text-[#F59E0B]">{stats.hard}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Khó</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] px-3 py-3">
          <span className="text-xl font-extrabold text-[#10B981]">{stats.good}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Tốt</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.1)] px-3 py-3">
          <span className="text-xl font-extrabold text-[#3B82F6]">{stats.easy}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">Dễ</span>
        </div>
      </div>

      {stats.xp > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-[rgba(236,72,153,0.4)] bg-[rgba(236,72,153,0.1)] px-5 py-2">
          <span className="text-xl">⚡</span>
          <span className="text-xl font-extrabold text-[#EC4899]">+{stats.xp} XP</span>
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <Button onClick={onRestart} size="lg" className="w-full">
          Học tiếp deck này
        </Button>
        <div className="flex gap-2">
          <Button to={`/decks/${deckRef}`} variant="outline" className="flex-1">
            Về deck
          </Button>
          <Button to="/" variant="outline" className="flex-1">
            Trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
