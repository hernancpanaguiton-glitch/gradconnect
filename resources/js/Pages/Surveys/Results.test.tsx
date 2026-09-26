import SurveyResults from '@/Pages/Surveys/Results';
import { sharedProps } from '@/tests/factories';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const SURVEY = {
    id: 1,
    title: 'Graduate Tracer Study 2026',
    type: 'tracer',
    status: 'open',
    target_role: null,
    target_graduation_year: null,
};

function renderResults(results: unknown[]) {
    return render(
        <SurveyResults
            {...sharedProps()}
            survey={SURVEY}
            results={results as never}
            totalResponses={0}
        />
    );
}

describe('Survey results', () => {
    it('charts a choice question that has answers', () => {
        renderResults([
            {
                id: 1,
                order: 1,
                prompt: 'Are you employed?',
                type: 'single_choice',
                total_answers: 4,
                distribution: { Yes: 3, No: 1 },
                answers: [],
            },
        ]);

        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('3 (75%)')).toBeInTheDocument();
    });

    it('says there are no answers yet for an unanswered choice question', () => {
        // PHP serialises an empty countBy() as [], which is truthy in JS, so
        // the page took the chart branch and rendered an empty card — the
        // "No answers yet." message was unreachable for exactly the questions
        // most likely to be empty.
        renderResults([
            {
                id: 1,
                order: 1,
                prompt: 'Are you employed?',
                type: 'single_choice',
                total_answers: 0,
                distribution: [],
                answers: [],
            },
        ]);

        expect(screen.getByText('No answers yet.')).toBeInTheDocument();
    });

    it('lists free-text answers when there is no distribution', () => {
        renderResults([
            {
                id: 2,
                order: 1,
                prompt: 'Any feedback?',
                type: 'textarea',
                total_answers: 1,
                distribution: null,
                answers: [{ value: 'The portal was easy to use.' }],
            },
        ]);

        expect(screen.getByText('The portal was easy to use.')).toBeInTheDocument();
    });

    it('does not reorder the results array it was given', () => {
        // sort() mutates, and this array is the Inertia page props object that
        // React reuses across partial reloads.
        const results = [
            { id: 2, order: 2, prompt: 'Second', type: 'text', total_answers: 0, distribution: null, answers: [] },
            { id: 1, order: 1, prompt: 'First', type: 'text', total_answers: 0, distribution: null, answers: [] },
        ];

        renderResults(results);

        expect(results.map((question) => question.id)).toEqual([2, 1]);
    });

    it('still displays the questions in their intended order', () => {
        renderResults([
            { id: 2, order: 2, prompt: 'Second question', type: 'text', total_answers: 0, distribution: null, answers: [] },
            { id: 1, order: 1, prompt: 'First question', type: 'text', total_answers: 0, distribution: null, answers: [] },
        ]);

        const prompts = screen.getAllByText(/question$/).map((node) => node.textContent);

        expect(prompts[0]).toContain('First question');
        expect(prompts[1]).toContain('Second question');
    });
});
