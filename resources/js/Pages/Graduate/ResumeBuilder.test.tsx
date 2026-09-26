import ResumeBuilder from '@/Pages/Graduate/ResumeBuilder';
import { sharedProps } from '@/tests/factories';
import { setPageProps } from '@/tests/inertiaMock';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const EMPTY_PROFILE: Record<string, unknown> = {
    id: 1,
    program: null,
    headline: null,
    summary: null,
    phone: null,
    city: null,
    linkedin_url: null,
    graduation_year: null,
    skills: [],
    education_records: [],
    employment_records: [],
};

function renderBuilder(profile: Record<string, unknown> = {}) {
    return render(<ResumeBuilder {...sharedProps()} profile={{ ...EMPTY_PROFILE, ...profile } as never} />);
}

describe('Resume builder', () => {
    beforeEach(() => setPageProps(sharedProps()));

    it('renders a profile that has no relations loaded yet', () => {
        // A graduate who has never opened their profile has no row, so the
        // controller creates one. When its relations were missing the page
        // threw on .length and white-screened.
        expect(() => renderBuilder()).not.toThrow();
    });

    it('offers to build once the profile has only a program', () => {
        // The server's own emptiness rule counts `program`, so refusing here
        // made the feature unreachable for a graduate whose profile came from
        // enrolment data alone.
        renderBuilder({ program: 'BS Information Technology' });

        expect(screen.getByRole('button', { name: /save as my resume/i })).toBeEnabled();
    });

    it('refuses to build a genuinely empty profile', () => {
        renderBuilder();

        expect(screen.getByRole('button', { name: /save as my resume/i })).toBeDisabled();
    });

    it('does not claim a finished job is still current', () => {
        // is_current is false and end_date is empty — a real combination the
        // employment form allows. The résumé printed "Present", telling every
        // employer the graduate still worked there.
        renderBuilder({
            employment_records: [
                {
                    id: 1,
                    job_title: 'Junior Developer',
                    company_name: 'Acme',
                    industry: null,
                    location: null,
                    start_date: '2020-01-15',
                    end_date: null,
                    is_current: false,
                    description: null,
                },
            ],
        } as never);

        const dates = screen.getByText(/2020/);

        expect(dates.textContent).not.toContain('Present');
    });

    it('still says Present for a role the graduate holds now', () => {
        renderBuilder({
            employment_records: [
                {
                    id: 1,
                    job_title: 'Developer',
                    company_name: 'Acme',
                    industry: null,
                    location: null,
                    start_date: '2020-01-15',
                    end_date: null,
                    is_current: true,
                    description: null,
                },
            ],
        } as never);

        expect(screen.getByText(/Present/)).toBeInTheDocument();
    });
});
