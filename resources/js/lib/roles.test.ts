import {
    AUDIENCE_ROLES,
    REGISTRATION_ROLES,
    ROLE_LABELS,
    SELF_SERVICE_ROLES,
    requiresApproval,
    roleAudienceLabel,
    roleLabel,
} from '@/lib/roles';
import { describe, expect, it } from 'vitest';

describe('role vocabulary', () => {
    it('offers exactly the seven roles the institution registers', () => {
        expect(REGISTRATION_ROLES.map(roleLabel)).toEqual([
            'Graduate Student',
            'Alumni',
            'Industry Partner',
            'Student Affairs Office',
            'Alumni Affairs Office',
            'Department Head',
            'Admin',
        ]);
    });

    it('labels every registrable and audience role', () => {
        [...REGISTRATION_ROLES, ...AUDIENCE_ROLES].forEach((role) => {
            expect(ROLE_LABELS[role], `no label for "${role}"`).toBeTruthy();
        });
    });

    it('lets only graduates in without approval', () => {
        expect(SELF_SERVICE_ROLES).toEqual(['student', 'alumni']);

        expect(requiresApproval('student')).toBe(false);
        expect(requiresApproval('alumni')).toBe(false);
    });

    it('holds every staff role, and admin, for approval', () => {
        // An account that could approve itself would be a privilege escalation.
        ['industry_partner', 'sao', 'alumni_affairs', 'department_head', 'admin'].forEach((role) => {
            expect(requiresApproval(role), `${role} should need approval`).toBe(true);
        });
    });

    it('reads a student as a graduate student, not a student', () => {
        expect(roleLabel('student')).toBe('Graduate Student');
    });

    it('spells out the offices rather than their abbreviations', () => {
        // Humanising the raw name gave "Sao".
        expect(roleLabel('sao')).toBe('Student Affairs Office');
        expect(roleLabel('alumni_affairs')).toBe('Alumni Affairs Office');
    });

    it('pluralises an audience', () => {
        expect(roleAudienceLabel('student')).toBe('Graduate Students');
        expect(roleAudienceLabel('department_head')).toBe('Department Heads');
    });

    it('humanises a role an administrator invented', () => {
        expect(roleLabel('research_office')).toBe('Research Office');
    });

    it('returns nothing for a missing role rather than "undefined"', () => {
        expect(roleLabel(null)).toBe('');
        expect(roleLabel(undefined)).toBe('');
        expect(roleAudienceLabel('')).toBe('');
    });
});
