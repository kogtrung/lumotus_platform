import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

interface StudyEmptyStateProps {
  deckRef: string
  onRestart: () => void
  requestedCount?: number
  availableCount?: number
}

export function StudyEmptyState({ deckRef, onRestart, requestedCount, availableCount }: StudyEmptyStateProps) {
  const hasCards = (availableCount ?? 0) > 0
  const showPartialWarning = hasCards && requestedCount !== undefined && availableCount !== undefined && availableCount < requestedCount

  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-6 text-center"
      style={{ background: '#1A1520' }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#10B981]">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-[#F5F0FA]">
          {showPartialWarning
            ? `Chỉ có ${availableCount} thẻ để học!`
            : 'Không có thẻ nào đến hạn!'}
        </h2>
        <p className="mt-2 text-sm text-[#8B7A9E]">
          {showPartialWarning
            ? `Bạn yêu cầu ${requestedCount} thẻ nhưng chỉ có ${availableCount} thẻ sẵn sàng.`
            : 'Hãy thử chế độ khác hoặc quay lại sau.'}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onRestart}>Chọn mode khác</Button>
        <Button to={`/decks/${deckRef}`} variant="outline">Về deck</Button>
      </div>
    </div>
  )
}
