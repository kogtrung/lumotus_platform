import { Layers, FileText, Pencil, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/types/study'
import { cn } from '@/utils/cn'

const MODES: { value: StudyMode; label: string; icon: typeof Layers }[] = [
  { value: 'FLASHCARD', label: 'Flashcard', icon: Layers },
  { value: 'QUIZ', label: 'Quiz', icon: FileText },
  { value: 'LEARN', label: 'Học', icon: Pencil },
  { value: 'SPELL', label: 'Nghe', icon: Volume2 },
]

interface ModeTabProps {
  value: StudyMode
  onChange: (mode: StudyMode) => void
}

export default function ModeTab({ value, onChange }: ModeTabProps) {
  return (
    <div className="flex gap-1 rounded-2xl border border-[#3D3348] bg-[#1A1520] p-1">
      {MODES.map(({ value: mv, label, icon: Icon }) => (
        <button
          key={mv}
          type="button"
          onClick={() => onChange(mv)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all',
            mv === value
              ? 'study-mode-tab--active bg-gradient-to-r from-[#EC4899] to-[#F97316] text-white shadow-sm'
              : 'text-[#8B7A9E] hover:text-[#C4B8D9]',
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
