/**
 * [REPLACE] List of Modules (Table 20 in the proposal), in the Appendix R
 * layout: proponent × module × units, with a ✔ per user role.
 *
 * Built from the route snapshot, so every unit is a real route and every
 * module listed exists in the application.
 */
import { body, simpleTable, tableCaption, tag, TEXT_WIDTH_LANDSCAPE } from '../lib/format.mjs';
import { ROLE_LABELS, ROLE_ORDER, rolesForRoute, unitLabel } from '../lib/access.mjs';

const ASSIGN = '«ASSIGN PROGRAMMER»';

/**
 * Modules added since the proposal, divided among all four proponents: each
 * goes to the member whose proposal modules it sits closest to.
 */
export const ASSIGNED = {
    'Global Search': 'Hernan C. Panaguiton',
    'Account Settings and Data Export': 'Hernan C. Panaguiton',
    'Skill Gap Analysis': 'James Calib R. Gumadlas',
    'Learning Resources': 'James Calib R. Gumadlas',
    'Announcements': 'Edrian L. Quiño',
    'Events': 'Edrian L. Quiño',
    'Alumni Community': 'Edrian L. Quiño',
    'Talent Search': 'Kent Noel L. Rodriguez',
    'Messaging': 'Kent Noel L. Rodriguez',
};
const WIDTHS = [1700, 3200, ...ROLE_ORDER.map(() => 1040)];
const ORDER = ['View list', 'View details', 'Create', 'Update', 'Delete'];

/** Group by feature, then the standard actions first, then the rest A–Z. */
const byLabel = (a, b) => {
    const [fa, xa] = a.includes(': ') ? a.split(': ') : ['', a];
    const [fb, xb] = b.includes(': ') ? b.split(': ') : ['', b];
    if (fa !== fb) return fa.localeCompare(fb);

    const ia = ORDER.indexOf(xa);
    const ib = ORDER.indexOf(xb);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);

    return xa.localeCompare(xb);
};

/** The feature a controller provides, as a panel member would name it. */
const FEATURE = {
    'Auth/AuthenticatedSession': 'Session', 'Auth/RegisteredUser': 'Registration',
    'Auth/EmailVerificationPrompt': 'Email verification', 'Auth/EmailVerificationNotification': 'Email verification',
    'Auth/VerifyEmail': 'Email verification', 'Auth/PasswordResetLink': 'Password reset link',
    'Auth/NewPassword': 'New password', 'Auth/ConfirmablePassword': 'Password confirmation', 'Auth/Password': 'Password',
    Reports: 'Reports hub', EmployabilityReport: 'Employability report', ProgramOutcomes: 'Program outcomes',
    GraduateProfile: 'Graduate profile', EducationRecord: 'Education record', Profile: 'Account profile', Skill: 'Skills',
    Resume: 'Résumé', ResumeBuilder: 'Résumé builder', JobRecommendation: 'Job recommendations',
    ResumeAnalysis: 'Résumé analysis', MatchFeedback: 'Match feedback', 'Api/JobMatch': 'Matching',
    Survey: 'Survey', SurveyResponse: 'Survey response', JobPosting: 'Job posting', Company: 'Company',
    JobAssist: 'AI job assist', Candidate: 'Candidate', CandidateMatch: 'Candidate matches',
    EmployerFeedback: 'Employer feedback', Clearance: 'Clearance', StudentCase: 'Student concern',
    Scholarship: 'Scholarship', Settings: 'Settings', AccountDataExport: 'Data export',
};

/**
 * Controllers whose method names describe their action poorly: Laravel's
 * sign-in controllers reuse resource names, so `store` on the session means
 * "log in" and `destroy` means "log out". These labels stand on their own,
 * so they are not prefixed with the feature name.
 */
