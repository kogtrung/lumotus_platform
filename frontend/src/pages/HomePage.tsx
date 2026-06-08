export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
        Chào mừng đến Lumotus
      </h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Smart Flashcard — học từ vựng tiếng Anh với SRS SM-2. Sprint 0 đã sẵn sàng shell layout.
      </p>
      <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-sm text-[var(--color-text-muted)]">
          Các màn hình Dashboard, Explore, Review sẽ được triển khai từ Sprint 1 trở đi.
        </p>
      </div>
    </div>
  )
}
