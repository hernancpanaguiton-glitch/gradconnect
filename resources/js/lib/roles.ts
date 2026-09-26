/**
 * The platform's role vocabulary, mirroring app/Support/Roles.php.
 *
 * Role keys are the Spatie role names stored on the user, so the
 * registration form, the sidebar and every audience picker read from the
 * same list instead of each keeping its own copy of the labels.
 */

export const ROLE_STUDENT = 'student';
export const ROLE_ALUMNI = 'alumni';
export const ROLE_INDUSTRY_PARTNER = 'industry_partner';
export const ROLE_SAO = 'sao';
export const ROLE_ALUMNI_AFFAIRS = 'alumni_affairs';
export const ROLE_DEPARTMENT_HEAD = 'department_head';
export const ROLE_ADMIN = 'admin';

/** Display label per role (singular, as shown for one person). */
export const ROLE_LABELS: Record<string, string> = {
    [ROLE_STUDENT]: 'Graduate Student',
    [ROLE_ALUMNI]: 'Alumni',
    [ROLE_INDUSTRY_PARTNER]: 'Industry Partner',
    [ROLE_SAO]: 'Student Affairs Office',
    [ROLE_ALUMNI_AFFAIRS]: 'Alumni Affairs Office',
    [ROLE_DEPARTMENT_HEAD]: 'Department Head',
    [ROLE_ADMIN]: 'Admin',
};

/** Label for a group of people in that role (announcement/survey audiences). */
export const ROLE_AUDIENCE_LABELS: Record<string, string> = {
    [ROLE_STUDENT]: 'Graduate Students',
    [ROLE_ALUMNI]: 'Alumni',
    [ROLE_INDUSTRY_PARTNER]: 'Industry Partners',
    [ROLE_SAO]: 'Student Affairs Office',
    [ROLE_ALUMNI_AFFAIRS]: 'Alumni Affairs Office',
    [ROLE_DEPARTMENT_HEAD]: 'Department Heads',
    [ROLE_ADMIN]: 'Admins',
};

/** Roles offered on the public registration form, in display order. */
export const REGISTRATION_ROLES: ReadonlyArray<string> = [
    ROLE_STUDENT,
    ROLE_ALUMNI,
    ROLE_INDUSTRY_PARTNER,
    ROLE_SAO,
    ROLE_ALUMNI_AFFAIRS,
    ROLE_DEPARTMENT_HEAD,
    ROLE_ADMIN,
];

/** Roles that become active on sign-up; the rest await admin approval. */
export const SELF_SERVICE_ROLES: ReadonlyArray<string> = [ROLE_STUDENT, ROLE_ALUMNI];

/** Audiences an announcement or survey can target. */
export const AUDIENCE_ROLES: ReadonlyArray<string> = [
    ROLE_STUDENT,
    ROLE_ALUMNI,
    ROLE_INDUSTRY_PARTNER,
    ROLE_SAO,
    ROLE_ALUMNI_AFFAIRS,
    ROLE_DEPARTMENT_HEAD,
    ROLE_ADMIN,
];

/** Humanize a role an administrator created, which has no fixed label. */
function humanize(role: string): string {
    return role
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function roleLabel(role: string | null | undefined): string {
    if (!role) {
        return '';
    }

    return ROLE_LABELS[role] ?? humanize(role);
}

export function roleAudienceLabel(role: string | null | undefined): string {
    if (!role) {
        return '';
    }

    return ROLE_AUDIENCE_LABELS[role] ?? humanize(role);
}

export function requiresApproval(role: string): boolean {
    return !SELF_SERVICE_ROLES.includes(role);
}
