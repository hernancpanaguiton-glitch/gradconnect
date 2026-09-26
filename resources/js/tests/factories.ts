import { User } from '@/types';

/**
 * Minimal fixtures for rendering page components.
 *
 * Every page's props extend PageProps, so each one needs an `auth` block even
 * when the test is about something else entirely.
 */
export function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        first_name: 'Ada',
        last_name: 'Lovelace',
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        status: 'active',
        roles: ['student'],
        permissions: [],
        ...overrides,
    } as User;
}

/** The shared props Inertia puts on every page. */
export function sharedProps(user: Partial<User> = {}) {
    return { auth: { user: makeUser(user) } };
}
