import Community from '@/Pages/Community';
import { sharedProps } from '@/tests/factories';
import { recordedVisits, resetInertiaMock, setPageProps } from '@/tests/inertiaMock';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const onErrorByUrl: Record<string, Record<string, string>> = {};
const pending: string[] = [];

vi.mock('@inertiajs/react', async () => {
    const mock = await import('@/tests/inertiaMock');

    return {
        ...mock,
        router: {
            ...mock.router,
            post: vi.fn((url: string, data: unknown, options?: Record<string, (arg?: unknown) => void>) => {
                mock.router.post(url, data as Record<string, unknown>);

                if (pending.some((key) => url.includes(key))) {
                    return; // left in flight on purpose
                }

                const failure = Object.entries(onErrorByUrl).find(([key]) => url.includes(key));

                if (failure) {
                    options?.onError?.(failure[1]);
                } else {
                    options?.onSuccess?.();
                }

                options?.onFinish?.();
            }),
        },
    };
});
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderCommunity() {
    return render(<Community {...sharedProps()} posts={[]} canPost canModerate={false} />);
}

describe('Community', () => {
    beforeEach(() => {
        resetInertiaMock();
        setPageProps(sharedProps());
        Object.keys(onErrorByUrl).forEach((key) => delete onErrorByUrl[key]);
        pending.length = 0;
    });

    it('explains why a post was rejected instead of silently dropping it', () => {
        // The body is capped at 2000 characters server-side. A rejected post
        // left the text sitting in the box with nothing on screen, so the
        // author clicked Post again and again.
        onErrorByUrl['community.store'] = { body: 'The body must not be greater than 2000 characters.' };
        renderCommunity();

        fireEvent.change(screen.getByPlaceholderText(/Share an update/i), { target: { value: 'A long update' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));

        expect(screen.getByText('The body must not be greater than 2000 characters.')).toBeInTheDocument();
    });

    it('keeps the text so a rejected post is not lost', () => {
        onErrorByUrl['community.store'] = { body: 'Too long.' };
        renderCommunity();

        fireEvent.change(screen.getByPlaceholderText(/Share an update/i), { target: { value: 'My update' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));

        expect(screen.getByPlaceholderText(/Share an update/i)).toHaveValue('My update');
    });

    it('clears the box and the error once the post lands', () => {
        renderCommunity();

        fireEvent.change(screen.getByPlaceholderText(/Share an update/i), { target: { value: 'My update' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));

        expect(screen.getByPlaceholderText(/Share an update/i)).toHaveValue('');
    });

    it('locks the Post button while the update is in flight', () => {
        // Without this an impatient double-click published the same update
        // twice: the first visit is only interrupted client-side, and the
        // server has already inserted the row.
        pending.push('community.store');
        renderCommunity();

        fireEvent.change(screen.getByPlaceholderText(/Share an update/i), { target: { value: 'My update' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));

        expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Post' }));

        expect(recordedVisits().filter((visit) => visit.url.includes('community.store'))).toHaveLength(1);
    });

    it('stops the author exceeding the server limit in the first place', () => {
        renderCommunity();

        expect(screen.getByPlaceholderText(/Share an update/i)).toHaveAttribute('maxLength', '2000');
    });
});
