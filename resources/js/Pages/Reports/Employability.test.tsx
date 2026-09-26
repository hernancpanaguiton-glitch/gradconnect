import EmployabilityReport from '@/Pages/Reports/Employability';
import { sharedProps } from '@/tests/factories';
import { recordedVisits, resetInertiaMock } from '@/tests/inertiaMock';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

type Rates = Array<{ id: number; title: string; submitted: number; eligible: number; responseRate: number }>;

function renderReport(overrides: { surveyResponseRates?: Rates; graduation_year?: number | null } = {}) {
    return render(
        <EmployabilityReport
            {...sharedProps()}
            totalGraduates={100}
            employmentBreakdown={{ employed: 60 }}
            willingToRelocate={20}
            jobRelevanceRate={50}
            salaryDistribution={{}}
            avgTimeToEmploymentMonths={6}
            surveyResponseRates={overrides.surveyResponseRates ?? []}
            colleges={[{ id: 1, name: 'College of Computer Studies' }]}
            programs={[{ id: 2, name: 'BS Computer Science', parent_id: 1 }]}
            scopeLocked={false}
            scopeLabel={null}
            filters={{ college_id: null, program_id: null, graduation_year: overrides.graduation_year ?? null }}
        />
    );
}

function yearField(): HTMLInputElement {
    return screen.getByPlaceholderText('Graduation Year') as HTMLInputElement;
}

describe('Employability report survey response rates', () => {
    beforeEach(() => resetInertiaMock());

    it('tells two surveys of the same title apart', () => {
        // Nothing enforces unique survey titles, so keying the rows on the
        // title collided and React dropped one of them on the next update.
        const warn = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderReport({
            surveyResponseRates: [
                { id: 1, title: 'Tracer Study 2025', submitted: 5, eligible: 10, responseRate: 50 },
                { id: 2, title: 'Tracer Study 2025', submitted: 1, eligible: 4, responseRate: 25 },
            ],
        });

        expect(screen.getByText('5/10 (50%)')).toBeInTheDocument();
        expect(screen.getByText('1/4 (25%)')).toBeInTheDocument();
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('Employability report graduation year filter', () => {
    beforeEach(() => {
        resetInertiaMock();
        vi.useFakeTimers();
    });

    afterEach(() => vi.useRealTimers());

    function advance(ms: number) {
        act(() => {
            vi.advanceTimersByTime(ms);
        });
    }

    it('recomputes the report once for a year that was typed a digit at a time', () => {
        // Each keystroke used to fire a full report recomputation, and the
        // input echoed the server's value back, so the digits lagged.
        renderReport();

        ['2', '20', '202', '2024'].forEach((value) => {
            fireEvent.change(yearField(), { target: { value } });
            advance(100);
        });

        expect(recordedVisits()).toHaveLength(0);

        advance(400);

        expect(recordedVisits()).toHaveLength(1);
        expect(String(recordedVisits()[0].data?.graduation_year)).toBe('2024');
    });

    it('shows every digit as it is typed', () => {
        renderReport();

        fireEvent.change(yearField(), { target: { value: '2024' } });

        expect(yearField().value).toBe('2024');
    });

    it('still lets a college be filtered in one go', () => {
        renderReport();

        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });

        expect(recordedVisits()).toHaveLength(1);
        expect(recordedVisits()[0].data?.college_id).toBe(1);
    });

    it('takes the server\'s year back when a new report arrives', () => {
        const { rerender } = renderReport();

        fireEvent.change(yearField(), { target: { value: '2024' } });
        advance(400);

        rerender(
            <EmployabilityReport
                {...sharedProps()}
                totalGraduates={100}
                employmentBreakdown={{ employed: 60 }}
                willingToRelocate={20}
                jobRelevanceRate={50}
                salaryDistribution={{}}
                avgTimeToEmploymentMonths={6}
                surveyResponseRates={[]}
                colleges={[{ id: 1, name: 'College of Computer Studies' }]}
                programs={[{ id: 2, name: 'BS Computer Science', parent_id: 1 }]}
                scopeLocked={false}
                scopeLabel={null}
                filters={{ college_id: null, program_id: null, graduation_year: 2024 }}
            />
        );
        advance(400);

        expect(yearField().value).toBe('2024');
        expect(recordedVisits()).toHaveLength(1);
    });
});
