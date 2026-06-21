import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-btn)] hover:shadow-[var(--shadow-btn-hover)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[var(--shadow-btn)]',
  secondary:
    'bg-[var(--color-secondary)] text-white hover:opacity-90 shadow-[var(--shadow-btn)] hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-sm)]',
  accent:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-accent)] hover:shadow-[var(--shadow-accent-hover)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[var(--shadow-accent)]',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

type ButtonProps = ButtonBaseProps &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { to?: never })
    | ({ to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)
  )

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
    variantClass[variant],
    sizeClass[size],
    className,
  )

  if ('to' in props && props.to) {
    const { to, ...rest } = props
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  const { type = 'button', ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