const ACTION = {
    'Auth/AuthenticatedSession': { create: 'Log in', store: 'Log in', destroy: 'Log out' },
    'Auth/RegisteredUser': { create: 'Register', store: 'Register' },
    'Auth/EmailVerificationPrompt': { __invoke: 'Show verification notice' },
    'Auth/EmailVerificationNotification': { store: 'Resend verification email' },
    'Auth/VerifyEmail': { __invoke: 'Verify email' },
    'Auth/PasswordResetLink': { create: 'Request reset link', store: 'Request reset link' },
    'Auth/NewPassword': { create: 'Set new password', store: 'Set new password' },
    'Auth/ConfirmablePassword': { show: 'Confirm password', store: 'Confirm password' },
    'Auth/Password': { update: 'Change password' },
    AccountDataExport: { export: 'Download own data', __invoke: 'Download own data' },
    GlobalSearch: { index: 'Search', __invoke: 'Search' },
    // Single-page features, where a generic "View list" would mislead.
    Dashboard: { index: 'View dashboard', __invoke: 'View dashboard' },
    PlatformStatus: { index: 'View platform status' },
    TalentSearch: { index: 'Search graduates' },
    SkillGap: { index: 'View skill gaps', __invoke: 'View skill gaps' },
    CareerProgression: { index: 'View employment history', __invoke: 'View employment history' },
    CareerReadiness: { index: 'View readiness results' },
    ResumeAnalysis: { index: 'View résumé analysis', __invoke: 'View résumé analysis' },
    ResumeBuilder: { index: 'Open résumé builder', store: 'Build résumé from profile' },
    JobRecommendation: { index: 'View job recommendations' },
    Reports: { index: 'View reports hub' },
    EmployabilityReport: { index: 'View employability report', export: 'Export employability report' },
    ProgramOutcomes: { index: 'View program outcomes', export: 'Export program outcomes' },
    Settings: { index: 'View account settings', updateNotifications: 'Update notification preferences' },
    Notification: { index: 'View notifications' },
};

/**
 * Units of one module: label → set of role keys. Routes merge only when they
 * are the same action of the same feature (e.g. create and store); in a
 * module of several features each unit is prefixed with its feature, so
 * "View list" never stands for three different lists.
 */
export function moduleUnits(module, routes, nav, perms) {
    const units = new Map();
    const several = module.controllers.length > 1;

    for (const route of routes.filter((r) => module.controllers.includes(r.controller))) {
        const named = ACTION[route.controller]?.[route.action];
        const action = named ?? unitLabel(route.action);
        const label = several && !named ? `${FEATURE[route.controller] ?? route.controller}: ${action}` : action;
        if (!units.has(label)) units.set(label, new Set());
        for (const role of rolesForRoute(route, nav, perms, module)) units.get(label).add(role);
    }

    return [...units.entries()].sort(([a], [b]) => byLabel(a, b));
}

export const modulesSection = {
    id: 'modules',
    landscape: true,
    build(ctx) {
        const modules = ctx.data('modules.json');
        const routes = ctx.data('routes.json');
        const nav = ctx.data('nav.json');
        const perms = ctx.data('role-permissions.json');
        const perUser = Object.fromEntries(ROLE_ORDER.map((r) => [r, 0]));
        const rows = [];

        for (const module of modules) {
            const units = moduleUnits(module, routes, nav, perms);
            const used = new Set(units.flatMap(([, roles]) => [...roles]));

            rows.push([module.owner ?? ASSIGNED[module.module] ?? ASSIGN, `**${module.module}**`, ...ROLE_ORDER.map(() => '')]);
            units.forEach(([label, roles], i) => {
                rows.push(['', `${i + 1}. ${label}`, ...ROLE_ORDER.map((r) => (roles.has(r) ? '✔' : ''))]);
            });
            rows.push(['', 'No. of Points (1 point per module per user)', ...ROLE_ORDER.map((r) => (used.has(r) ? '1' : ''))]);

            for (const r of used) perUser[r]++;
        }

        // Appendix R defines the total as the sum of every user's points.
        const total = ROLE_ORDER.reduce((sum, r) => sum + perUser[r], 0);
        rows.push(['', '**Number of Modules per User** (equals total no. of points per user)', ...ROLE_ORDER.map((r) => String(perUser[r]))]);
        rows.push(['', '**Total Number of Modules**', String(total), ...ROLE_ORDER.slice(1).map(() => '')]);

        return [
            tag('REPLACE', 'List of Modules', '103'),
            body(
                `The following table lists the ${modules.length} modules of GradConnect as built, grouped by the proponent `
                + 'responsible for each, with every unit and the user roles that can use it. A role is marked when the '
                + 'application allows it: by the route’s role or permission rule, by the access check inside the '
                + 'feature, or, where the code sets no rule, by the pages in that role’s menu. Modules added since '
                + 'the proposal have no proponent yet; their Proponents cell is highlighted for the Project Manager to assign.',
            ),
            ...tableCaption(ctx.tables.next(), 'List of Modules'),
            simpleTable(['Proponents', 'Modules', ...ROLE_LABELS], rows, WIDTHS, TEXT_WIDTH_LANDSCAPE),
        ];
    },
};
