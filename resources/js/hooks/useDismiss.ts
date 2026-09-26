import { RefObject, useEffect, useRef } from 'react';

interface DismissOptions {
    /** Close when a pointer goes down outside the element. Default true. */
    outside?: boolean;
    /** Close when Escape is pressed. Default true. */
    escape?: boolean;
}

/**
 * Close a popover, menu or drawer on an outside tap or Escape.
 *
 * Listeners are attached only while the thing is open, so a page full of
 * closed menus costs nothing. `pointerdown` rather than `click` so the menu
 * closes on touch as soon as the finger lands, matching native behaviour.
 */
export function useDismiss<T extends HTMLElement>(
    open: boolean,
    onClose: () => void,
    { outside = true, escape = true }: DismissOptions = {},
): RefObject<T> {
    const ref = useRef<T>(null);
    const onCloseRef = useRef(onClose);

    // Keep the latest callback without re-binding listeners every render.
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handlePointerDown(event: PointerEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onCloseRef.current();
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onCloseRef.current();
            }
        }

        if (outside) {
            document.addEventListener('pointerdown', handlePointerDown);
        }

        if (escape) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, outside, escape]);

    return ref;
}

export default useDismiss;
