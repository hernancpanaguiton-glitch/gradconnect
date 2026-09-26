import SkillCategoryPicker, { PickerSkill } from '@/Components/SkillCategoryPicker';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const SKILLS: PickerSkill[] = [
    { id: 1, name: 'React', category: 'Computing & IT' },
    { id: 2, name: 'PostgreSQL', category: 'Computing & IT' },
    { id: 3, name: 'Wound Care', category: 'Nursing & Healthcare' },
    { id: 4, name: 'Patient Assessment', category: 'Nursing & Healthcare' },
    { id: 5, name: 'Communication', category: 'Soft Skills' },
    { id: 6, name: 'Bridge Watchkeeping', category: 'Maritime — Navigation' },
    { id: 7, name: 'Something Odd', category: null },
];

function renderPicker(props: Partial<React.ComponentProps<typeof SkillCategoryPicker>> = {}) {
    const onToggle = vi.fn();
    const result = render(
        <SkillCategoryPicker skills={SKILLS} selectedIds={[]} onToggle={onToggle} {...props} />
    );

    return { onToggle, ...result };
}

/** The <details> for a named category. */
function group(name: string): HTMLDetailsElement {
    const summary = screen.getByText(name, { selector: 'summary' });

    return summary.closest('details') as HTMLDetailsElement;
}

/** What a browser does when a <summary> is activated. */
function toggleGroup(name: string) {
    const details = group(name);
    details.open = !details.open;
    fireEvent(details, new Event('toggle', { bubbles: false }));
}

function openCategories(): string[] {
    return Array.from(document.querySelectorAll('details'))
        .filter((details) => (details as HTMLDetailsElement).open)
        .map((details) => details.querySelector('summary')?.firstChild?.textContent?.trim() ?? '');
}

describe('SkillCategoryPicker', () => {
    it('survives a category being opened', () => {
        // Regression: the toggle handler read event.currentTarget inside a
        // setState updater. React clears currentTarget once the handler
        // returns and the updater runs later, so this threw and unmounted
        // the whole page — a white screen on the graduate's Skills tab and
        // on the employer's job posting form.
        renderPicker({ openCategory: 'Computing & IT' });

        // Open it, then close it: the throw needs a state update already
        // queued, so the updater runs after the handler has returned and
        // React has cleared the event.
        expect(() => {
            toggleGroup('Nursing & Healthcare');
            toggleGroup('Nursing & Healthcare');
        }).not.toThrow();

        // The page is still mounted rather than blank.
        expect(screen.getByLabelText('Filter skills')).toBeInTheDocument();
        expect(group('Nursing & Healthcare').open).toBe(false);
    });

    it('survives every category being toggled twice', () => {
        renderPicker({ openCategory: 'Computing & IT' });

        const names = Array.from(document.querySelectorAll('details > summary')).map(
            (summary) => summary.firstChild?.textContent?.trim() ?? ''
        );

        expect(() => {
            for (let pass = 0; pass < 2; pass++) {
                names.forEach(toggleGroup);
            }
        }).not.toThrow();

        expect(screen.getByLabelText('Filter skills')).toBeInTheDocument();
    });

    it('opens the viewer’s own college category and the shared soft skills', () => {
        renderPicker({ openCategory: 'Nursing & Healthcare' });

        expect(group('Nursing & Healthcare').open).toBe(true);
        expect(group('Soft Skills').open).toBe(true);
        expect(group('Computing & IT').open).toBe(false);
        expect(group('Maritime — Navigation').open).toBe(false);
    });

    it('opens a category that already holds a selected skill', () => {
        renderPicker({ openCategory: 'Computing & IT', selectedIds: [6] });

        expect(group('Maritime — Navigation').open).toBe(true);
    });

    it('groups skills with no category under Other', () => {
        renderPicker();

        expect(within(group('Other')).getByText('Something Odd')).toBeInTheDocument();
    });

    it('reports the skill that was clicked', () => {
        const { onToggle } = renderPicker({ openCategory: 'Computing & IT' });

        fireEvent.click(screen.getByText('React'));

        expect(onToggle).toHaveBeenCalledWith(1);
    });

    it('marks a selected skill as pressed', () => {
        renderPicker({ openCategory: 'Computing & IT', selectedIds: [1] });

        expect(screen.getByText('React')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('PostgreSQL')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows only matching groups while filtering, and opens them', () => {
        renderPicker({ openCategory: 'Computing & IT' });

        fireEvent.change(screen.getByLabelText('Filter skills'), { target: { value: 'wound' } });

        expect(screen.getByText('Wound Care')).toBeInTheDocument();
        expect(screen.queryByText('React')).not.toBeInTheDocument();
        // A match hidden inside a collapsed group reads as "no results".
        expect(group('Nursing & Healthcare').open).toBe(true);
    });

    it('restores the original open groups when the filter is cleared', () => {
        renderPicker({ openCategory: 'Computing & IT' });

        const before = openCategories();

        const filter = screen.getByLabelText('Filter skills');
        fireEvent.change(filter, { target: { value: 'a' } });
        // Filtering forces groups open; recording that would leave every
        // category expanded once the filter is cleared.
        openCategories().forEach(toggleGroup);
        fireEvent.change(filter, { target: { value: '' } });

        expect(openCategories()).toEqual(before);
    });

    it('says so when nothing matches', () => {
        renderPicker();

        fireEvent.change(screen.getByLabelText('Filter skills'), { target: { value: 'zzzz' } });

        expect(screen.getByText('No skills match "zzzz".')).toBeInTheDocument();
        expect(document.querySelectorAll('details')).toHaveLength(0);
    });
});
