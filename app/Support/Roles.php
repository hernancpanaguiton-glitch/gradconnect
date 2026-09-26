<?php

namespace App\Support;

/**
 * The platform's role vocabulary.
 *
 * Role names here are the Spatie role names stored in the `roles` table
 * (see RolePermissionSeeder), so the registration form, the sidebar and the
 * audience pickers all speak one language. The matching display labels live
 * in resources/js/lib/roles.ts.
 */
final class Roles
{
    public const ADMIN = 'admin';

    public const ALUMNI = 'alumni';

    public const ALUMNI_AFFAIRS = 'alumni_affairs';

    public const DEPARTMENT_HEAD = 'department_head';

    public const INDUSTRY_PARTNER = 'industry_partner';

    public const SAO = 'sao';

    public const STUDENT = 'student';

    /**
     * Display label per role.
     *
     * @var array<string, string>
     */
    public const LABELS = [
        self::STUDENT => 'Graduate Student',
        self::ALUMNI => 'Alumni',
        self::INDUSTRY_PARTNER => 'Industry Partner',
        self::SAO => 'Student Affairs Office',
        self::ALUMNI_AFFAIRS => 'Alumni Affairs Office',
        self::DEPARTMENT_HEAD => 'Department Head',
        self::ADMIN => 'Admin',
    ];

    /**
     * Roles offered on the public registration form, in display order.
     *
     * @var array<int, string>
     */
    public const REGISTRABLE = [
        self::STUDENT,
        self::ALUMNI,
        self::INDUSTRY_PARTNER,
        self::SAO,
        self::ALUMNI_AFFAIRS,
        self::DEPARTMENT_HEAD,
        self::ADMIN,
    ];

    /**
     * Roles that become active on sign-up. Everyone else waits for an
     * administrator to approve the account.
     *
     * @var array<int, string>
     */
    public const SELF_SERVICE = [
        self::STUDENT,
        self::ALUMNI,
    ];

    /**
     * Core roles the app's own gating depends on; they cannot be deleted.
     *
     * @var array<int, string>
     */
    public const PROTECTED = [
        self::ADMIN,
        self::ALUMNI,
        self::STUDENT,
        self::INDUSTRY_PARTNER,
        self::ALUMNI_AFFAIRS,
        self::DEPARTMENT_HEAD,
        self::SAO,
    ];

    /**
     * Staff (office) roles, as opposed to graduates and employers.
     *
     * @var array<int, string>
     */
    public const STAFF = [
        self::ALUMNI_AFFAIRS,
        self::DEPARTMENT_HEAD,
        self::SAO,
        self::ADMIN,
    ];

    /**
     * Roles that hold a single college (used by the department head scope).
     *
     * @var array<int, string>
     */
    public const DEPARTMENT_SCOPED = [
        self::DEPARTMENT_HEAD,
    ];

    /**
     * Form values accepted from older clients, mapped to the current names.
     * The registration form sent these before the vocabularies were merged;
     * keep them for one release so a stale open tab still submits.
     *
     * @var array<string, string>
     */
    public const LEGACY_ALIASES = [
        'dean' => self::DEPARTMENT_HEAD,
        'alumni_officer' => self::ALUMNI_AFFAIRS,
    ];

    /**
     * Human-readable label for a role name, falling back to a humanized
     * version for roles an administrator created.
     */
    public static function label(?string $role): string
    {
        if ($role === null || $role === '') {
            return '';
        }

        return self::LABELS[$role] ?? str($role)->replace('_', ' ')->title()->value();
    }

    /**
     * Resolve a legacy form value to its current role name.
     */
    public static function canonical(?string $role): ?string
    {
        if ($role === null) {
            return null;
        }

        return self::LEGACY_ALIASES[$role] ?? $role;
    }

    public static function isSelfService(string $role): bool
    {
        return in_array($role, self::SELF_SERVICE, true);
    }
}
