export default function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="lumo-card min-h-[168px] animate-pulse p-4">
          <div className="h-5 w-3/4 rounded bg-[var(--color-bg)]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-bg)]" />
          <div className="my-3 h-px bg-[var(--color-border)]" />
          <div className="h-4 w-full rounded bg-[var(--color-bg)]" />
          <div className="mt-2 h-4 w-2/3 rounded bg-[var(--color-bg)]" />
        </div>
      ))}
    </div>
  )
}
