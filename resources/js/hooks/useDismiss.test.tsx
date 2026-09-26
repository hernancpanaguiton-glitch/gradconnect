import useDismiss from '@/hooks/useDismiss';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

function Menu({
    open,
    onClose,
    outside = true,
    escape = true,
}: {
    open: boolean;
    onClose: () => void;
    outside?: boolean;
    escape?: boolean;
}) {
    const ref = useDismiss<HTMLDivElement>(open, onClose, { outside, escape });

    return (
        <div>
            <div ref={ref} data-testid="panel">
                <button>inside</button>
            </div>
            <button>outside</button>
        </div>
    );
}

describe('useDismiss', () => {
    it('closes on a pointer down outside the element', () => {
        const onClose = vi.fn();
        render(<Menu open onClose={onClose} />);

        fireEvent.pointerDown(screen.getByText('outside'));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('stays open when the pointer goes down inside', () => {
        const onClose = vi.fn();
        render(<Menu open onClose={onClose} />);

        fireEvent.pointerDown(screen.getByText('inside'));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on Escape', () => {
        const onClose = vi.fn();
        render(<Menu open onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('ignores other keys', () => {
        const onClose = vi.fn();
        render(<Menu open onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'a' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('listens for nothing while closed', () => {
        // A page full of closed menus should cost no listeners.
        const onClose = vi.fn();
        render(<Menu open={false} onClose={onClose} />);

        fireEvent.pointerDown(screen.getByText('outside'));
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('can take Escape only, for a drawer with its own backdrop', () => {
        const onClose = vi.fn();
        render(<Menu open onClose={onClose} outside={false} />);

        fireEvent.pointerDown(screen.getByText('outside'));
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('detaches its listeners when it closes', () => {
        const onClose = vi.fn();
        const { rerender } = render(<Menu open onClose={onClose} />);

        rerender(<Menu open={false} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('calls the latest callback without rebinding', () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(<Menu open onClose={first} />);

        rerender(<Menu open onClose={second} />);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });
});
