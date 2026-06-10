import {
  ArrowRight,
  Brain,
  Layers,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'
import LumotusLogo from '@/components/brand/LumotusLogo'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const features = [
  {
    icon: Brain,
    title: 'SRS SM-2',
    description: 'Ôn đúng lúc — thuật toán lặp lại ngắt quãng giúp nhớ lâu hơn.',
    color: 'var(--color-primary-subtle)',
    iconColor: 'var(--color-primary)',
  },
  {
    icon: Zap,
    title: 'Quiz & XP',
    description: 'Làm bài trắc nghiệm, tích điểm XP và giữ streak mỗi ngày.',
    color: 'var(--color-accent-warm)',
    iconColor: 'var(--color-warning)',
  },
  {
    icon: Layers,
    title: 'Deck linh hoạt',
    description: 'Tạo bộ thẻ riêng, khám phá deck công khai hoặc copy về thư viện.',
    color: 'var(--color-secondary-subtle)',
    iconColor: 'var(--color-secondary)',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Cạnh tranh lành mạnh với cộng đồng trên bảng xếp hạng.',
    color: '#E8F8F0',
    iconColor: 'var(--color-success)',
  },
] as const

export default function LandingPage() {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-muted)]">
        Đang tải...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="lumo-header sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <LumotusLogo to="/" size="md" />
          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Button to="/home" size="sm">
                Vào ứng dụng
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Đăng nhập
                </Button>
                <Button to="/register" size="sm">
                  Bắt đầu miễn phí
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: 'var(--gradient-hero)' }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--color-secondary)]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="lumo-card mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
              <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
              Học từ vựng thông minh với AI & SRS
            </div>

            <div className="mb-8 flex justify-center">
              <LumotusLogo size="lg" />
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--color-text)] md:text-5xl lg:text-6xl">
              Ghi nhớ từ vựng{' '}
              <span className="text-[var(--color-primary)]">lâu hơn</span>, học{' '}
              <span className="text-[var(--color-primary)]">ít hơn</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-text-secondary)]">
              Lumotus kết hợp flashcard, lịch ôn SM-2, quiz và gamification — giúp bạn học tiếng Anh
              có hệ thống, không áp lực.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {user ? (
                <Button to="/home" size="lg" className="min-w-[200px]">
                  Vào ứng dụng
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button to="/register" size="lg" className="min-w-[200px]">
                    Tạo tài khoản
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button to="/login" variant="outline" size="lg" className="min-w-[200px]">
                    Đã có tài khoản? Đăng nhập
                  </Button>
                </>
              )}
            </div>
            <p className="mt-6 text-sm text-[var(--color-text-muted)]">
              Miễn phí cho học cá nhân · Không cần thẻ tín dụng
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
            Mọi thứ bạn cần để học từ vựng
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            Từ tạo deck đến theo dõi tiến độ — trên một nền tảng gọn nhẹ.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, color, iconColor }) => (
            <div key={title} className="lumo-card lumo-card-hover p-6">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-6 w-6" style={{ color: iconColor }} strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mb-16 md:mx-8">
        <div
          className="mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-xl)] px-6 py-14 text-center md:px-12"
          style={{ background: 'var(--color-primary)' }}
        >
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Sẵn sàng bắt đầu hành trình học từ vựng?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Đăng ký trong vài giây — tạo deck đầu tiên và ôn thẻ ngay hôm nay.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Button
                to="/home"
                size="lg"
                className="min-w-[180px] bg-white text-[var(--color-primary)] hover:bg-white/95 hover:text-[var(--color-primary-hover)]"
              >
                Tiếp tục học
              </Button>
            ) : (
              <>
                <Button
                  to="/register"
                  size="lg"
                  className="min-w-[180px] bg-white text-[var(--color-primary)] hover:bg-white/95 hover:text-[var(--color-primary-hover)]"
                >
                  Đăng ký miễn phí
                </Button>
                <Button
                  to="/login"
                  size="lg"
                  variant="outline"
                  className="min-w-[180px] border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white"
                >
                  Đăng nhập
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="lumo-header border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--color-text-muted)] md:flex-row md:px-8">
          <LumotusLogo to="/" size="sm" />
          <p>© {new Date().getFullYear()} Lumotus — Smart Flashcard English</p>
        </div>
      </footer>
    </div>
  )
}
