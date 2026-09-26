import GlobalSearch from '@/Components/GlobalSearch';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockGet = axios.get as unknown as Mock;

interface Pending { query: string; resolve: (data: unknown) => void }
let pending: Pending[] = [];

/** A results payload holding a single job hit. */
function resultsWith(title: string) {
    return { users: [], candidates: [], jobs: [{ id: 1, title, subtitle: 'Acme', url: '/jobs/1' }], surveys: [] };
}

beforeEach(() => {
    pending = [];
    vi.useFakeTimers();
    mockGet.mockImplementation((_url: string, config?: { params?: { q?: string } }) =>
        new Promise((resolve) => {
            pending.push({
                query: String(config?.params?.q ?? ''),
                resolve: (data: unknown) => resolve({ data }),
            });
        })
    );
});

afterEach(() => {
    vi.useRealTimers();
});

const DESKTOP_FIELD = /Search jobs, graduates, companies/;
const SHEET_FIELD = 'Search jobs, graduates…';

describe('Global search', () => {
    it('shows results for the query the user ended on, not an earlier one', async () => {
        // Search fans out over several LIKE queries, so an earlier keystroke's
        // response can land last and repaint the dropdown with results that no
        // longer match what the field says.
        render(<GlobalSearch />);
        const input = screen.getByPlaceholderText(DESKTOP_FIELD);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Back' } });
        act(() => { vi.advanceTimersByTime(250); });
        fireEvent.change(input, { target: { value: 'Backend' } });
        act(() => { vi.advanceTimersByTime(250); });

        expect(pending.map((p) => p.query)).toEqual(['Back', 'Backend']);

        await act(async () => { pending[1].resolve(resultsWith('Backend Developer')); });
        await act(async () => { pending[0].resolve(resultsWith('Back Office Clerk')); });

        expect(screen.getByText('Backend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Back Office Clerk')).not.toBeInTheDocument();
    });
});

describe('Mobile search sheet', () => {
    it('reopens empty after being dismissed with Escape', async () => {
        // Escape and tap-outside went straight to setSheetOpen(false), skipping
        // the one path that also clears the query, so the sheet came back
        // carrying the previous term and its results.
        render(<GlobalSearch />);

        fireEvent.click(screen.getByRole('button', { name: 'Search' }));
        fireEvent.change(screen.getByPlaceholderText(SHEET_FIELD), { target: { value: 'Backend' } });
        act(() => { vi.advanceTimersByTime(250); });
        await act(async () => { pending[0].resolve(resultsWith('Backend Developer')); });

        expect(screen.getByText('Backend Developer')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        fireEvent.click(screen.getByRole('button', { name: 'Search' }));

        expect(screen.getByPlaceholderText(SHEET_FIELD)).toHaveValue('');
        expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
    });

    it('reopens empty after being dismissed with a tap outside', async () => {
        render(<GlobalSearch />);

        fireEvent.click(screen.getByRole('button', { name: 'Search' }));
        fireEvent.change(screen.getByPlaceholderText(SHEET_FIELD), { target: { value: 'Backend' } });
        act(() => { vi.advanceTimersByTime(250); });
        await act(async () => { pending[0].resolve(resultsWith('Backend Developer')); });

        fireEvent.pointerDown(document.body);
        fireEvent.click(screen.getByRole('button', { name: 'Search' }));

        expect(screen.getByPlaceholderText(SHEET_FIELD)).toHaveValue('');
    });
});
