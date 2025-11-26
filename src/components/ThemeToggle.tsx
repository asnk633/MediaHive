'use client'
import useTheme from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      aria-pressed={theme === 'dark'}
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}