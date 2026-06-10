import { Outlet } from 'react-router-dom'
import LumotusLogo from '@/components/brand/LumotusLogo'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <LumotusLogo to="/" size="lg" />
        <div className="lumo-card max-w-md p-8">
          <h1 className="text-3xl font-bold leading-tight text-[var(--color-text)]">
            Học từ vựng thông minh với SRS
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Ôn tập đúng lúc, theo dõi tiến độ và leo bảng xếp hạng cùng cộng đồng.
          </p>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">© Lumotus</p>
      </aside>

      <main className="flex w-full flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <LumotusLogo to="/" size="md" />
        </div>
        <div className="lumo-modal w-full max-w-md p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
