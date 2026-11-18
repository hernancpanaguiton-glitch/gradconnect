/**
 * Program Workflows (Figs 8–15). Login/Register follows
 * RegisteredUserController and the auth/verified/active middleware; each
 * role's workflow lists exactly the pages in that role's navigation
 * (data/nav.json, read from the running app).
 */
import ELK from 'elkjs/lib/elk.bundled.js';
import { arrowHead, line, polyline, rect, SHADE, svgDoc, text, textWidth, wrap } from '../lib/svg.mjs';
import { ROLE_LABELS, ROLE_ORDER } from '../lib/access.mjs';

const elk = new ELK();

/** Navigation path → module name shown in the workflow. Account pages are folded into one box. */
export const PAGE_LABELS = {
    '/admin/users': 'Manage User Accounts', '/admin/roles': 'Manage Roles and Permissions', '/admin/colleges': 'Manage Colleges',
    '/admin/jobs': 'Moderate Job Postings', '/surveys': 'Tracer Surveys', '/announcements': 'Announcements',
    '/reports/employability': 'Employability Report', '/reports': 'Reports', '/admin/audit-logs': 'Audit Logs',
    '/admin/platform-status': 'Platform Status', '/admin/backups': 'Backups', '/admin/settings': 'System Settings',
    '/skill-taxonomy': 'Skill Taxonomy', '/talent-search': 'Talent Search', '/learning-resources': 'Learning Resources',
    '/events': 'Events', '/community': 'Community', '/messages': 'Messages', '/reports/program-outcomes': 'Program Outcomes Report',
    '/career-readiness': 'Career Readiness', '/scholarships': 'Scholarships', '/clearance': 'Clearance', '/student-cases': 'Student Cases',
    '/company/edit': 'Company Profile', '/postings': 'Manage Job Postings', '/graduate/profile/edit': 'Graduate Profile',
    '/graduate/resumes': 'Upload Résumé', '/resume-analysis': 'Résumé Analysis', '/jobs': 'Job Opportunities',
    '/applications': 'My Applications', '/recommendations': 'AI Job Matches', '/skill-gap': 'Skill Gap Analysis',
    '/career-progression': 'Career Progression',
};
const ACCOUNT = ['/settings', '/notifications', '/profile', '/search'];

export function workflowModules(paths) {
    const pages = paths.filter((p) => p !== '/dashboard' && !ACCOUNT.includes(p));
    const missing = pages.filter((p) => !PAGE_LABELS[p]);
    if (missing.length) throw new Error(`No workflow label for ${missing.join(', ')}`);

    return [...pages.map((p) => PAGE_LABELS[p]), 'Account (Profile, Settings, Notifications, Search)'];
}

const terminator = (x, y, w, h, s) => rect(x, y, w, h, { radius: h / 2 }) + text(x + w / 2, y + h / 2, s, { size: 13, anchor: 'middle', weight: 'bold' });
function process(x, y, w, h, s, size = 13) {
    const lines = wrap(s, w - 14, size);
    return rect(x, y, w, h, { fill: '#fff' })
        + lines.map((l, i) => text(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * (size + 3), l, { size, anchor: 'middle' })).join('');
}
function decision(x, y, w, h, s) {
    const lines = wrap(s, w * 0.6, 12);
    return `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="${SHADE}" stroke="#000"/>`
        + lines.map((l, i) => text(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 15, l, { size: 12, anchor: 'middle' })).join('');
}
const SHAPES = { start: terminator, end: terminator, process, decision };
const SIZES = { start: [130, 40], end: [130, 40], process: [190, 54], decision: [170, 90] };

