import LearningResourceCreate from '@/Pages/LearningResources/Create';
import LearningResourceEdit from '@/Pages/LearningResources/Edit';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

/**
 * Exactly what LearningResourceController::departmentGroups() returns —
 * colleges each holding their programs, plus an "Unassigned" bucket for a
 * program whose college was removed.
 */
const DEPARTMENT_GROUPS = [
    {
        id: 1,
        name: 'College of Computer Studies',
        programs: [
            { id: 2, name: 'BS Computer Science' },
            { id: 3, name: 'BS Information Technology' },
        ],
    },
    { id: 4, name: 'College of Nursing', programs: [{ id: 5, name: 'BS Nursing' }] },
    { id: null, name: 'Unassigned', programs: [{ id: 9, name: 'BS Orphaned Program' }] },
];

const SKILLS = [
    { id: 1, name: 'React', category: 'Computing & IT' },
    { id: 2, name: 'Wound Care', category: 'Nursing & Healthcare' },
];

const RESOURCE = {
    id: 7,
    title: 'Intro to React',
    description: 'A short course.',
    type: 'course',
    url: 'https://example.test/react',
    provider: 'Example',
    department_id: 3,
    skills: [{ id: 1, name: 'React' }],
};

describe('Learning resource form', () => {
    it('renders the create page from the payload the controller actually sends', () => {
        // Regression: the page destructured a `departments` prop that no
        // controller sends — the controller sends `departmentGroups`. Reading
        // .map on undefined threw during render, so "+ New Resource"
        // white-screened the app on the first click.
        expect(() =>
            render(<LearningResourceCreate departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />)
        ).not.toThrow();

        expect(screen.getByRole('option', { name: 'BS Computer Science' })).toBeInTheDocument();
    });

    it('renders the edit page from the same payload', () => {
        expect(() =>
            render(
                <LearningResourceEdit resource={RESOURCE} departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />
            )
        ).not.toThrow();

        expect(screen.getByDisplayValue('Intro to React')).toBeInTheDocument();
    });

    it('groups every program under its college', () => {
        render(<LearningResourceCreate departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />);

        const groups = Array.from(document.querySelectorAll('optgroup'));

        expect(groups.map((group) => group.label)).toEqual([
            'College of Computer Studies',
            'College of Nursing',
            'Unassigned',
        ]);
        expect(groups[0].querySelectorAll('option')).toHaveLength(2);
    });

    it('keeps a program whose college was removed selectable', () => {
        render(<LearningResourceCreate departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />);

        expect(screen.getByRole('option', { name: 'BS Orphaned Program' })).toBeInTheDocument();
    });

    it('offers "Everyone" so a resource need not be restricted', () => {
        render(<LearningResourceCreate departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />);

        const everyone = screen.getByRole('option', { name: 'Everyone' }) as HTMLOptionElement;

        expect(everyone.value).toBe('');
        expect(everyone.selected).toBe(true);
    });

    it('preselects the program an existing resource is restricted to', () => {
        // A select whose value is not among its options renders blank and
        // silently submits the wrong thing.
        render(<LearningResourceEdit resource={RESOURCE} departmentGroups={DEPARTMENT_GROUPS} skills={SKILLS} />);

        const select = screen
            .getByRole('option', { name: 'BS Information Technology' })
            .closest('select') as HTMLSelectElement;

        expect(select.value).toBe('3');
        expect(select.selectedOptions[0].textContent).toBe('BS Information Technology');
    });
});
