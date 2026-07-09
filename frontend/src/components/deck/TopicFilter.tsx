import { useState } from 'react'
import type { Topic } from '@/types/deck'
import { cn } from '@/utils/cn'

interface TopicFilterProps {
  topics: Topic[]
  selectedSlug: string | null
  onChange: (slug: string | null) => void
}

export default function TopicFilter({ topics, selectedSlug, onChange }: TopicFilterProps) {
  const [search, setSearch] = useState('')

  const filtered = topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm chủ đề..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-8 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#EC4899] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {/* Topic list */}
      <div className="flex flex-wrap gap-1.5">
        {/* Clear all */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={chipClass(!selectedSlug, '#EC4899')}
        >
          Tất cả
        </button>
        {filtered.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onChange(selectedSlug === topic.slug ? null : topic.slug)}
            className={chipClass(selectedSlug === topic.slug, topic.colorHex ?? '#A78BFA')}
            style={
              selectedSlug === topic.slug
                ? { borderColor: `${topic.colorHex ?? '#A78BFA'}50`, color: topic.colorHex ?? '#A78BFA' }
                : undefined
            }
          >
            {topic.icon && <span className="mr-1">{topic.icon}</span>}
            {topic.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">Không tìm thấy chủ đề</p>
        )}
      </div>
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
