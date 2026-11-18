/**
 * Which roles each unit of a module is available to, for the ✔ columns of
 * the List of Modules (Appendix R).
 *
 * The strongest evidence wins: guest pages, then the route's role or
 * permission middleware, then a gate inside the controller method, then the
 * sidebar menus. Menus decide only when the code itself sets no rule.
 */

/** Role keys in the manuscript's column order. */
export const ROLE_ORDER = ['student', 'alumni', 'industry_partner', 'alumni_affairs', 'sao', 'department_head', 'admin'];
export const ROLE_LABELS = ['Graduate Student', 'Alumni', 'Industry Partner', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head', 'Admin'];

const withPermission = (perms, name) => ROLE_ORDER.filter((r) => (perms[r] ?? []).includes(name));

/** Roles whose menus lead to the route's address, else to the module. */
function menuRoles(route, nav, module) {
    const uri = `/${route.uri.replace(/^\//, '')}`;
    const links = [...new Set(Object.values(nav).flat())];
    const best = links
        .filter((h) => uri === h || uri.startsWith(`${h}/`))
        .sort((a, b) => b.length - a.length)[0];

    if (best) return ROLE_ORDER.filter((r) => nav[r]?.includes(best));

    const hrefs = module?.navHrefs ?? [];
    if (hrefs.length) return ROLE_ORDER.filter((r) => (nav[r] ?? []).some((h) => hrefs.some((m) => h.startsWith(m))));

    // A signed-in feature with no menu entry (log out, verification) is everyone's.
    return [...ROLE_ORDER];
}

export function rolesForRoute(route, nav, perms, module) {
    if (route.guestOnly) return [...ROLE_ORDER];
    if (route.roleArg) return route.roleArg.split('|');
    if (route.permissionArg) return withPermission(perms, route.permissionArg);

    if (route.gate) {
        // Every clause must pass, so a role needs to satisfy all of them.
        const allowed = route.gate.clauses.map((c) => new Set([...c.roles, ...c.permissions.flatMap((p) => withPermission(perms, p))]));

        return ROLE_ORDER.filter((r) => allowed.every((set) => set.has(r)));
    }

    return menuRoles(route, nav, module);
}

const LABELS = {
    index: 'View list', show: 'View details', create: 'Create', store: 'Create',
    edit: 'Update', update: 'Update', destroy: 'Delete', __invoke: 'View page',
    // Method names a panel would not read as an action, worded from each
    // method's own doc comment.
    publicIndex: 'Browse jobs',
    rsvp: 'RSVP to an event',
    start: 'Start a conversation',
    storeAlias: 'Add alias', destroyAlias: 'Delete alias',
    storeComment: 'Add comment', destroyComment: 'Delete comment',
    resolve: 'Resolve a skill name', suggest: 'Suggest skills',
    titles: 'Suggest job titles (AI)',
    description: 'Draft job description (AI)',
    qualifications: 'Draft qualifications (AI)',
    candidates: 'View applicants',
    data: 'Quick-view candidate profile',
    resume: 'Download candidate résumé',
    rematchJob: 'Re-run matching for a job',
    jobStatus: 'View matching progress for a job',
    rematchProfile: 'Re-run matching for own profile',
    profileStatus: 'View matching progress for own profile',
    remind: 'Send reminder',
    results: 'View results',
};

export function unitLabel(method) {
    if (LABELS[method]) return LABELS[method];
    const words = method.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

    return words[0].toUpperCase() + words.slice(1);
}
