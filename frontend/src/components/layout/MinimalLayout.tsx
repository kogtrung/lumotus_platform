import { Outlet } from 'react-router-dom'

export default function MinimalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <Outlet />
    </div>
  )
}
