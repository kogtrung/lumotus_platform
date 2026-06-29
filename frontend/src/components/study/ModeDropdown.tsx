import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { StudyMode } from '@/types/study'

const MODE_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
  LEARN: 'Learn',
  SPELL: 'Spell',
}
const MODE_ICONS: Record<StudyMode, string> = {
  FLASHCARD: '🃏',
  QUIZ: '📝',
  LEARN: '✏️',
  SPELL: '🔊',
}

interface ModeDropdownProps {
  mode: StudyMode
  onChange: (m: StudyMode) => void
  disabled?: boolean
}

export function ModeDropdown({ mode, onChange, disabled = false }: ModeDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
          disabled
            ? 'cursor-not-allowed border-[#3D3348] bg-[#1D1A24] text-[#5A5068]'
            : 'border-[#3D3348] bg-[#252030] text-[#F5F0FA] hover:border-[#EC4899]',
        )}
      >
        <span>{MODE_ICONS[mode]}</span>
        <span>{MODE_LABELS[mode]}</span>
        {!disabled && <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && !disabled && (
        <div className="review-menu absolute left-1/2 top-14 z-50 w-52 -translate-x-1/2 rounded-2xl border border-[#3D3348] bg-[#252030] p-2 shadow-2xl">
          {(Object.keys(MODE_LABELS) as StudyMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { onChange(m); setOpen(false) }}
              className={cn(
                'review-menu-item w-full',
                mode === m && 'review-menu-item--active',
              )}
            >
              <span className="text-base">{MODE_ICONS[m]}</span>
              <span>{MODE_LABELS[m]}</span>
              {mode === m && <span className="ml-auto text-[10px] font-bold text-[#EC4899]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
