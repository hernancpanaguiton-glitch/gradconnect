// A fixed, non-UTC zone: everything below asserts the difference between the
// instant the server stores and the wall clock the form must show. Node reads
// TZ once, when it first touches a Date, so this has to run before the imports.
process.env.TZ = 'Asia/Manila';

import SurveyCreate from '@/Pages/Surveys/Create';
import SurveyEdit from '@/Pages/Surveys/Edit';
import { sharedProps } from '@/tests/factories';
import { lastVisit, resetInertiaMock } from '@/tests/inertiaMock';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Server-side validation errors, injected the way Inertia delivers them: as
 * the `errors` bag on the page's own form. The shared mock has no door for
 * that, so useForm is wrapped here.
 */
const serverErrors: Record<string, string> = {};

vi.mock('@inertiajs/react', async () => {
    const mock = await import('@/tests/inertiaMock');

    return {
        ...mock,
        useForm: (initial: Record<string, unknown>) => ({ ...mock.useForm(initial), errors: serverErrors }),
    };
});
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const PROMPT_REQUIRED = 'The questions.2.prompt field is required.';

function prompts(): HTMLInputElement[] {
    return screen.getAllByPlaceholderText('Question prompt *');
}

/** The question row a prompt input belongs to, so an error can be traced to it. */
function rowOf(input: HTMLElement): HTMLElement {
    return input.closest('div.rounded-lg.border') as HTMLElement;
}

function addQuestions(...texts: string[]) {
    texts.forEach((text, index) => {
        fireEvent.click(screen.getByRole('button', { name: '+ Add Question' }));
        fireEvent.change(prompts()[index], { target: { value: text } });
    });
}

function removeQuestion(index: number) {
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[index]);
}

describe('Survey builder question rows', () => {
    beforeEach(() => {
        resetInertiaMock();
        Object.keys(serverErrors).forEach((key) => delete serverErrors[key]);
    });

    it('keeps a per-question error on its own question after an earlier one is removed', () => {
        // Laravel keys these by position in the submitted payload, so a
        // removal used to make a real error disappear entirely.
        serverErrors['questions.2.prompt'] = PROMPT_REQUIRED;
        render(<SurveyCreate {...sharedProps()} />);

        addQuestions('First', 'Second', 'Third');
        fireEvent.click(screen.getByRole('button', { name: 'Create Survey' }));

        expect(rowOf(prompts()[2])).toHaveTextContent(PROMPT_REQUIRED);

        removeQuestion(0);

        const third = prompts().find((input) => input.value === 'Third') as HTMLInputElement;

        expect(rowOf(third)).toHaveTextContent(PROMPT_REQUIRED);
        expect(screen.getAllByText(PROMPT_REQUIRED)).toHaveLength(1);
    });

    it('does not hand a newly added question somebody else\'s error', () => {
        serverErrors['questions.2.prompt'] = PROMPT_REQUIRED;
        render(<SurveyCreate {...sharedProps()} />);

        addQuestions('First', 'Second', 'Third');
        fireEvent.click(screen.getByRole('button', { name: 'Create Survey' }));
        removeQuestion(0);
        fireEvent.click(screen.getByRole('button', { name: '+ Add Question' }));

        const added = prompts().find((input) => input.value === '') as HTMLInputElement;

        expect(rowOf(added)).not.toHaveTextContent(PROMPT_REQUIRED);
    });

    it('keeps each question in its own row when an earlier one is removed', () => {
        // Keyed by index, React reused the removed row's DOM node for the
        // next question, carrying its focus and scroll position with it.
        render(<SurveyCreate {...sharedProps()} />);

        addQuestions('First', 'Second');

        const second = prompts()[1];

        removeQuestion(0);

        expect(prompts()).toHaveLength(1);
        expect(prompts()[0]).toBe(second);
        expect(second.value).toBe('Second');
    });
});

const SURVEY = {
    id: 7,
    title: 'Graduate Tracer Study 2026',
    description: null,
    type: 'tracer',
    status: 'open',
    target_role: null,
    target_graduation_year: null,
    // 18:00 UTC is 02:00 the next day in Manila.
    opens_at: '2026-01-15T18:00:00.000000Z',
    closes_at: '2026-02-20T18:00:00.000000Z',
    questions: [
        { id: 1, prompt: 'First', type: 'text', options: null, is_required: true, maps_to: null, order: 1, answers_count: 0 },
        { id: 2, prompt: 'Second', type: 'text', options: null, is_required: true, maps_to: null, order: 2, answers_count: 0 },
        { id: 3, prompt: 'Third', type: 'text', options: null, is_required: true, maps_to: null, order: 3, answers_count: 0 },
    ],
};

/** The labels are not wired to their inputs by id, so go through the row. */
function scheduleField(label: string): HTMLInputElement {
    return screen.getByText(label).parentElement?.querySelector('input') as HTMLInputElement;
}

describe('Survey schedule fields', () => {
    beforeEach(() => {
        resetInertiaMock();
        Object.keys(serverErrors).forEach((key) => delete serverErrors[key]);
    });

    it('shows a UTC instant as the browser\'s own wall clock', () => {
        // datetime-local reads its value as local time, so slicing the ISO
        // string told a Manila admin the survey opens at 18:00 when it really
        // opens at 02:00 the following morning.
        render(<SurveyEdit {...sharedProps()} survey={SURVEY} />);

        const at = new Date(SURVEY.opens_at);
        const pad = (value: number) => String(value).padStart(2, '0');

        expect(scheduleField("Opens At").value).toBe(
            `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
        );
        expect(scheduleField("Opens At").value).toBe('2026-01-16T02:00');
    });

    it('saves an untouched schedule back as the same instant', () => {
        render(<SurveyEdit {...sharedProps()} survey={SURVEY} />);

        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        const sent = lastVisit()?.data as { opens_at: string; closes_at: string };

        expect(new Date(sent.opens_at).toISOString()).toBe(new Date(SURVEY.opens_at).toISOString());
        expect(new Date(sent.closes_at).toISOString()).toBe(new Date(SURVEY.closes_at).toISOString());
    });

    it('sends the instant the admin meant when the local time is edited', () => {
        render(<SurveyEdit {...sharedProps()} survey={SURVEY} />);

        fireEvent.change(scheduleField("Opens At"), { target: { value: '2026-01-16T09:30' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        const sent = lastVisit()?.data as { opens_at: string };

        expect(new Date(sent.opens_at).toISOString()).toBe(new Date('2026-01-16T09:30').toISOString());
        expect(sent.opens_at).toBe('2026-01-16T01:30:00.000Z');
    });
});
