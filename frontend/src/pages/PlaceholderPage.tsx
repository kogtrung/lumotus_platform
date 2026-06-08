type Props = { title: string }

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Đang phát triển — Sprint sau.</p>
    </div>
  )
}
