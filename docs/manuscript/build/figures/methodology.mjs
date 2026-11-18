/**
 * Conceptual Framework (Fig 1), Flow of the Study (Fig 4) and Agile
 * Methodology (Fig 6). Wording is the manuscript's own (Chapters 2 and 3),
 * so the figures match the text that introduces them.
 */
import { arrowHead, line, polyline, rect, SHADE, svgDoc, text, textWidth, wrap } from '../lib/svg.mjs';

const COL_W = 300;
const GAP = 70;

/** Three titled columns joined by arrows, with a feedback loop underneath. */
function ipo(columns, feedback) {
    const size = 13;
    // SVG collapses leading spaces, so a continuation line is indented by position instead.
    const bodies = columns.map(([, items]) => items.flatMap((it) => wrap(it, COL_W - 44, size).map((l, i) => (i ? { l, dx: 10 } : { l: `• ${l}`, dx: 0 }))));
    const h = Math.max(...bodies.map((b) => b.length)) * 20 + 70;
    const p = [];
    columns.forEach(([title], i) => {
        const x = 20 + i * (COL_W + GAP);
        p.push(rect(x, 20, COL_W, 40, { fill: SHADE }), text(x + COL_W / 2, 40, title, { size: 15, anchor: 'middle', weight: 'bold' }));
        p.push(rect(x, 60, COL_W, h));
        bodies[i].forEach(({ l, dx }, j) => p.push(text(x + 16 + dx, 90 + j * 20, l, { size })));
        if (i) p.push(line(x - GAP + 6, 60 + h / 2, x - 4, 60 + h / 2, { width: 2 }), arrowHead(x - 2, 60 + h / 2, 1, 0, 12));
    });
    const w = 40 + columns.length * COL_W + (columns.length - 1) * GAP;
    const fy = 60 + h + 50;
    const right = w - 20 - COL_W / 2;
    const left = 20 + COL_W / 2;
    p.push(polyline([{ x: right, y: 60 + h }, { x: right, y: fy }, { x: left, y: fy }, { x: left, y: 60 + h + 4 }]));
    p.push(arrowHead(left, 60 + h + 2, 0, -1, 10));
    const lw = textWidth(feedback, 13) + 16;
    p.push(`<rect x="${w / 2 - lw / 2}" y="${fy - 10}" width="${lw}" height="20" fill="#fff"/>`);
    p.push(text(w / 2, fy, feedback, { size: 13, anchor: 'middle', style: 'italic' }));

    return svgDoc(w, fy + 30, p.join(''));
}

export function conceptualFrameworkSvg() {
    return ipo([
        ['INPUT', ['Graduate profiles', 'Résumés', 'Job postings', 'Employer requirements', 'Employment records',
            'Alumni tracer survey data', 'Institutional information']],
        ['PROCESS', ['Résumé parsing', 'Skill matching', 'Skill gap analysis', 'Career recommendation generation',
            'Employment tracking', 'Report generation']],
        ['OUTPUT', ['AI-generated job-match recommendations', 'Skill-gap reports', 'Career development suggestions',
            'Employment statistics', 'Alumni tracer reports', 'Administrative analytics']],
    ], 'Feedback and continuous improvement');
}

export function flowOfStudySvg() {
    return ipo([
        ['INPUT', ['Existing system and problems encountered', 'Technical requirements (Database, E-surveys, AI Matching)',
            '7 User Role functional requirements', 'Best features of the proposed GradConnect platform',
            'System acceptability requirements']],
        ['PROCESS', ['Transmittal Letter', 'Survey Questionnaire', 'Agile Methodology']],
        ['OUTPUT', ['GRADCONNECT: Deployed Web-Mobile Platform']],
    ], 'Evaluation (ISO/IEC 25010)');
}

export const AGILE_PHASES = ['Planning / Conception-Initiation', 'Analysis-Design', 'Development / Construction / Build',
    'Testing / Quality Assurance', 'Implementation / Deployment'];

/** The five phases on a cycle, each feeding the next, around the user feedback that drives revisions. */
export function agileSvg() {
    const cx = 420;
    const cy = 330;
    const r = 230;
    const p = [`<ellipse cx="${cx}" cy="${cy}" rx="105" ry="55" fill="${SHADE}" stroke="#000"/>`,
        text(cx, cy - 9, 'Users’ comments', { size: 14, anchor: 'middle', weight: 'bold' }),
        text(cx, cy + 11, 'and suggestions', { size: 14, anchor: 'middle', weight: 'bold' })];
    const at = (i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / AGILE_PHASES.length;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
    };
    AGILE_PHASES.forEach((phase, i) => {
        // Arc from this phase to the next, clear of both boxes.
        const a0 = at(i).a + 0.38;
        const a1 = at(i + 1).a - 0.38;
        const pts = Array.from({ length: 13 }, (_, k) => {
            const a = a0 + ((a1 - a0) * k) / 12;
            return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
        });
        const [u, v] = pts.slice(-2);
        p.push(polyline(pts, { width: 1.5 }), arrowHead(v.x, v.y, v.x - u.x, v.y - u.y, 11));
    });
    AGILE_PHASES.forEach((phase, i) => {
        const { x, y } = at(i);
        const lines = wrap(phase, 150, 14);
        p.push(rect(x - 90, y - 34, 180, 68, { fill: '#fff', radius: 34 }));
        lines.forEach((l, j) => p.push(text(x, y + (j - (lines.length - 1) / 2) * 17, l, { size: 14, anchor: 'middle', weight: 'bold' })));
        // Spoke from the box's edge to the ellipse's edge, so it never crosses a label.
        const dx = x - cx;
        const dy = y - cy;
        const tBox = Math.min(90 / Math.abs(dx || 1e-9), 34 / Math.abs(dy || 1e-9)) + 0.03;
        const tEll = 1 / Math.hypot(dx / 105, dy / 55) + 0.03;
        p.push(line(cx + dx * tEll, cy + dy * tEll, x - dx * tBox, y - dy * tBox, { dash: '4 3' }));
    });

    return svgDoc(840, 640, p.join(''));
}
