import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

function Overlay({ active }: { active: boolean }) {
    useBodyScrollLock(active);

    return null;
}

afterEach(() => {
    document.body.style.overflow = '';
});

describe('useBodyScrollLock', () => {
    it('locks while active and restores on unmount', () => {
        const { unmount } = render(<Overlay active />);
        expect(document.body.style.overflow).toBe('hidden');

        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('does nothing while inactive', () => {
        render(<Overlay active={false} />);

        expect(document.body.style.overflow).toBe('');
    });

    it('leaves the page scrollable after two overlays close in either order', () => {
        // The sidebar drawer and the mobile search sheet are both phone-width
        // and can be open together. Each used to capture the body's overflow
        // at mount, so the second captured "hidden" — closing them in the
        // wrong order wrote "hidden" back and the page could not be scrolled
        // again without a reload.
        const drawer = render(<Overlay active />);
        const sheet = render(<Overlay active />);

        expect(document.body.style.overflow).toBe('hidden');

        drawer.unmount();
        sheet.unmount();

        expect(document.body.style.overflow).toBe('');
    });

    it('keeps the page locked while the second overlay is still open', () => {
        const drawer = render(<Overlay active />);
        const sheet = render(<Overlay active />);

        drawer.unmount();

        // The sheet is still covering the page, so it must not scroll behind it.
        expect(document.body.style.overflow).toBe('hidden');

        sheet.unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('restores a page that was already unscrollable for another reason', () => {
        document.body.style.overflow = 'clip';

        const { unmount } = render(<Overlay active />);
        expect(document.body.style.overflow).toBe('hidden');

        unmount();
        expect(document.body.style.overflow).toBe('clip');
    });
});
