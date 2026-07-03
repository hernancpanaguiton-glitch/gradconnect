import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { isDark, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
