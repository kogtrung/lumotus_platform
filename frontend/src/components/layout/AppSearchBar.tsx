import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchInputClass } from '@/components/ui/inputClass'

export default function AppSearchBar({ className }: { className?: string }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/explore?q=${encodeURIComponent(term)}` : '/explore')
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          strokeWidth={2}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm deck công khai..."
          className={searchInputClass()}
          aria-label="Tìm kiếm deck"
        />
      </div>
    </form>
  )
}
