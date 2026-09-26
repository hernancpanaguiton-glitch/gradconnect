import RecommendationsIndex from '@/Pages/Recommendations/Index';
import { sharedProps } from '@/tests/factories';
import { router } from '@inertiajs/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockPost = axios.post as unknown as Mock;

beforeEach(() => {
    vi.useFakeTimers();
    mockPost.mockResolvedValue({ data: {} });
});

afterEach(() => {
    vi.useRealTimers();
});

function renderPage() {
    return render(<RecommendationsIndex {...sharedProps()} matches={[]} hasProfile />);
}

/** The button relabels to "Requesting…" while a run is in flight. */
function refreshButton() {
    return screen.getByRole('button', { name: /Refresh recommendations|Requesting/i });
}

describe('Graduate rematch', () => {
    it('does not reload a page the graduate has already left', async () => {
        const { unmount } = renderPage();

        await act(async () => { fireEvent.click(refreshButton()); });
        unmount();
        act(() => { vi.advanceTimersByTime(4000); });

        expect(router.reload).not.toHaveBeenCalled();
    });

    it('queues one matching run however fast the button is clicked', async () => {
        renderPage();

        await act(async () => { fireEvent.click(refreshButton()); });
        await act(async () => { fireEvent.click(refreshButton()); });

        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(refreshButton()).toBeDisabled();
    });

    it('reloads once the wait is over and re-enables the button', async () => {
        renderPage();

        await act(async () => { fireEvent.click(refreshButton()); });
        act(() => { vi.advanceTimersByTime(4000); });

        expect(router.reload).toHaveBeenCalledWith({ only: ['matches'] });
        expect(refreshButton()).toBeEnabled();
    });

    it('re-enables the button when matching could not be started', async () => {
        mockPost.mockRejectedValue(new Error('boom'));
        renderPage();

        await act(async () => { fireEvent.click(refreshButton()); });

        expect(screen.getByText(/Could not start matching/)).toBeInTheDocument();
        expect(refreshButton()).toBeEnabled();
    });
});
