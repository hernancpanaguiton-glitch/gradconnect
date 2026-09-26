import { useEffect } from 'react';

/**
 * Stop the page behind an open overlay from scrolling.
 *
 * Without this the sidebar drawer floats over a page that still scrolls
 * under the finger, which reads as the drawer itself being broken.
 */
export function useBodyScrollLock(active: boolean): void {
    useEffect(() => {
        if (!active) {
            return;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previous;
        };
    }, [active]);
}

export default useBodyScrollLock;
