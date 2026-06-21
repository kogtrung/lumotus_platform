import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<LogoSize, { box: string; text: string; gap: string }> = {
  sm: {
    box: 'h-9 w-9',
    text: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    box: 'h-10 w-10',
    text: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    box: 'h-12 w-12',
    text: 'text-2xl',
    gap: 'gap-3',
  },
  xl: {
    box: 'h-72 w-72',
    text: 'text-3xl',
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
  to = '/',
  className,
}: LumotusLogoProps) {
  const s = sizeMap[size]

  const mark = (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center rounded-full overflow-hidden',
        'bg-white/90 backdrop-blur-sm',
        'ring-2 ring-white/60',
        'shadow-md',
        'transition-all duration-300',
        'hover:shadow-lg hover:scale-105',
        'active:scale-95',
        s.box
      )}
    >
      <img src="/logo.svg" alt="Lumotus" className="w-full h-full object-contain" />
    </div>
  )

  const label = showText ? (
    <span
      className={cn(
        'hidden font-bold tracking-tight',
        'bg-gradient-to-r from-[#DB2777] via-[#EC4899] to-[#F472B6]',
        'bg-clip-text text-transparent',
        s.text
      )}
    >
      Lumotus
    </span>
  ) : null

  const classes = cn(
    'group inline-flex min-w-0 items-center',
    s.gap,
    className
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          classes,
          'relative z-10 cursor-pointer rounded-xl outline-none transition-transform duration-200',
          'focus-visible:ring-2 focus-visible:ring-[#EC4899] focus-visible:ring-offset-2'
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
