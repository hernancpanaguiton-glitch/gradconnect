import ScrollTabs from '@/Components/ScrollTabs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const TABS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'education', label: 'Education (1)' },
    { key: 'employment', label: 'Employment (0)' },
    { key: 'skills', label: 'Skills (7)' },
] as const;

describe('ScrollTabs', () => {
    it('marks only the active tab as selected', () => {
        render(<ScrollTabs tabs={TABS} active="education" onChange={vi.fn()} />);

        expect(screen.getByRole('tab', { name: 'Education (1)' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'Basic Info' })).toHaveAttribute('aria-selected', 'false');
    });

    it('reports the tab that was chosen', () => {
        const onChange = vi.fn();
        render(<ScrollTabs tabs={TABS} active="basic" onChange={onChange} />);

        fireEvent.click(screen.getByRole('tab', { name: 'Skills (7)' }));

        expect(onChange).toHaveBeenCalledWith('skills');
    });

    it('scrolls sideways rather than widening the page', () => {
        // Four labelled tabs need more width than a 375px phone has. As a
        // plain row they pushed the whole page sideways, which clipped the
        // form fields on every tab.
        const { container } = render(<ScrollTabs tabs={TABS} active="basic" onChange={vi.fn()} />);

        const scroller = container.firstChild as HTMLElement;
        expect(scroller.className).toContain('overflow-x-auto');
        expect(screen.getByRole('tablist').className).toContain('min-w-max');
    });

    it('keeps every label on one line', () => {
        render(<ScrollTabs tabs={TABS} active="basic" onChange={vi.fn()} />);

        screen.getAllByRole('tab').forEach((tab) => {
            expect(tab.className).toContain('whitespace-nowrap');
        });
    });
});
