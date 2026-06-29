import { Shuffle, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { StudyMode } from '@/types/study'
import type { StudyConfig } from '@/utils/studySession'

interface ModeSettingsProps {
  mode: StudyMode
  config: StudyConfig
  onChange: (c: StudyConfig) => void
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-all',
        value ? 'bg-[#EC4899]' : 'bg-[#3D3348]',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all',
          value ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

function TimeLimitSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const options = [
    { label: 'No limit', value: 0 },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '20 min', value: 20 },
    { label: '30 min', value: 30 },
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all sm:px-3 sm:text-xs',
            value === opt.value
              ? 'bg-[#3D3348] text-[#F5F0FA]'
              : 'text-[#8B7A9E] hover:text-[#C4B8D9]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ModeSettings({ mode, config, onChange }: ModeSettingsProps) {
  const handle = <K extends keyof StudyConfig>(key: K, value: StudyConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="mt-6 flex w-full flex-col gap-4 rounded-2xl border border-[#3D3348] bg-[#252030] p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#8B7A9E]">Cài đặt chế độ</p>

      {/* Shuffle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F0FA]">
          <Shuffle className="h-4 w-4 text-[#8B7A9E]" />
          Xáo trộn thẻ
        </div>
        <Toggle
          value={config.shuffle}
          onChange={(v) => handle('shuffle', v)}
        />
      </div>

      {/* Direction (QUIZ/LEARN only) */}
      {(mode === 'QUIZ' || mode === 'LEARN') && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#F5F0FA]">Hướng câu hỏi</span>
          <div className="flex gap-1">
            {(['forward', 'reverse'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handle('direction', d)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  config.direction === d
                    ? 'bg-[#3D3348] text-[#F5F0FA]'
                    : 'text-[#8B7A9E] hover:text-[#C4B8D9]',
                )}
              >
                {d === 'forward' ? '📖 Trước → Sau' : '🔄 Sau → Trước'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-semibold text-[#F5F0FA]">
          <span>Số câu hỏi</span>
          <span className="font-extrabold text-[#EC4899]">{config.count}</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={config.count}
            onChange={(e) => handle('count', Number(e.target.value))}
            className="study-range flex-1"
          />
        </div>
      </div>

      {/* Time Limit (QUIZ/LEARN/SPELL) */}
      {(mode === 'QUIZ' || mode === 'LEARN' || mode === 'SPELL') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F0FA]">
            <Clock className="h-4 w-4 text-[#8B7A9E]" />
            Thời gian làm bài
          </div>
          <TimeLimitSelect
            value={config.timeLimit}
            onChange={(v) => handle('timeLimit', v)}
          />
        </div>
      )}

      {/* TTL (FLASHCARD only) */}
      {mode === 'FLASHCARD' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F0FA]">
            <Clock className="h-4 w-4 text-[#8B7A9E]" />
            Lưu tiến trình (60 phút)
          </div>
          <Toggle
            value={config.ttlHours > 0}
            onChange={(v) => handle('ttlHours', v ? 1 : 0)}
          />
        </div>
      )}
    </div>
  )
}
