export default function DeckGridSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lumo-card">
      <div className="mb-3 h-12 w-12 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
      <div className="mb-2 h-3 w-2/3 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
      <div className="h-3 w-full rounded bg-[var(--color-surface-elevated)] animate-pulse mb-1" />
      <div className="h-3 w-3/4 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
    </div>
  )
}