/** A general flowchart, laid out top to bottom by ELK. */
export async function flowchartSvg(nodes, edges) {
    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': '50', 'elk.layered.spacing.nodeNodeBetweenLayers': '46', 'elk.spacing.edgeLabel': '4',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.edgeLabels.placement': 'TAIL',
            'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            // Loops back (e.g. reset password → log in) point up, in the order nodes are listed.
            'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
        },
        children: nodes.map((n) => ({ id: n.id, width: SIZES[n.kind][0], height: SIZES[n.kind][1] })),
        edges: edges.map(([from, to, label], i) => ({
            id: `e${i}`, sources: [from], targets: [to],
            labels: label ? [{ text: label, width: textWidth(label, 12) + 6, height: 14 }] : [],
        })),
    };
    const out = await elk.layout(graph);
    const m = 20;
    const p = [];
    const kinds = new Map(nodes.map((n) => [n.id, n.kind]));
    const boxes = new Map(out.children.map((c) => [c.id, c]));
    for (const e of out.edges) {
        for (const s of e.sections) {
            const start = { ...s.startPoint };
            // ELK leaves a diamond from its bounding box; carry the first (vertical) leg up to the sloped edge.
            const src = boxes.get(e.sources[0]);
            if (kinds.get(e.sources[0]) === 'decision' && Math.abs(start.y - (src.y + src.height)) < 1) {
                start.y = src.y + src.height - Math.max(0, src.height / 2 - (Math.abs(start.x - (src.x + src.width / 2)) * src.height) / src.width);
            }
            const pts = [start, ...(s.bendPoints ?? []), s.endPoint].map((q) => ({ x: q.x + m, y: q.y + m }));
            const [a, b] = pts.slice(-2);
            p.push(polyline(pts), arrowHead(b.x, b.y, b.x - a.x, b.y - a.y));
        }
        for (const l of e.labels ?? []) {
            p.push(`<rect x="${l.x + m}" y="${l.y + m}" width="${l.width}" height="${l.height}" fill="#fff"/>`);
            p.push(text(l.x + m + 3, l.y + m + l.height / 2, l.text, { size: 12, style: 'italic' }));
        }
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const c of out.children) {
        const n = byId.get(c.id);
        p.push(SHAPES[n.kind](c.x + m, c.y + m, c.width, c.height, n.label));
    }

    return svgDoc(out.width + 2 * m, out.height + 2 * m, p.join(''));
}

/** Fig 8: from the landing page to a signed-in dashboard, as the controllers enforce it. */
export function loginRegisterSvg() {
    const n = (id, kind, label) => ({ id, kind, label });
    return flowchartSvg([
        n('start', 'start', 'Start'), n('landing', 'process', 'Open GradConnect landing page'),
        n('has', 'decision', 'Has an account?'),
        n('reg', 'process', 'Register: name, email, password, role and college'),
        n('self', 'decision', 'Graduate Student or Alumni?'),
        n('verify', 'process', 'Confirm email address from the link sent'),
        n('pending', 'process', 'Account pending; Admin is notified to approve'),
        n('login', 'process', 'Log in with email and password'),
        n('valid', 'decision', 'Credentials valid?'),
        n('forgot', 'process', 'Reset password through emailed link'),
        n('active', 'decision', 'Email verified and account active?'),
        n('notice', 'process', 'Notice: confirm email or wait for approval'),
        n('dash', 'process', 'Open the dashboard for the user’s role'),
        n('end', 'end', 'End'),
    ], [
        ['start', 'landing'], ['landing', 'has'], ['has', 'reg', 'No'], ['has', 'login', 'Yes'], ['reg', 'self'],
        ['self', 'verify', 'Yes'], ['self', 'pending', 'No'], ['verify', 'dash'], ['pending', 'login', 'After approval'],
        ['login', 'valid'], ['valid', 'active', 'Yes'], ['valid', 'forgot', 'No'], ['forgot', 'login'],
        ['active', 'dash', 'Yes'], ['active', 'notice', 'No'], ['dash', 'end'],
    ]);
}

