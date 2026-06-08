import { BookOpen } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-[var(--color-primary)]" strokeWidth={2.25} />
          <span className="text-2xl font-bold text-[var(--color-text)]">Lumotus</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight text-[var(--color-text)]">
            Học từ vựng thông minh với SRS
          </h1>
          <p className="mt-4 max-w-md text-[var(--color-text-secondary)]">
            Ôn tập đúng lúc, theo dõi tiến độ và leo bảng xếp hạng cùng cộng đồng.
          </p>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">© Lumotus</p>
      </aside>

      <main className="flex w-full flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <BookOpen className="h-7 w-7 text-[var(--color-primary)]" />
          <span className="text-xl font-bold text-[var(--color-text)]">Lumotus</span>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
