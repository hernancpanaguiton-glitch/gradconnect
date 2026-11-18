/**
 * Functional Decomposition Diagram (Fig 18): the system, its subsystems, and
 * every module in data/modules.json exactly once (the test checks this).
 */
import { line, rect, SHADE, svgDoc, text, wrap } from '../lib/svg.mjs';

export const FDD_GROUPS = [
    ['Authentication', ['Login Process', 'Registration Process', 'Forgot Password']],
    ['Graduate Career Services', ['User Profile Management', 'Resume Management', 'AI Resume Matching', 'Job Application',
        'Career Readiness Assessment', 'Skill Gap Analysis', 'Learning Resources', 'Employment History']],
    ['Alumni and Tracer Studies', ['Alumni Profile Management', 'Tracer Survey Management', 'Employment Tracking']],
    ['Industry Partners', ['Job Opportunity Management', 'Applicant Management', 'Talent Search']],
    ['Communication and Engagement', ['Announcements', 'Events', 'Alumni Community', 'Messaging']],
    ['Institutional Offices', ['Student Affairs Module', 'Department Head Module', 'Reports and Analytics']],
    ['Administration', ['User Management', 'Roles and Permissions', 'Colleges and Programs', 'Job Moderation', 'Audit Logs',
        'Data and Backups', 'Platform Status', 'System Settings', 'Skill Taxonomy']],
    ['Common Features', ['Dashboard Management', 'Notification Management', 'Global Search', 'Account Settings and Data Export']],
];

function box(x, y, w, h, label, { size = 12, fill = '#fff', weight = 'normal' } = {}) {
    const lines = wrap(label, w - 12, size);
    return rect(x, y, w, h, { fill })
        + lines.map((l, i) => text(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * (size + 3), l, { size, anchor: 'middle', weight })).join('');
}

export function fddSvg() {
    const W = 150;
    const GAP = 16;
    const H = 40;
    const total = FDD_GROUPS.length * W + (FDD_GROUPS.length - 1) * GAP;
    const cx = 20 + total / 2;
    const p = [box(cx - 130, 20, 260, 50, 'GradConnect: Graduate Employability and Career Development Platform', { size: 13, fill: SHADE, weight: 'bold' })];
    const busY = 95;
    p.push(line(cx, 70, cx, busY), line(20 + W / 2, busY, 20 + total - W / 2, busY));
    let bottom = 0;
    FDD_GROUPS.forEach(([group, modules], i) => {
        const x = 20 + i * (W + GAP);
        p.push(line(x + W / 2, busY, x + W / 2, 120), box(x, 120, W, 50, group, { size: 12, fill: SHADE, weight: 'bold' }));
        // Modules hang off a spine on the group's left edge.
        const spine = x + 12;
        modules.forEach((m, j) => {
            const y = 190 + j * (H + 12);
            p.push(line(spine, y + H / 2, x + 26, y + H / 2), box(x + 26, y, W - 26, H, m, { size: 11 }));
            bottom = Math.max(bottom, y + H);
        });
        p.push(line(spine, 170, spine, 190 + (modules.length - 1) * (H + 12) + H / 2));
    });

    return svgDoc(total + 40, bottom + 20, p.join(''));
}
