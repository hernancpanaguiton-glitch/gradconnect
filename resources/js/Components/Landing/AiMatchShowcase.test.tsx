import AiMatchShowcase from '@/Components/Landing/AiMatchShowcase';
import { MatchShowcaseItem } from '@/types';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ITEMS: MatchShowcaseItem[] = [
    {
        college_code: 'CCS',
        college_name: 'College of Computer Studies',
        short_label: 'Computer Studies',
        job_title: 'Junior Software Developer',
        match: 91,
        employer_type: 'IT services company',
        location: 'Cebu City',
        salary_min: 25000,
        salary_max: 35000,
        skills: [
            { name: 'JavaScript', match: 92 },
            { name: 'React', match: 88 },
            { name: 'SQL', match: 84 },
            { name: 'Git', match: 80 },
        ],
    },
    {
        college_code: 'CON',
        college_name: 'College of Nursing',
        short_label: 'Nursing',
        job_title: 'Staff Nurse',
        match: 90,
        employer_type: 'Private tertiary hospital',
        location: 'Mandaue City',
        salary_min: 20000,
        salary_max: 28000,
        skills: [
            { name: 'Patient Assessment', match: 93 },
            { name: 'Infection Control', match: 88 },
            { name: 'IV Therapy', match: 84 },
            { name: 'Wound Care', match: 78 },
        ],
    },
];

/** The component reads prefers-reduced-motion on mount. */
function mockReducedMotion(matches: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
}

describe('AiMatchShowcase', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockReducedMotion(false);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function advance(ms: number) {
        act(() => {
            vi.advanceTimersByTime(ms);
        });
    }

    it('shows the first college and a chip for each one', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        expect(screen.getByText('Junior Software Developer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Computer Studies/ })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /Nursing/ })).toHaveAttribute('aria-pressed', 'false');
    });

    it('rotates to the next college on its own', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        advance(5000);

        expect(screen.getByText('Staff Nurse')).toBeInTheDocument();
    });

    it('shows the college a visitor picks', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        fireEvent.click(screen.getByRole('button', { name: /Nursing/ }));

        expect(screen.getByText('Staff Nurse')).toBeInTheDocument();
        expect(screen.getByText('Private tertiary hospital')).toBeInTheDocument();
    });

    it('stops rotating once paused', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
        advance(15000);

        expect(screen.getByText('Junior Software Developer')).toBeInTheDocument();
    });

    it('pauses while the pointer is over the card', () => {
        const { container } = render(<AiMatchShowcase items={ITEMS} />);

        fireEvent.mouseEnter(container.firstChild as HTMLElement);
        advance(15000);

        expect(screen.getByText('Junior Software Developer')).toBeInTheDocument();
    });

    it('does not rotate when the visitor prefers reduced motion', () => {
        mockReducedMotion(true);
        render(<AiMatchShowcase items={ITEMS} />);

        advance(15000);

        expect(screen.getByText('Junior Software Developer')).toBeInTheDocument();
        // Nothing is moving, so there is nothing to pause.
        expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
    });

    it('formats the salary the way local job ads do', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        expect(screen.getByText('₱25K–35K/mo')).toBeInTheDocument();
    });

    it('says the example is illustrative rather than a live posting', () => {
        render(<AiMatchShowcase items={ITEMS} />);

        expect(screen.getByText(/Illustrative example/i)).toBeInTheDocument();
    });

    it('renders nothing when there is no showcase data', () => {
        const { container } = render(<AiMatchShowcase items={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('does not rotate a single college', () => {
        render(<AiMatchShowcase items={[ITEMS[0]]} />);

        advance(15000);

        expect(screen.getByText('Junior Software Developer')).toBeInTheDocument();
    });
});
