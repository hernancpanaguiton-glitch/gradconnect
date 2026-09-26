import PublicNav from '@/Components/PublicNav';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

function menuButton() {
    return screen.getByRole('button', { name: /menu/i });
}

function panel() {
    return document.getElementById('public-mobile-menu');
}

describe('PublicNav', () => {
    it('keeps the menu closed until it is opened', () => {
        render(<PublicNav />);

        expect(panel()).toBeNull();
        expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a menu holding every destination', () => {
        // The public pages previously hid these links below md with nothing
        // in their place, so a phone could not reach About or employer sign-up.
        render(<PublicNav />);

        fireEvent.click(menuButton());

        expect(panel()).not.toBeNull();
        expect(menuButton()).toHaveAttribute('aria-expanded', 'true');

        ['Features', 'For Employers', 'Contact', 'About'].forEach((label) => {
            expect(within(panel() as HTMLElement).getByText(label)).toBeInTheDocument();
        });
    });

    it('sends "For Employers" to the partner sign-up', () => {
        render(<PublicNav />);
        fireEvent.click(menuButton());

        expect(within(panel() as HTMLElement).getByText('For Employers').closest('a')).toHaveAttribute(
            'href',
            '/register?role=industry_partner'
        );
    });

    it('offers sign in and sign up inside the menu for a guest', () => {
        // Both buttons plus the wordmark need more width than a 375px bar has.
        render(<PublicNav />);
        fireEvent.click(menuButton());

        expect(within(panel() as HTMLElement).getByText('Sign In')).toBeInTheDocument();
        expect(within(panel() as HTMLElement).getByText('Get Started')).toBeInTheDocument();
    });

    it('shows a dashboard link instead once signed in', () => {
        render(<PublicNav user={{ id: 1 }} />);

        expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('closes the menu after a destination is chosen', () => {
        render(<PublicNav />);
        fireEvent.click(menuButton());

        fireEvent.click(within(panel() as HTMLElement).getByText('About'));

        expect(panel()).toBeNull();
    });

    it('closes the menu on Escape', () => {
        render(<PublicNav />);
        fireEvent.click(menuButton());

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(panel()).toBeNull();
    });
});
