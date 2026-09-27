import CompanyEdit from '@/Pages/Company/Edit';
import { sharedProps } from '@/tests/factories';
import { setPageProps } from '@/tests/inertiaMock';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let formErrors: Record<string, string> = {};

vi.mock('@inertiajs/react', async () => {
    const mock = await import('@/tests/inertiaMock');

    return {
        ...mock,
        useForm: <T extends Record<string, unknown>>(initial: T) => ({
            ...mock.useForm(initial),
            errors: formErrors,
        }),
    };
});
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const COMPANY = {
    id: 1,
    name: 'Acme',
    industry: 'IT',
    website: 'https://acme.test',
    description: 'We build things.',
    location: 'Cebu City',
    is_verified: false,
};

describe('Company profile form', () => {
    beforeEach(() => {
        formErrors = {};
        setPageProps(sharedProps());
    });

    /**
     * UpdateCompanyRequest can reject name, website, industry, location and
     * description. Only the first two were displayed, so a partner who pasted
     * an over-long location saw the Save button flicker and nothing else —
     * the change was silently discarded.
     */
    it.each([
        ['name', 'The name field is required.'],
        ['website', 'The website field must be a valid URL.'],
        ['industry', 'The industry must not be greater than 255 characters.'],
        ['location', 'The location must not be greater than 255 characters.'],
        ['description', 'The description field must be a string.'],
    ])('shows the server error for %s', (field, message) => {
        formErrors = { [field]: message };

        render(<CompanyEdit {...sharedProps()} company={COMPANY} />);

        expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('shows nothing when the save succeeded', () => {
        render(<CompanyEdit {...sharedProps()} company={COMPANY} />);

        expect(document.querySelectorAll('.text-destructive')).toHaveLength(0);
    });
});
