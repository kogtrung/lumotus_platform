import type { Topic } from '@/types/deck'
import { cn } from '@/utils/cn'

interface TopicFilterProps {
  topics: Topic[]
  selectedSlug: string | null
  onChange: (slug: string | null) => void
}

export default function TopicFilter({ topics, selectedSlug, onChange }: TopicFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={chipClass(!selectedSlug)}
      >
        Tất cả
      </button>
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onChange(topic.slug === selectedSlug ? null : topic.slug)}
          className={chipClass(selectedSlug === topic.slug)}
          style={
            selectedSlug === topic.slug && topic.colorHex
              ? { borderColor: topic.colorHex, color: topic.colorHex }
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

function chipClass(active: boolean) {
  return cn(
    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
  )
}
