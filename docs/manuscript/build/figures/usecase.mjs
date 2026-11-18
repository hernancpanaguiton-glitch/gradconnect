/**
 * Use Case Diagram (Fig 20) and the ten System Use Case Models (Figs 21–30),
 * in UML notation. Actors and actions follow the routes, their role and
 * permission gates (data/routes.json, data/role-permissions.json) and the
 * controllers named beside each model.
 */
import { arrowHead, line, rect, svgDoc, text, textWidth, wrap } from '../lib/svg.mjs';

const ALL = ['Graduate Student', 'Alumni', 'Industry Partner', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head', 'Admin'];
const GRADS = ['Graduate Student', 'Alumni'];
const AI = 'AI Service (Groq / Gemini)';
const MAIL = 'Mail Service';

/**
 * Each case: [id, label, { actors?, include?: baseId, extend?: baseId }].
 * Cases with include/extend sit in the right column beside their base.
 */
export const USE_CASES = [
    {
        fig: 20, file: 'usecase-login-register', title: 'LOGIN / REGISTER', roles: ALL, actors: ['User'], secondary: ['Admin '],
        cases: [['reg', 'Register an account', { actors: ['User'] }], ['login', 'Log in', { actors: ['User'] }],
            ['forgot', 'Reset forgotten password', { actors: ['User'] }], ['approve', 'Approve pending account', { actors: ['Admin '] }]],
    },
    {
        fig: 21, file: 'usecase-login', title: 'LOG-IN PROCESS', actors: ['User (any role)'], secondary: [MAIL],
        cases: [['login', 'Log in with email and password', { actors: ['User (any role)'] }],
            ['valid', 'Validate credentials', { include: 'login' }],
            ['active', 'Check email verified and account active', { include: 'login' }],
            ['dash', 'Open the role’s dashboard', { include: 'login' }],
            ['forgot', 'Reset forgotten password', { extend: 'login', actors: [MAIL] }]],
    },
    {
        fig: 22, file: 'usecase-registration', title: 'REGISTRATION PROCESS', actors: ['Guest', 'Admin'], secondary: [MAIL],
        cases: [['reg', 'Register an account', { actors: ['Guest'] }],
            ['role', 'Choose role and college', { include: 'reg' }],
            ['verify', 'Confirm email address (Graduate Student, Alumni)', { extend: 'reg', actors: [MAIL] }],
            ['pending', 'Wait for approval (staff, Industry Partner)', { extend: 'reg' }],
            ['approve', 'Approve pending account', { actors: ['Admin'] }]],
    },
    {
        fig: 23, file: 'usecase-upload-resume', title: 'UPLOAD RÉSUMÉ', actors: GRADS, secondary: [AI],
        cases: [['upload', 'Upload résumé (PDF, Word or text)', { actors: GRADS }],
            ['extract', 'Extract the résumé’s text', { include: 'upload' }],
            ['embed', 'Generate résumé embedding', { include: 'upload', actors: [AI] }],
            ['primary', 'Set primary résumé', { actors: GRADS }], ['delete', 'Delete résumé', { actors: GRADS }],
            ['builder', 'Build résumé with the Résumé Builder', { actors: GRADS }],
            ['analysis', 'View résumé analysis', { actors: GRADS }]],
    },
    {
        fig: 24, file: 'usecase-job-postings', title: 'MANAGE JOB POSTINGS', actors: ['Industry Partner', 'Admin'], secondary: [AI],
        cases: [['create', 'Create job posting', { actors: ['Industry Partner'] }],
            ['assist', 'Get AI writing help (title, description, qualifications)', { extend: 'create', actors: [AI] }],
            ['edit', 'Edit job posting', { actors: ['Industry Partner'] }], ['delete', 'Delete job posting', { actors: ['Industry Partner'] }],
            ['cands', 'View applicants and update their status', { actors: ['Industry Partner'] }],
            ['matches', 'View AI candidate matches', { actors: ['Industry Partner'] }],
            ['moderate', 'Moderate job postings', { actors: ['Admin'] }]],
    },
    {
        fig: 25, file: 'usecase-user-accounts', title: 'MANAGE USER ACCOUNTS', actors: ['Admin'], secondary: [MAIL],
        cases: [['list', 'Search and view user accounts', { actors: ['Admin'] }],
            ['edit', 'Edit a user’s status and roles', { actors: ['Admin'] }],
            ['audit', 'Record the change in the audit log', { include: 'edit' }],
            ['approve', 'Approve a pending account', { extend: 'edit' }],
            ['notify', 'Notify the user of approval', { include: 'approve', actors: [MAIL] }],
            ['delete', 'Delete a user account', { actors: ['Admin'] }]],
    },
    {
        fig: 26, file: 'usecase-profile', title: 'MANAGE PROFILE', actors: ['User (any role)', ...GRADS],
        cases: [['account', 'Edit account details and password', { actors: ['User (any role)'] }],
            ['settings', 'Change notification preferences', { actors: ['User (any role)'] }],
            ['export', 'Export own data or delete own account', { actors: ['User (any role)'] }],
            ['grad', 'Edit graduate profile', { actors: GRADS }],
            ['edu', 'Add education records', { include: 'grad' }], ['emp', 'Add employment records', { include: 'grad' }],
            ['skills', 'Add skills', { include: 'grad' }]],
    },
    {
        fig: 27, file: 'usecase-dashboard', title: 'VIEW DASHBOARD', roles: ALL, actors: ['User'],
        cases: [['dash', 'View the role’s dashboard', { actors: ['User'] }],
            ['stats', 'View role-specific summaries and charts', { include: 'dash' }],
            ['notes', 'View recent notifications', { extend: 'dash' }]],
    },
    {
        fig: 28, file: 'usecase-ai-matches', title: 'VIEW AI JOB MATCHES', actors: [...GRADS, 'Industry Partner'], secondary: [AI],
        cases: [['recs', 'View AI job recommendations', { actors: GRADS }],
            ['score', 'Score graduate–job fit', { include: 'recs', actors: [AI] }],
            ['feedback', 'Rate a match helpful or not helpful', { extend: 'recs' }],
            ['apply', 'Apply for the job', { extend: 'recs' }],
            ['cands', 'View AI candidate matches for a posting', { actors: ['Industry Partner'] }]],
    },
    {
        fig: 29, file: 'usecase-skill-gap', title: 'VIEW SKILL GAP ANALYSIS', actors: GRADS,
        cases: [['gap', 'View skill gap analysis', { actors: GRADS }],
            ['compare', 'Compare own skills with job requirements', { include: 'gap' }],
            ['learn', 'Open suggested learning resources', { extend: 'gap' }],
            ['ready', 'Take career readiness assessment', { actors: ['Graduate Student'] }]],
    },
    {
        fig: 30, file: 'usecase-reports', title: 'GENERATE REPORTS',
        actors: ['Admin', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head'],
        cases: [['emp', 'View employability report', { actors: ['Admin', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head'] }],
            ['empx', 'Export as CSV', { extend: 'emp' }],
            ['po', 'View program outcomes report', { actors: ['Admin', 'Department Head'] }],
            ['pox', 'Export as CSV', { extend: 'po' }]],
    },
];

function hollowHead(x, y, dx, dy, size = 11) {
    const len = Math.hypot(dx, dy) || 1;
    const [ux, uy] = [dx / len, dy / len];
    const [bx, by] = [x - ux * size, y - uy * size];
    return `<polygon points="${x},${y} ${bx - uy * size * 0.6},${by + ux * size * 0.6} ${bx + uy * size * 0.6},${by - ux * size * 0.6}" fill="#fff" stroke="#000"/>`;
}

function stickman(x, y, name) {
    const lines = wrap(name, 110, 12);
    return `<circle cx="${x}" cy="${y - 26}" r="9" fill="#fff" stroke="#000"/>`
        + line(x, y - 17, x, y + 8) + line(x - 14, y - 8, x + 14, y - 8) + line(x, y + 8, x - 11, y + 26) + line(x, y + 8, x + 11, y + 26)
        + lines.map((l, i) => text(x, y + 40 + i * 14, l, { size: 12, anchor: 'middle' })).join('');
}

export function useCaseSvg(model) {
    const EW = 220;
    const EH = 54;
    const ROW = 74;
    const left = model.actors;
    const right = model.secondary ?? [];
    const roles = model.roles ?? [];
    const sysX = roles.length ? 300 : 170;
    const col = [sysX + 40, sysX + 40 + EW + 70];
    const sysW = 2 * EW + 150;
    const pos = new Map();
    model.cases.forEach(([id, , o], i) => pos.set(id, { x: o.include || o.extend ? col[1] : col[0], y: 80 + i * ROW }));
    const height = Math.max(80 + model.cases.length * ROW, 80 + left.length * 100, 40 + roles.length * 100) + 20;
    if (roles.length) {
        // Centre the cases (and so the User actor) on the column of roles.
        const ys = [...pos.values()].map((c) => c.y);
        const shift = height / 2 - (Math.min(...ys) + Math.max(...ys) + EH) / 2;
        for (const c of pos.values()) c.y += shift;
    }
    const width = sysX + sysW + (right.length ? 190 : 40);
    const p = [rect(sysX, 20, sysW, height - 30), text(sysX + sysW / 2, 42, `GradConnect: ${model.title}`, { size: 14, anchor: 'middle', weight: 'bold' })];

    const actorAt = (list, x) => new Map(list.map((a, i) => [a, { x, y: 20 + (height - 30) * ((i + 0.5) / list.length) }]));
    // An actor stands level with the middle of its use cases, at least 100px from the next one.
    const besideCases = (list, x) => {
        const placed = list.map((a) => {
            const ys = model.cases.filter(([, , o]) => (o.actors ?? []).includes(a)).map(([id]) => pos.get(id).y + EH / 2 + 6);
            return [a, ys.length ? ys.reduce((s, y) => s + y, 0) / ys.length : height / 2];
        }).sort((m, n) => m[1] - n[1]);
        for (let i = 1; i < placed.length; i++) placed[i][1] = Math.max(placed[i][1], placed[i - 1][1] + 100);
        return new Map(placed.map(([a, y]) => [a, { x, y: Math.max(y, 60) }]));
    };
    const la = besideCases(left, roles.length ? 205 : 70);
    const ga = actorAt(roles, 60);
    const ra = besideCases(right, sysX + sysW + 90);

    for (const [id, , o] of model.cases) {
        const c = pos.get(id);
        for (const a of o.actors ?? []) {
            if (la.has(a)) p.push(line(la.get(a).x + 16, la.get(a).y - 6, c.x, c.y + EH / 2));
            if (ra.has(a)) p.push(line(c.x + EW, c.y + EH / 2, ra.get(a).x - 16, ra.get(a).y - 6));
        }
        const base = o.include ?? o.extend;
        if (base) {
            const b = pos.get(base);
            // «include» points base → part; «extend» points extension → base.
            const [from, to] = o.include ? [b, c] : [c, b];
            const fx = from.x + (from.x === to.x ? EW / 2 : from.x < to.x ? EW : 0);
            const tx = to.x + (from.x === to.x ? EW / 2 : from.x < to.x ? 0 : EW);
            const fy = from.y + (from.x === to.x ? (from.y < to.y ? EH : 0) : EH / 2);
            const ty = to.y + (from.x === to.x ? (from.y < to.y ? 0 : EH) : EH / 2);
            const label = o.include ? '«include»' : '«extend»';
            p.push(line(fx, fy, tx, ty, { dash: '5 4' }), arrowHead(tx, ty, tx - fx, ty - fy, 9));
            // Label near the right-column ellipse, so labels sharing a base don't pile up.
            const t = o.include ? 0.68 : 0.32;
            const mx = fx + (tx - fx) * t;
            const my = fy + (ty - fy) * t;
            p.push(`<rect x="${mx - textWidth(label, 11) / 2 - 3}" y="${my - 8}" width="${textWidth(label, 11) + 6}" height="16" fill="#fff"/>`,
                text(mx, my, label, { size: 11, anchor: 'middle', style: 'italic' }));
        }
    }
    for (const [id, label] of model.cases) {
        const c = pos.get(id);
        const lines = wrap(label, EW - 30, 12);
        p.push(`<ellipse cx="${c.x + EW / 2}" cy="${c.y + EH / 2}" rx="${EW / 2}" ry="${EH / 2}" fill="#fff" stroke="#000"/>`);
        lines.forEach((l, i) => p.push(text(c.x + EW / 2, c.y + EH / 2 + (i - (lines.length - 1) / 2) * 15, l, { size: 12, anchor: 'middle' })));
    }
    // Generalization: each role is a kind of User (hollow triangle at User).
    const user = la.values().next().value;
    for (const [a, q] of ga) {
        const [sx, sy, tx, ty] = [q.x + 18, q.y - 6, user.x - 18, user.y - 6];
        const len = Math.hypot(tx - sx, ty - sy);
        p.push(line(sx, sy, tx - ((tx - sx) / len) * 11, ty - ((ty - sy) / len) * 11), hollowHead(tx, ty, tx - sx, ty - sy));
        p.push(stickman(q.x, q.y, a));
    }
    for (const [a, q] of la) p.push(stickman(q.x, q.y, a));
    for (const [a, q] of ra) p.push(stickman(q.x, q.y, a.trim()));

    return svgDoc(width, height, p.join(''));
}
