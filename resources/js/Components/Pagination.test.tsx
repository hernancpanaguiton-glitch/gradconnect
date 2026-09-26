import Pagination, { PaginationLink } from '@/Components/Pagination';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

const LINKS: PaginationLink[] = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: '/admin/users?page=1', label: '1', active: true },
    { url: '/admin/users?page=2', label: '2', active: false },
    { url: '/admin/users?page=2', label: 'Next &raquo;', active: false },
];

describe('Pagination', () => {
    it('renders nothing for a single page', () => {
        // Laravel always returns Previous and Next, so anything shorter is one page.
        const { container } = render(<Pagination links={LINKS.slice(0, 3)} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('links every reachable page', () => {
        render(<Pagination links={LINKS} />);

        expect(screen.getByText('2').closest('a')).toHaveAttribute('href', '/admin/users?page=2');
    });

    it('marks the current page for assistive technology', () => {
        render(<Pagination links={LINKS} />);

        expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByText('2')).not.toHaveAttribute('aria-current');
    });

    it('renders an unavailable page as disabled text, not a link', () => {
        render(<Pagination links={LINKS} />);

        const previous = screen.getByText('« Previous');
        expect(previous.tagName).toBe('SPAN');
        expect(previous).toHaveAttribute('aria-disabled', 'true');
    });

    it('gives every target a comfortable tap area', () => {
        // The six hand-rolled strips this replaced were small text links.
        render(<Pagination links={LINKS} />);

        expect(screen.getByText('2').className).toContain('min-h-10');
    });

    it('wraps instead of overflowing a narrow screen', () => {
        render(<Pagination links={LINKS} />);

        expect(screen.getByRole('navigation').className).toContain('flex-wrap');
    });
});
