import AlumniDashboard from '@/Pages/Dashboards/AlumniDashboard';
import Scholarships from '@/Pages/Scholarships';
import StudentCases from '@/Pages/StudentCases';
import SurveysIndex from '@/Pages/Surveys/Index';
import { sharedProps } from '@/tests/factories';
import { setPageProps } from '@/tests/inertiaMock';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

/**
 * Every one of these pages paints a badge from a status lookup table. A status
 * the table has never heard of used to interpolate `undefined` straight into
 * the class list, leaving an unstyled badge — and on the dashboard, an empty
 * one, because the label came from a second unguarded lookup.
 */
function badgeFor(text: string): HTMLElement {
    return screen.getByText(text);
}

function expectStyledBadge(badge: HTMLElement) {
    expect(badge.className).not.toContain('undefined');
    expect(badge.textContent?.trim()).not.toBe('');
}

describe('Unmapped status badges', () => {
    beforeEach(() => setPageProps(sharedProps()));

    it('styles a survey status the list has not learned yet', () => {
        render(
            <SurveysIndex
                {...sharedProps()}
                canManage={false}
                surveys={[
                    {
                        id: 1,
                        title: 'Tracer Study 2026',
                        type: 'tracer',
                        status: 'archived',
                        opens_at: null,
                        closes_at: null,
                        created_at: '2026-01-01T00:00:00.000000Z',
                        questions_count: 3,
                        responses_count: 0,
                        user_response: null,
                    },
                ]}
            />
        );

        expectStyledBadge(badgeFor('archived'));
    });

    it('styles a scholarship status the page has not learned yet', () => {
        render(
            <Scholarships
                {...sharedProps()}
                totalBudget={0}
                totalRecipients={0}
                graduates={[]}
                scholarships={[
                    {
                        id: 1,
                        name: 'CHED Merit Grant',
                        provider: null,
                        description: null,
                        budget_amount: null,
                        status: 'suspended',
                        recipients_count: 0,
                        recipients: [],
                    },
                ]}
            />
        );

        expectStyledBadge(badgeFor('suspended'));
    });

    it('styles a case status the page has not learned yet', () => {
        render(
            <StudentCases
                {...sharedProps()}
                canManage={false}
                cases={[
                    {
                        id: 1,
                        category: 'academic',
                        description: 'Subject conflict.',
                        status: 'escalated',
                        resolution_notes: null,
                        created_at: '2026-01-01T00:00:00.000000Z',
                    },
                ]}
            />
        );

        expectStyledBadge(badgeFor('escalated'));
    });

    it('labels and styles an application status the dashboard has not learned yet', () => {
        render(
            <AlumniDashboard
                {...sharedProps()}
                stats={[{ label: 'Profile Completion', value: '80%' }] as never}
                applicationActivity={[]}
                profileChecklist={[]}
                recentApplications={[
                    {
                        company: 'Acme',
                        position: 'Junior Developer',
                        match: 80,
                        status: 'offer_declined' as never,
                        date: '2026-01-01',
                    },
                ]}
            />
        );

        expectStyledBadge(badgeFor('Offer Declined'));
    });
});
