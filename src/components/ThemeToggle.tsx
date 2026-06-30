'use client'
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-pressed={theme === 'dark'}
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-muted"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
