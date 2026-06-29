import { relativeTime } from '@/utils/studySession'
import Button from '@/components/ui/Button'
import type { StudySession } from '@/utils/studySession'
import { X } from 'lucide-react'

const MODE_LABELS: Record<string, string> = {
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
  LEARN: 'Learn',
  SPELL: 'Spell',
}
const MODE_ICONS: Record<string, string> = {
  FLASHCARD: '🃏',
  QUIZ: '📝',
  LEARN: '✏️',
  SPELL: '🔊',
}

interface ResumeDialogProps {
  session: StudySession
  onResume: () => void
  onDiscard: () => void
}

export function ResumeDialog({ session, onResume, onDiscard }: ResumeDialogProps) {
  const modeLabel = MODE_LABELS[session.mode]
  const progress = session.mode === 'FLASHCARD' ? session.progress.flashcard : null
  const current = progress ? (progress.currentIndex + 1) : '?'
  const total = session.sessionCardIds.length > 0 ? session.sessionCardIds.length : session.config.count

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: '#1A1520' }}>
      <div className="w-full max-w-sm rounded-3xl border border-[#3D3348] bg-[#252030] p-6 text-center shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onDiscard}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#8B7A9E] hover:bg-[#3D3348] hover:text-[#F5F0FA]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(236,72,153,0.2)] to-[rgba(249,115,22,0.2)]">
          <span className="text-2xl">{MODE_ICONS[session.mode]}</span>
        </div>
        <h2 className="text-xl font-extrabold text-[#F5F0FA]">Tiếp tục {modeLabel}?</h2>
        <p className="mt-2 text-sm text-[#8B7A9E]">
          Đang dở từ {relativeTime(session.savedAt)} · {current}/{total} thẻ
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={onDiscard} variant="outline" className="flex-1">
            Bắt đầu mới
          </Button>
          <Button onClick={onResume} className="flex-1">
            Tiếp tục
          </Button>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          className="mt-3 w-full text-center text-xs text-[#8B7A9E] hover:text-[#C4B8D9]"
        >
          Đóng, chưa muốn chọn
        </button>
      </div>
    </div>
  )
}
