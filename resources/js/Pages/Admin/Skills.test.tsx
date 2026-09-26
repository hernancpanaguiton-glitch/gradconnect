import Skills from '@/Pages/Admin/Skills';
import { sharedProps } from '@/tests/factories';
import { lastVisit, resetInertiaMock } from '@/tests/inertiaMock';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Validation errors as Inertia hands them back to the form that failed. */
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

const COLLISION = 'That name is already a skill in its own right.';

function renderSkills() {
    return render(
        <Skills
            {...sharedProps()}
            skills={{ data: [{ id: 1, name: 'JavaScript', category: 'Computing & IT', aliases: [] }], links: [] }}
            filters={{ search: null }}
        />
    );
}

describe('Skill taxonomy alias form', () => {
    beforeEach(() => {
        resetInertiaMock();
        Object.keys(serverErrors).forEach((key) => delete serverErrors[key]);
    });

    it('shows why an alias was rejected instead of appearing to do nothing', () => {
        // The controller aborted 422, which Inertia turned into a full-screen
        // error page, and the form had nowhere to put a message anyway.
        serverErrors.alias = COLLISION;
        renderSkills();

        expect(screen.getByText(COLLISION)).toBeInTheDocument();
    });

    it('posts the alias for the skill it was typed against', () => {
        renderSkills();

        fireEvent.change(screen.getByPlaceholderText('Add alias (e.g. JS)'), { target: { value: 'JS' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(lastVisit()?.url).toContain('skill-taxonomy.aliases.store/1');
        expect(lastVisit()?.data?.alias).toBe('JS');
    });
});
