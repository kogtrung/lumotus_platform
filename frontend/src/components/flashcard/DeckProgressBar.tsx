import { cn } from '@/utils/cn'

interface DeckProgressBarProps {
  mastered: number
  total: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function DeckProgressBar({
  mastered,
  total,
  className,
  showLabel = true,
  size = 'md',
}: DeckProgressBarProps) {
  const progress = total > 0 ? mastered / total : 0
  const percentage = Math.round(progress * 100)

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className={cn('font-semibold text-[#F5F0FA]', textSizes[size])}>
            {mastered}/{total}
          </span>
          <span className={cn('font-bold text-[#10B981]', textSizes[size])}>
            {percentage}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-[#3D3348]',
          heights[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            heights[size],
          )}
          style={{
            width: `${progress * 100}%`,
            background:
              progress >= 1
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : 'linear-gradient(90deg, #EC4899, #F97316)',
            boxShadow:
              progress >= 1
                ? '0 0 8px rgba(16, 185, 129, 0.4)'
                : '0 0 8px rgba(236, 72, 153, 0.4)',
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-xs text-[#8B7A9E]">Đã master</span>
          <div className="flex items-center gap-1">
            {progress >= 1 ? (
              <svg
                className="h-3.5 w-3.5 text-[#10B981]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5 text-[#EC4899]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
