import PostingsIndex from '@/Pages/Postings/Index';
import { sharedProps } from '@/tests/factories';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const LINKS = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: '/postings?page=1', label: '1', active: true },
    { url: '/postings?page=2', label: '2', active: false },
    { url: '/postings?page=2', label: 'Next &raquo;', active: false },
];

function postings(count: number) {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        title: `Posting ${index + 1}`,
        status: 'open',
        employment_type: 'full_time',
        location: 'Cebu City',
        is_remote: false,
        applications_count: 0,
        created_at: '2026-01-01T00:00:00.000000Z',
    }));
}

describe('Employer posting list', () => {
    it('offers a way to reach the postings past the first page', () => {
        // The list paginates at 20 server-side but rendered no controls, so
        // the header read "25 postings" above 20 rows and the rest could not
        // be opened, edited or closed from the UI at all.
        render(
            <PostingsIndex
                {...sharedProps()}
                company={{ id: 1, name: 'Acme', is_verified: true }}
                postings={{ data: postings(20), total: 25, links: LINKS }}
            />
        );

        expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
        expect(screen.getByText('2').closest('a')).toHaveAttribute('href', '/postings?page=2');
    });

    it('shows no pagination when everything fits on one page', () => {
        render(
            <PostingsIndex
                {...sharedProps()}
                company={{ id: 1, name: 'Acme', is_verified: true }}
                postings={{ data: postings(3), total: 3, links: LINKS.slice(0, 3) }}
            />
        );

        expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument();
    });
});
