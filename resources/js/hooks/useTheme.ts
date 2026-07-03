import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Reads/writes the `dark` class on <html> and persists the choice.
 * The initial class is applied pre-paint by an inline script in app.blade.php.
 */
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light',
    );

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem('theme', theme);
        } catch {
            // ignore storage errors (private mode, etc.)
        }
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, isDark: theme === 'dark', toggle };
}
