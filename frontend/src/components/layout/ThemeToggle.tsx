import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="lumo-icon-btn"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-[var(--color-warning)]" />
      ) : (
        <Moon className="h-5 w-5 text-[var(--color-secondary)]" />
      )}
    </button>
  )
}
