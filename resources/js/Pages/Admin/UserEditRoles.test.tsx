import UserEdit from '@/Pages/Admin/UserEdit';
import { lastVisit, recordedVisits, resetInertiaMock } from '@/tests/inertiaMock';
import { sharedProps } from '@/tests/factories';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const ROLES = [
    { id: 1, name: 'student' },
    { id: 2, name: 'alumni' },
    { id: 3, name: 'department_head' },
    { id: 4, name: 'sao' },
];

const USER = {
    id: 9,
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    name: 'Juan Dela Cruz',
    email: 'juan@example.test',
    id_number: null,
    status: 'active' as const,
    department_id: null,
    roles: [{ id: 1, name: 'student' }],
};

function renderPage() {
    return render(<UserEdit {...sharedProps()} user={USER} roles={ROLES} colleges={[]} />);
}

describe('Admin user roles', () => {
    beforeEach(() => resetInertiaMock());

    it('keeps both roles when two are ticked before the next render', () => {
        // Each handler used to derive from its own render's snapshot, so two
        // ticks in one tick both started from ["student"] and the second
        // dropped the first — the checkbox visibly un-ticked itself.
        renderPage();

        act(() => {
            fireEvent.click(screen.getByRole('checkbox', { name: /Department Head/i }));
            fireEvent.click(screen.getByRole('checkbox', { name: /Student Affairs Office/i }));
        });

        expect(screen.getByRole('checkbox', { name: /Department Head/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /Student Affairs Office/i })).toBeChecked();
    });

    it('sends every ticked role when saved', () => {
        renderPage();

        act(() => {
            fireEvent.click(screen.getByRole('checkbox', { name: /Department Head/i }));
            fireEvent.click(screen.getByRole('checkbox', { name: /Student Affairs Office/i }));
        });
        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        expect(lastVisit()?.data?.roles).toEqual(
            expect.arrayContaining(['student', 'department_head', 'sao'])
        );
    });

    it('unticks a role that was already held', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: /Graduate Student/i }));
        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        expect(lastVisit()?.data?.roles).toEqual([]);
    });

    it('labels a role by its display name rather than its raw key', () => {
        renderPage();

        expect(screen.getByRole('checkbox', { name: 'Student Affairs Office' })).toBeInTheDocument();
        expect(screen.queryByText('sao')).not.toBeInTheDocument();
    });

    it('submits once per save', () => {
        renderPage();

        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        expect(recordedVisits()).toHaveLength(1);
    });
});