/** Figs 9–15: log in, open the role's dashboard, choose any of its modules, log out. */
export function roleWorkflowSvg(role, paths) {
    const modules = workflowModules(paths);
    const COLS = 4;
    const BW = 200;
    const BH = 54;
    const GX = 24;
    const GY = 40;
    const left = 70;
    const gridW = COLS * BW + (COLS - 1) * GX;
    const cx = left + gridW / 2;
    const p = [];
    let y = 20;
    const step = (draw, h) => { p.push(draw(y)); const top = y; y += h + 30; return top; };

    step((t) => terminator(cx - 65, t, 130, 40, 'Start'), 40);
    p.push(line(cx, 60, cx, y - 2), arrowHead(cx, y, 0, 1));
    step((t) => process(cx - 110, t, 220, 50, 'Log in (see Figure 8)'), 50);
    p.push(line(cx, y - 30, cx, y - 2), arrowHead(cx, y, 0, 1));
    const dashTop = step((t) => process(cx - 110, t, 220, 50, `${ROLE_LABELS[ROLE_ORDER.indexOf(role)]} Dashboard`), 50);
    p.push(line(cx, y - 30, cx, y - 2), arrowHead(cx, y, 0, 1));
    step((t) => decision(cx - 95, t, 190, 90, 'Select a module'), 90);

    // Trunk down the left of the grid; each row hangs from its own branch.
    const diamondMid = y - 30 - 45;
    const trunk = left - 30;
    p.push(polyline([{ x: cx - 95, y: diamondMid }, { x: trunk, y: diamondMid }, { x: trunk, y }]));
    const rows = Math.ceil(modules.length / COLS);
    for (let r = 0; r < rows; r++) {
        const rowY = y + r * (BH + GY);
        const row = modules.slice(r * COLS, r * COLS + COLS);
        const lastX = left + (row.length - 1) * (BW + GX) + BW / 2;
        p.push(polyline([{ x: trunk, y: rowY - 14 }, { x: lastX, y: rowY - 14 }]));
        row.forEach((label, c) => {
            const bx = left + c * (BW + GX);
            p.push(line(bx + BW / 2, rowY - 14, bx + BW / 2, rowY - 2), arrowHead(bx + BW / 2, rowY, 0, 1, 6));
            p.push(process(bx, rowY, BW, BH, label, 12));
        });
        if (r < rows - 1) p.push(line(trunk, rowY - 14, trunk, rowY + BH + GY - 14));
    }
    y += rows * (BH + GY) - GY;

    // Every module returns to the dashboard; finishing ends the session.
    const right = left + gridW + 30;
    p.push(polyline([{ x: left + gridW, y: y - BH / 2 }, { x: right, y: y - BH / 2 }, { x: right, y: dashTop + 25 }, { x: cx + 112, y: dashTop + 25 }]),
        arrowHead(cx + 110, dashTop + 25, -1, 0));
    p.push(`<rect x="${right - 8}" y="${(y + dashTop) / 2 - 40}" width="16" height="80" fill="#fff"/>`,
        `<text x="${right}" y="${(y + dashTop) / 2}" font-size="12" font-style="italic" text-anchor="middle" dominant-baseline="middle" transform="rotate(90 ${right} ${(y + dashTop) / 2})">Back to Dashboard</text>`);
    // "Done" leaves from the selection trunk, not from any one module.
    p.push(polyline([{ x: trunk, y: y - BH - 14 }, { x: trunk, y: y + 16 }, { x: cx, y: y + 16 }, { x: cx, y: y + 34 }]), arrowHead(cx, y + 36, 0, 1));
    p.push(`<rect x="${(trunk + cx) / 2 - 20}" y="${y + 8}" width="40" height="16" fill="#fff"/>`,
        `<text x="${(trunk + cx) / 2}" y="${y + 16}" font-size="12" font-style="italic" text-anchor="middle" dominant-baseline="middle">Done</text>`);
    y += 36;
    p.push(process(cx - 90, y, 180, 44, 'Log out'));
    p.push(line(cx, y + 44, cx, y + 72), arrowHead(cx, y + 74, 0, 1));
    p.push(terminator(cx - 65, y + 74, 130, 40, 'End'));

    return svgDoc(right + 30, y + 134, p.join(''));
}
