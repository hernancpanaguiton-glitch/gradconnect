import { useEffect } from 'react';

/**
 * How many overlays currently want the page locked, and what the page looked
 * like before the first of them opened.
 *
 * Module-level rather than per-hook: the sidebar drawer and the mobile search
 * sheet are both phone-width and can be open at once. When each captured the
 * body's overflow for itself, the second captured the first's "hidden" —
 * closing the drawer first let the page scroll behind the still-open sheet,
 * and closing the sheet afterwards wrote "hidden" back, leaving the page
 * unscrollable until a reload.
 */
let locks = 0;
let previousOverflow = '';

/**
 * Stop the page behind an open overlay from scrolling.
 *
 * Without this the sidebar drawer floats over a page that still scrolls under
 * the finger, which reads as the drawer itself being broken.
 */
export function useBodyScrollLock(active: boolean): void {
    useEffect(() => {
        if (!active) {
            return;
        }

        if (locks === 0) {
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }

        locks += 1;

        return () => {
            locks -= 1;

            if (locks === 0) {
                document.body.style.overflow = previousOverflow;
            }
        };
    }, [active]);
}

export default useBodyScrollLock;
