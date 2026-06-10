import { cn } from '@/utils/cn'

interface LotusMarkProps {
  className?: string
}

/** Biểu tượng cánh sen — mark thương hiệu Lumotus */
export default function LotusMark({ className }: LotusMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      aria-hidden
    >
      <path
        d="M16 6.5C16 6.5 13.5 10 13.5 14C13.5 16.2 14.6 18 16 18.5C17.4 18 18.5 16.2 18.5 14C18.5 10 16 6.5 16 6.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M10 12C10 12 12.5 11 15 13C16.8 14.2 17.2 16.5 16.5 18.5C15.2 17.8 12.5 17 10.5 14.5C9 12.8 10 12 10 12Z"
        fill="currentColor"
        opacity="0.88"
      />
      <path
        d="M22 12C22 12 19.5 11 17 13C15.2 14.2 14.8 16.5 15.5 18.5C16.8 17.8 19.5 17 21.5 14.5C23 12.8 22 12 22 12Z"
        fill="currentColor"
        opacity="0.88"
      />
      <path
        d="M8 17.5C8 17.5 10.5 16 13 17.5C15 18.8 16 21 16 23.5C14 22 11.5 20.5 9.5 18.5C8.2 17.2 8 17.5 8 17.5Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M24 17.5C24 17.5 21.5 16 19 17.5C17 18.8 16 21 16 23.5C18 22 20.5 20.5 22.5 18.5C23.8 17.2 24 17.5 24 17.5Z"
        fill="currentColor"
        opacity="0.75"
      />
      <ellipse cx="16" cy="25" rx="2.5" ry="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
