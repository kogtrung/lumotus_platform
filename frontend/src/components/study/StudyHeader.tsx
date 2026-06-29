import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { ModeDropdown } from './ModeDropdown'
import type { StudyMode } from '@/types/study'

interface StudyHeaderProps {
  deckRef: string
  deckTitle: string
  mode: StudyMode
  onModeChange: (m: StudyMode) => void
  currentIndex: number
  totalCards: number
  showProgress: boolean
  progress: number
  /** Disable mode switch during active session */
  canChangeMode?: boolean
}

export function StudyHeader({
  deckRef,
  deckTitle,
  mode,
  onModeChange,
  currentIndex,
  totalCards,
  showProgress,
  progress,
  canChangeMode = true,
}: StudyHeaderProps) {
  return (
    <header className="shrink-0">
      {showProgress && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#3D3348]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#F97316] transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: back + deck title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to={`/decks/${deckRef}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] text-[#8B7A9E] transition-all hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <span className="truncate text-sm font-bold text-[#F5F0FA]">{deckTitle}</span>
        </div>

        {/* Center: mode dropdown */}
        <div className="hidden sm:block">
          <ModeDropdown mode={mode} onChange={onModeChange} disabled={!canChangeMode} />
        </div>

        {/* Right: index */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {showProgress && (
            <span className="text-sm font-semibold text-[#8B7A9E]">
              <span className="font-bold text-[#F5F0FA]">{currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span className="font-bold text-[#F5F0FA]">{totalCards}</span>
            </span>
          )}
        </div>
      </div>

      {/* Mobile mode dropdown */}
      <div className="sm:hidden px-4 pb-3">
        <ModeDropdown mode={mode} onChange={onModeChange} disabled={!canChangeMode} />
      </div>
    </header>
  )
}
