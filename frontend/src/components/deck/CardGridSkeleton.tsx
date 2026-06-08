export default function CardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="lumo-card animate-pulse p-2">
          <div className="h-3 w-3/4 rounded bg-[var(--color-bg)]" />
          <div className="mt-1.5 h-2.5 w-full rounded bg-[var(--color-bg)]" />
          <div className="mt-1 h-2.5 w-2/3 rounded bg-[var(--color-bg)]" />
        </div>
      ))}
    </div>
  )
}
