export default function DeckGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className="mb-3 h-28 rounded-lg bg-[var(--color-bg)]" />
          <div className="h-4 w-2/3 rounded bg-[var(--color-bg)]" />
          <div className="mt-2 h-3 w-full rounded bg-[var(--color-bg)]" />
        </div>
      ))}
    </div>
  )
}
