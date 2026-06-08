import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md',
  secondary:
    'bg-[var(--color-secondary)] text-white hover:opacity-90 shadow-sm hover:shadow-md',
  outline:
    'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)]',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
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
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none',
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
