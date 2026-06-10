import { Link } from 'react-router-dom'
import LotusMark from '@/components/brand/LotusMark'
import { cn } from '@/utils/cn'

type LogoSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<
  LogoSize,
  { box: string; mark: string; text: string; gap: string }
> = {
  sm: {
    box: 'h-8 w-8 rounded-lg',
    mark: 'h-[18px] w-[18px]',
    text: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    box: 'h-9 w-9 rounded-xl',
    mark: 'h-5 w-5',
    text: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    box: 'h-11 w-11 rounded-xl',
    mark: 'h-6 w-6',
    text: 'text-2xl',
    gap: 'gap-3',
  },
}

interface LumotusLogoProps {
  size?: LogoSize
  showText?: boolean
  to?: string
  className?: string
}

export default function LumotusLogo({
  size = 'md',
  showText = true,
  to,
  className,
}: LumotusLogoProps) {
  const s = sizeMap[size]

  const mark = (
    <div className={cn('lumo-logo-mark flex shrink-0 items-center justify-center text-white', s.box)}>
      <LotusMark className={s.mark} />
    </div>
  )

  const label = showText ? (
    <span className={cn('hidden font-bold tracking-tight text-[var(--color-text)] sm:inline', s.text)}>
      Lumotus
    </span>
  ) : null

  const classes = cn('group inline-flex min-w-0 items-center', s.gap, className)

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          classes,
          'relative z-10 cursor-pointer rounded-lg outline-none transition-transform duration-200',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        )}
        aria-label="Lumotus — về trang chủ"
      >
        {mark}
        {label}
      </Link>
    )
  }

  return (
    <div className={classes}>
      {mark}
      {label}
    </div>
  )
}
