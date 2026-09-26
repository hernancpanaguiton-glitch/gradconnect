import Candidates from '@/Pages/Postings/Candidates';
import { sharedProps } from '@/tests/factories';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const POSTING = { id: 7, title: 'Backend Developer' };

type Resume = { id: number; original_filename: string; can_download: boolean } | null;

function applicant(resume: Resume) {
    return {
        id: 1,
        status: 'submitted',
        applied_at: '2026-01-05T00:00:00.000000Z',
        cover_letter: null,
        graduate_profile: {
            id: 3,
            user: { name: 'Ada Lovelace', email: 'ada@example.test' },
            current_employment_status: null,
            department: null,
        },
        resume,
        employer_feedback: null,
    };
}

function renderWith(resume: Resume) {
    return render(
        <Candidates
            {...sharedProps()}
            posting={POSTING}
            applications={{ data: [applicant(resume)], total: 1, links: [] }}
        />
    );
}

describe('Posting applicant list', () => {
    it('offers the résumé the employer is entitled to read', () => {
        // The row carried the résumé all along — CandidatePresenter sends it and
        // ResumePolicy grants an applicant's own posting owner access — but the
        // list never rendered it, so the one screen with the strongest claim to
        // the file was the one screen that offered no way to open it.
        renderWith({ id: 11, original_filename: 'ada-lovelace.pdf', can_download: true });

        const link = screen.getByRole('link', { name: /ada-lovelace\.pdf/ });
        expect(link).toHaveAttribute('href', '/candidates.resume/11');
    });

    it('offers no link when the applicant attached no résumé', () => {
        renderWith(null);

        expect(screen.queryByRole('link', { name: /résumé/i })).not.toBeInTheDocument();
    });

    it('offers no link when the viewer may not download the file', () => {
        renderWith({ id: 11, original_filename: 'ada-lovelace.pdf', can_download: false });

        expect(screen.queryByRole('link', { name: /ada-lovelace\.pdf/ })).not.toBeInTheDocument();
    });
});
