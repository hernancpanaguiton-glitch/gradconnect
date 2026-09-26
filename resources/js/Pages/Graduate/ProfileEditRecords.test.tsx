import ProfileEdit from '@/Pages/Graduate/ProfileEdit';
import { sharedProps } from '@/tests/factories';
import { recordedVisits, resetInertiaMock, setPageProps } from '@/tests/inertiaMock';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let nextErrors: Record<string, string> | null = null;
let leaveInFlight = false;

vi.mock('@inertiajs/react', async () => {
    const mock = await import('@/tests/inertiaMock');

    return {
        ...mock,
        router: {
            ...mock.router,
            post: vi.fn((url: string, data: unknown, options?: Record<string, (arg?: unknown) => void>) => {
                mock.router.post(url, data as Record<string, unknown>);

                if (leaveInFlight) {
                    return;
                }

                if (nextErrors) {
                    options?.onError?.(nextErrors);
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

const PROFILE = {
    id: 1,
    program: null,
    department_id: null,
    graduation_year: null,
    gender: null,
    birthdate: null,
    phone: null,
    city: null,
    linkedin_url: null,
    headline: null,
    summary: null,
    current_employment_status: null,
    willing_to_relocate: false,
    profile_completion: 20,
    education_records: [],
    employment_records: [],
    skills: [],
};

function renderProfile() {
    return render(
        <ProfileEdit
            {...sharedProps()}
            profile={PROFILE as never}
            allSkills={[]}
            colleges={[]}
            selectedCollegeId={null}
            selectedProgramId={null}
            skillCategory={null}
        />
    );
}

function openTab(name: RegExp) {
    fireEvent.click(screen.getByRole('tab', { name }));
}

describe('Profile education and employment records', () => {
    beforeEach(() => {
        resetInertiaMock();
        setPageProps(sharedProps());
        nextErrors = null;
        leaveInFlight = false;
    });

    it('shows why an education record was rejected', () => {
        // These forms post through the router, not useForm, so their
        // rejections never reached useForm's errors — leaving Institution
        // blank simply made the Add button do nothing at all.
        nextErrors = { institution: 'The institution field is required.' };
        renderProfile();
        openTab(/Education/);

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(screen.getByText('The institution field is required.')).toBeInTheDocument();
    });

    it('shows why an employment record was rejected', () => {
        nextErrors = { end_date: 'The end date field must be a date after or equal to start date.' };
        renderProfile();
        openTab(/Employment/);

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(
            screen.getByText('The end date field must be a date after or equal to start date.')
        ).toBeInTheDocument();
    });

    it('clears the message once the record is accepted', () => {
        nextErrors = { institution: 'The institution field is required.' };
        renderProfile();
        openTab(/Education/);
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        nextErrors = null;
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(screen.queryByText('The institution field is required.')).not.toBeInTheDocument();
    });

    it('locks Add while the record is in flight', () => {
        // Neither Add button was covered by the profile form's own processing
        // flag, so a double click created two identical records.
        leaveInFlight = true;
        renderProfile();
        openTab(/Education/);

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));
        expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(recordedVisits().filter((visit) => visit.url.includes('education.store'))).toHaveLength(1);
    });
});
