import type { Topic } from '@/types/deck'
import { cn } from '@/utils/cn'

interface TopicFilterProps {
  topics: Topic[]
  selectedSlug: string | null
  onChange: (slug: string | null) => void
}

export default function TopicFilter({ topics, selectedSlug, onChange }: TopicFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={chipClass(!selectedSlug, '#EC4899')}
      >
        Tất cả
      </button>
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onChange(topic.slug === selectedSlug ? null : topic.slug)}
          className={chipClass(selectedSlug === topic.slug, topic.colorHex ?? '#A78BFA')}
          style={
            selectedSlug === topic.slug
              ? {
                  borderColor: `${topic.colorHex ?? '#A78BFA'}50`,
                  color: topic.colorHex ?? '#A78BFA',
                }
              : undefined
          }
        >
          {topic.icon && <span className="mr-1">{topic.icon}</span>}
          {topic.name}
        </button>
      ))}
    </div>
  )
}

function chipClass(active: boolean, _color: string) {
  return cn(
    'rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150',
    active
      ? 'border-current bg-[currentColor]/10 text-[currentColor]'
      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]',
  )
}
