import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmHost, confirmDialog } from '@/lib/confirm';

describe('confirmDialog', () => {
    afterEach(() => vi.restoreAllMocks());

    it('shows the message in the app and resolves true when confirmed', async () => {
        render(<ConfirmHost />);
        let answer: Promise<boolean>;
        act(() => {
            answer = confirmDialog('Apply for this position?', { confirmLabel: 'Apply', danger: false });
        });

        expect(await screen.findByText('Apply for this position?')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        await expect(answer!).resolves.toBe(true);
    });

    it('resolves false on Cancel and on Escape, and never uses the browser box', async () => {
        const native = vi.spyOn(window, 'confirm');
        render(<ConfirmHost />);

        let first: Promise<boolean>;
        act(() => {
            first = confirmDialog('Delete this event?', { confirmLabel: 'Delete' });
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
        await expect(first!).resolves.toBe(false);

        let second: Promise<boolean>;
        act(() => {
            second = confirmDialog('Remove this post?', { confirmLabel: 'Remove' });
        });
        await screen.findByText('Remove this post?');
        fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
        await waitFor(() => expect(second!).resolves.toBe(false));

        expect(native).not.toHaveBeenCalled();
    });
});

describe('pages', () => {
    it('never call the browser confirm/alert box, which shows the site address as its title', () => {
        const pages = import.meta.glob('../Pages/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
        const offenders = Object.entries(pages)
            .filter(([path]) => !path.includes('.test.'))
            .filter(([, source]) => /(^|[^.\w])(confirm|alert|prompt)\(/m.test(source))
            .map(([path]) => path);

        expect(offenders).toEqual([]);
    });
});
