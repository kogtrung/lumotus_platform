/**
 * StudyConfigView — Màn hình cấu hình học tập cho từng mode.
 * KHÔNG có ModeTab — user chọn mode từ header (ModeDropdown).
 */

import { Layers, FileText, Pencil, Volume2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ModeSettings } from './ModeSettings'
import type { StudyMode } from '@/types/study'
import type { StudyConfig } from '@/utils/studySession'

interface StudyConfigViewProps {
  deckTitle: string
  cardCount: number
  mode: StudyMode
  config: StudyConfig
  dueFetching: boolean
  startPending: boolean
  dueError: boolean
  onConfigChange: (c: StudyConfig) => void
  onStartFlashcard: () => void
  onStartStudy: () => void
}

const MODE_ICONS: Record<StudyMode, typeof Layers> = {
  FLASHCARD: Layers,
  QUIZ: FileText,
  LEARN: Pencil,
  SPELL: Volume2,
}

const MODE_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
  LEARN: 'Learn',
  SPELL: 'Spell',
}

const MODE_BUTTON_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Start Review',
  QUIZ: 'Start Quiz',
  LEARN: 'Start Learning',
  SPELL: 'Start Spelling',
}

const MODE_LOADING_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Loading cards...',
  QUIZ: 'Starting...',
  LEARN: 'Starting...',
  SPELL: 'Starting...',
}

export function StudyConfigView({
  deckTitle,
  cardCount,
  mode,
  config,
  dueFetching,
  startPending,
  dueError,
  onConfigChange,
  onStartFlashcard,
  onStartStudy,
}: StudyConfigViewProps) {
  const Icon = MODE_ICONS[mode]
  const modeLabel = MODE_LABELS[mode]
  const buttonLabel = MODE_BUTTON_LABELS[mode]
  const loadingLabel = MODE_LOADING_LABELS[mode]
  const isPending = mode === 'FLASHCARD' ? dueFetching : startPending

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
      {/* Mode icon + title */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[rgba(236,72,153,0.2)] to-[rgba(249,115,22,0.2)] shadow-lg">
          <Icon className="h-8 w-8 text-[#EC4899]" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F0FA]">{deckTitle}</h1>
          <p className="mt-1 text-sm text-[#8B7A9E]">
            {modeLabel} · {cardCount} thẻ
          </p>
        </div>
      </div>

      {/* Settings (shuffle, count, direction, starredOnly) */}
      <ModeSettings mode={mode} config={config} onChange={onConfigChange} />

      {/* Error */}
      {mode === 'FLASHCARD' && dueError && (
        <p className="text-sm text-[#EF4444]">Không tải được thẻ — kiểm tra kết nối.</p>
      )}

      {/* Start button for all modes */}
      <Button
        onClick={mode === 'FLASHCARD' ? onStartFlashcard : onStartStudy}
        disabled={isPending}
        className="w-full max-w-xs"
        size="lg"
      >
        {isPending ? loadingLabel : buttonLabel}
      </Button>
    </div>
  )
}
