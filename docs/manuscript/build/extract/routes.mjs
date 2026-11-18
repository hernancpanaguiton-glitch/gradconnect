/**
 * Snapshot of the application's routes (data/routes.json), taken from
 * `php artisan route:list --json` on the host. Route listing boots the app
 * but runs no query, so it never touches the database.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gatesInBody, gatesInMethod } from './gates.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = fileURLToPath(new URL('../data/routes.json', import.meta.url));
const PHP = 'C:\\Users\\Carlie\\.config\\herd\\bin\\php84\\php.exe';
const PREFIX = 'App\\Http\\Controllers\\';
const MIN_ROUTES = 150;

const argAfter = (middleware, marker) => {
    const m = middleware.find((x) => x.includes(marker));

    return m ? m.split(marker)[1] : null;
};

export function normalizeRoute(r) {
    const [cls, method = '__invoke'] = r.action.split('@');
    const controller = cls.startsWith(PREFIX)
        ? cls.slice(PREFIX.length).replace(/\\/g, '/').replace(/Controller$/, '')
        : null;

    return {
        uri: r.uri,
        method: r.method,
        name: r.name,
        controller,
        action: controller ? method : null,
        roleArg: argAfter(r.middleware, 'RoleMiddleware:'),
        permissionArg: argAfter(r.middleware, 'PermissionMiddleware:'),
        auth: r.middleware.some((m) => m.includes('Middleware\\Authenticate')),
        guestOnly: r.middleware.some((m) => m.includes('RedirectIfAuthenticated')),
    };
}

const source = (relative) => {
    const path = `${REPO_ROOT}${relative}`;

    return existsSync(path) ? readFileSync(path, 'utf8') : null;
};

/**
 * Who owns the record in an owner-or-permission gate, where the code checks
 * "is this your own …?". The gate cannot name the owner's role, so it is
 * stated here, from what each record is: an application's posting belongs
 * to an industry partner; a community post belongs to whoever may post.
 */
const OWNERS = {
    'JobApplication@updateStatus': { roles: ['industry_partner'] },
    'Community@destroy': { permissions: ['community.participate'] },
    'Community@destroyComment': { permissions: ['community.participate'] },
};

/**
 * The role-narrowing requirements of the route's controller method, from
 * its own gates, its policy calls and its form request. Every clause must
 * pass. An owner-or-permission clause narrows to the permission holders plus
 * the owning role (OWNERS); without an OWNERS entry it narrows nothing and is
 * dropped. Null when nothing narrows by role.
 */
export function routeGate(route) {
    const php = source(`app/Http/Controllers/${route.controller}Controller.php`);
    if (!php) return null;

    const found = gatesInMethod(php, route.action);
    const clauses = [...found.clauses];

    for (const p of found.policies) {
        const policy = source(`app/Policies/${p.model}Policy.php`);
        if (policy) clauses.push(gatesInBody(policy, p.ability));
    }
    for (const r of found.requests) {
        const request = source(`app/Http/Requests/${r}.php`);
        if (request) clauses.push(gatesInBody(request, 'authorize'));
    }

    const owner = OWNERS[`${route.controller}@${route.action}`];
    const narrowing = clauses
        .filter((c) => (c.permissions.length || c.roles.length) && (!c.ownership || owner))
        .map(({ permissions, roles, ownership }) => (ownership
            ? { permissions: [...permissions, ...(owner.permissions ?? [])], roles: [...roles, ...(owner.roles ?? [])] }
            : { permissions, roles }));

    return narrowing.length ? { clauses: narrowing } : null;
}

export function extractRoutes() {
    const result = spawnSync(PHP, ['artisan', 'route:list', '--json'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(`route:list failed: ${result.stderr || result.error?.message}`);

    const routes = JSON.parse(result.stdout).map(normalizeRoute).map((r) => ({
        ...r,
        gate: r.controller ? routeGate(r) : null,
    }));
    if (routes.length < MIN_ROUTES) throw new Error(`expected at least ${MIN_ROUTES} routes, got ${routes.length}`);

    writeFileSync(OUT, `${JSON.stringify(routes, null, 2)}\n`);

    return routes;
}
