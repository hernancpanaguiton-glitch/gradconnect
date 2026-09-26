import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the OS "reduce motion" setting so animated UI can stand still
 * instead of moving regardless. Starts as false and corrects itself after
 * mount, which keeps it safe where matchMedia is unavailable.
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const media = window.matchMedia(QUERY);
        setPrefersReducedMotion(media.matches);

        const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
        media.addEventListener('change', onChange);

        return () => media.removeEventListener('change', onChange);
    }, []);

    return prefersReducedMotion;
}
