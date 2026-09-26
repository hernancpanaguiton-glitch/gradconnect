import { useEffect, useState } from 'react';

/**
 * Track a CSS media query from JavaScript, for the cases Tailwind's
 * responsive classes cannot cover — deciding how many axis ticks a chart
 * should draw, or closing the mobile drawer once the sidebar becomes
 * permanent at `lg`.
 *
 * Starts false so the server-rendered markup and the first client render
 * agree; the effect corrects it immediately after mount.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const list = window.matchMedia(query);
        setMatches(list.matches);

        function handleChange(event: MediaQueryListEvent) {
            setMatches(event.matches);
        }

        list.addEventListener('change', handleChange);

        return () => list.removeEventListener('change', handleChange);
    }, [query]);

    return matches;
}

/** Tailwind's `lg` breakpoint, where the sidebar stops being a drawer. */
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)');
}

export default useMediaQuery;
