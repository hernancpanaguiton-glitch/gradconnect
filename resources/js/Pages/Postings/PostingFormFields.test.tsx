import PostingFormFields, { SetPostingData, SkillPivot } from '@/Pages/Postings/PostingFormFields';
import { useForm } from '@inertiajs/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockGet = axios.get as unknown as Mock;

/** An axios.get whose responses can be settled in any order the test likes. */
interface Pending { query: string; resolve: (data: unknown) => void; reject: () => void }
let pending: Pending[] = [];

const SKILLS = [
    { id: 1, name: 'Teamwork', category: 'Soft Skills' },
    { id: 2, name: 'Communication', category: 'Soft Skills' },
];

function Harness({ errors = {} }: { errors?: Partial<Record<string, string>> }) {
    const { data, setData } = useForm({
        title: '',
        description: '',
        qualifications: '',
        employment_type: 'full_time',
        status: 'open',
        location: '',
        is_remote: false,
        salary_range: '',
        application_deadline: '',
        skills: [] as SkillPivot[],
    });

    return (
        <PostingFormFields
            data={data}
            setData={setData as unknown as SetPostingData}
            errors={errors}
            skills={SKILLS}
        />
    );
}

beforeEach(() => {
    pending = [];
    vi.useFakeTimers();
    mockGet.mockImplementation((_url: string, config?: { params?: { q?: string } }) =>
        new Promise((resolve, reject) => {
            pending.push({
                query: String(config?.params?.q ?? ''),
                resolve: (data: unknown) => resolve({ data }),
                reject: () => reject(new Error('canceled')),
            });
        })
    );
});

afterEach(() => {
    vi.useRealTimers();
});

function titleInput() {
    return screen.getByPlaceholderText(/Start typing/i);
}

function skillInput() {
    return screen.getByPlaceholderText(/Add a skill/i);
}

describe('Job title autocomplete', () => {
    it('shows suggestions for the query the user ended on, not an earlier one', async () => {
        // These suggestions are LLM-backed, so latency swings: "Back" can
        // answer after "Backend". Clicking a suggestion writes it into the
        // title, so a stale list hands the employer a job they never searched.
        render(<Harness />);
        fireEvent.focus(titleInput());

        fireEvent.change(titleInput(), { target: { value: 'Back' } });
        act(() => { vi.advanceTimersByTime(300); });
        fireEvent.change(titleInput(), { target: { value: 'Backend' } });
        act(() => { vi.advanceTimersByTime(300); });

        expect(pending.map((p) => p.query)).toEqual(['Back', 'Backend']);

        await act(async () => { pending[1].resolve({ titles: ['Backend Developer'] }); });
        await act(async () => { pending[0].resolve({ titles: ['Back Office Clerk'] }); });

        expect(screen.getByText('Backend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Back Office Clerk')).not.toBeInTheDocument();
    });
});

describe('Skill autocomplete', () => {
    it('shows suggestions for the query the user ended on, not an earlier one', async () => {
        render(<Harness />);

        fireEvent.change(skillInput(), { target: { value: 'Kub' } });
        act(() => { vi.advanceTimersByTime(300); });
        fireEvent.change(skillInput(), { target: { value: 'Kubernetes' } });
        act(() => { vi.advanceTimersByTime(300); });

        await act(async () => {
            pending[1].resolve({ suggestions: [{ id: 9, name: 'Kubernetes', source: 'library' }] });
        });
        await act(async () => {
            pending[0].resolve({ suggestions: [{ id: 8, name: 'Kubectl', source: 'ai' }] });
        });

        expect(screen.getByText('Kubernetes')).toBeInTheDocument();
        expect(screen.queryByText('Kubectl')).not.toBeInTheDocument();
    });

    it('keeps the spinner up when an abandoned lookup settles under a newer one', async () => {
        // The cancelled request's .finally used to clear the shared loading
        // flag, taking down the spinner for the request still in flight.
        render(<Harness />);

        fireEvent.change(skillInput(), { target: { value: 'Kub' } });
        act(() => { vi.advanceTimersByTime(300); });
        fireEvent.change(skillInput(), { target: { value: 'Kubernetes' } });
        act(() => { vi.advanceTimersByTime(300); });

        await act(async () => { pending[0].reject(); });

        expect(screen.getByText('Searching…')).toBeInTheDocument();
    });

    it('takes down the dropdown when the query falls below the minimum length', async () => {
        render(<Harness />);

        fireEvent.change(skillInput(), { target: { value: 'Kub' } });
        act(() => { vi.advanceTimersByTime(300); });
        expect(screen.getByText('Searching…')).toBeInTheDocument();

        fireEvent.change(skillInput(), { target: { value: 'K' } });
        await act(async () => { pending[0].resolve({ suggestions: [{ id: 9, name: 'Kubernetes', source: 'library' }] }); });

        expect(screen.queryByText('Searching…')).not.toBeInTheDocument();

        // The abandoned answer must not resurface under the next query either.
        fireEvent.change(skillInput(), { target: { value: 'Ku' } });
        expect(screen.queryByText('Kubernetes')).not.toBeInTheDocument();
    });
});

describe('Skill selection', () => {
    it('keeps both skills when two chips are clicked before a re-render', () => {
        // Built from the render-scoped `data`, the second click started from
        // the same snapshot as the first and dropped it.
        render(<Harness />);

        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Teamwork' }));
            fireEvent.click(screen.getByRole('button', { name: 'Communication' }));
        });

        expect(screen.getByRole('button', { name: 'Teamwork' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Communication' })).toHaveAttribute('aria-pressed', 'true');
    });
});

describe('Server validation errors', () => {
    it('shows the error for a field the form renders but never reported on', () => {
        render(<Harness errors={{ salary_range: 'The salary range must not be greater than 100 characters.' }} />);

        expect(screen.getByText('The salary range must not be greater than 100 characters.')).toBeInTheDocument();
    });

    it('shows a rejected skill row, which comes back keyed per index', () => {
        render(<Harness errors={{ 'skills.0.id': 'The selected skill is invalid.' }} />);

        expect(screen.getByText('The selected skill is invalid.')).toBeInTheDocument();
    });
});
