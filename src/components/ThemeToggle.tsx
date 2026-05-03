'use client'
import useTheme from '@/lib/useTheme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-pressed={theme === 'dark'}
      aria-label="Toggle theme"
      onClick={toggle}
      className="p-2 rounded"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
