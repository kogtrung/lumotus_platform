import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
        Xin chào, {user?.username ?? 'bạn'}
      </h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Smart Flashcard — học từ vựng tiếng Anh với SRS SM-2.
      </p>
      <div className="mt-8 flex gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">XP</p>
          <p className="text-xl font-bold text-[var(--color-text)]">{user?.xp ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">Streak</p>
          <p className="text-xl font-bold text-[var(--color-text)]">{user?.streak ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
