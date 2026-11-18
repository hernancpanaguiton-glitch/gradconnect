/**
 * Business Model Canvas (Fig 7), Validation Board (Fig 16) and Business
 * Roadmap (Fig 17), redrawn in black and white from the manuscript's own
 * images; the wording is theirs (two typos corrected on the board).
 */
import { rect, SHADE, svgDoc, text, wrap } from '../lib/svg.mjs';

/** A titled cell with bullet points, top-aligned. */
function cell(x, y, w, h, title, items, { size = 13 } = {}) {
    const p = [rect(x, y, w, h), rect(x, y, w, 30, { fill: SHADE }), text(x + w / 2, y + 15, title, { size: 14, anchor: 'middle', weight: 'bold' })];
    let ty = y + 50;
    for (const it of items) {
        wrap(it, w - 46, size).forEach((l, i) => {
            if (!i) p.push(`<circle cx="${x + 18}" cy="${ty}" r="2.6" fill="#000"/>`);
            p.push(text(x + 28, ty, l, { size }));
            ty += size + 5;
        });
        ty += 6;
    }

    return p.join('');
}

export const CANVAS = {
    problem: ['Fragmented alumni tracking & records', 'Low tracer study response rate', 'Hard to match grads with employers',
        'Limited competency-based guidance', 'Curriculum skill gaps unclear'],
    solution: ['Centralized alumni database', 'Electronic tracer study module', 'AI resume parsing (NLP)',
        'Resume-job matching (cosine similarity)', 'Skill gap detection engine', 'Employment analytics dashboard',
        'Online alumni community and engagement tools'],
    value: ['AI platform linking grads, employers & university', 'Cuts administrative workload', 'Boosts employability & curriculum fit',
        'Data-driven career guidance', 'Continuous alumni engagement through online community', 'Lifelong career support and networking opportunities'],
    segments: ['Graduate student & alumni', 'Industry partners', 'Alumni & Student Affairs Offices', 'Department heads & administrators'],
    metrics: ['Registered users & tracer completion rate', 'AI job matches & employment rate', 'Employer participation & resume uploads',
        'Alumni community engagement rate', 'ISO/IEC 25010 acceptability score'],
    channels: ['GradConnect web portal', 'University website & email', 'Social media & career fairs',
        'Alumni newsletters & community updates', 'Online events and webinars'],
    costs: ['Hosting, database & AI/NLP development', 'Maintenance, security & support', 'Training & system upgrades',
        'Community management & engagement activities'],
    revenue: ['University IT budget & institutional funding', 'CHED / research grants', 'Industry sponsorships',
        'Premium employer services (future)', 'Partnership programs and collaborative projects'],
};

export function bmcSvg() {
    const W = 1200;
    const q = W / 4;
    const c = CANVAS;
    const p = [
        cell(20, 20, q, 270, 'PROBLEM', c.problem), cell(20 + q, 20, q, 270, 'SOLUTION', c.solution),
        cell(20 + 2 * q, 20, q, 270, 'VALUE PROPOSITION', c.value), cell(20 + 3 * q, 20, q, 270, 'CUSTOMER SEGMENTS', c.segments),
        cell(20, 290, W / 2, 175, 'KEY METRICS', c.metrics), cell(20 + W / 2, 290, W / 2, 175, 'CHANNELS', c.channels),
        cell(20, 465, W / 2, 175, 'COST STRUCTURE', c.costs), cell(20 + W / 2, 465, W / 2, 175, 'REVENUE STREAMS', c.revenue),
    ];

    return svgDoc(W + 40, 660, p.join(''));
}

export const BOARD = {
    columns: [['START', '(BASELINE ASSUMPTION)'], ['1ST PIVOT', '(STAGE 1)'], ['2ND PIVOT', '(STAGE 2)']],
    rows: [
        ['CUSTOMER HYPOTHESIS', [
            'Alumni, graduate credentials, industry partners, university offices (Alumni Affairs, Student Affairs, Department Heads, Administration) need a centralized platform for employability tracking and alumni engagement.',
            'Alumni and graduate students need an easier way to update their profiles, participate in tracer surveys, and access relevant opportunities.',
            'Industry partners need a simple and reliable platform to post job opportunities and connect with qualified graduates.']],
        ['PROBLEM HYPOTHESIS', [
            'University of Cebu Lapu-Lapu and Mandaue relies on manual processes for alumni tracking, tracer studies, employment monitoring, and skill gap identification.',
            'Low response rate in tracer surveys, outdated alumni records, and delay in updates cause inaccurate employment data.',
            'Industry partners face difficulty in finding qualified graduates and manually screening applicants, which slows down hiring.']],
        ['SOLUTION HYPOTHESIS', [
            'GradConnect will centralize alumni data, automate tracer surveys, and provide analytics dashboards for employability tracking.',
            'Users will engage if the platform is easy to use, mobile-responsive, and offers relevant features for their roles.',
            'The platform will provide job posting, applicant matching, and company profile management features to simplify recruitment.']],
    ],
    experiment: ['Conduct interviews and needs assessment with alumni and graduate students.', 'Map the current tracer study and profile process.',
        'Develop a clickable prototype for alumni and graduate students (MVP).', 'Allow target users to test the prototype based on their assigned role.',
        'Evaluate usability, engagement, and feature relevance.', 'Collect feedback on usability, usefulness, and overall satisfaction.'],
    project: 'GradConnect',
    leader: 'Hernan Panaguiton',
};

function note(x, y, w, h, s, size = 13) {
    const lines = wrap(s, w - 24, size);
    return rect(x, y, w, h, { fill: '#fff', stroke: '#555' })
        + lines.map((l, i) => text(x + 12, y + h / 2 + (i - (lines.length - 1) / 2) * (size + 5), l, { size })).join('');
}

export function validationBoardSvg() {
    const L = 170;
    const CW = 340;
    const RH = 190;
    const W = L + 3 * CW;
    const p = [rect(20, 20, W, 60, { fill: '#000' }), text(20 + (W - 360) / 2, 50, 'VALIDATION BOARD', { size: 30, anchor: 'middle', weight: 'bold', fill: '#fff' })];
    p.push(rect(20 + W - 360, 20, 180, 60, { fill: '#fff' }), text(20 + W - 270, 38, 'Project Name:', { size: 12, anchor: 'middle' }),
        text(20 + W - 270, 60, BOARD.project, { size: 15, anchor: 'middle', weight: 'bold' }));
    p.push(rect(20 + W - 180, 20, 180, 60, { fill: '#fff' }), text(20 + W - 90, 38, 'Team Leader Name:', { size: 12, anchor: 'middle' }),
        text(20 + W - 90, 60, BOARD.leader, { size: 15, anchor: 'middle', weight: 'bold' }));
    const hy = 80;
    p.push(rect(20, hy, L, 60, { fill: SHADE }), text(20 + L / 2, hy + 30, 'TRACK PIVOTS', { size: 14, anchor: 'middle', weight: 'bold' }));
    BOARD.columns.forEach(([t, s], i) => {
        const x = 20 + L + i * CW;
        p.push(rect(x, hy, CW, 60), text(x + CW / 2, hy + 22, t, { size: 16, anchor: 'middle', weight: 'bold' }), text(x + CW / 2, hy + 42, s, { size: 11, anchor: 'middle' }));
    });
    BOARD.rows.forEach(([label, notes], r) => {
        const y = hy + 60 + r * RH;
        p.push(rect(20, y, L, RH, { fill: SHADE }));
        label.split(' ').forEach((w, k) => p.push(text(20 + L / 2, y + RH / 2 + (k - 0.5) * 20, w, { size: 15, anchor: 'middle', weight: 'bold' })));
        notes.forEach((n, i) => p.push(rect(20 + L + i * CW, y, CW, RH), note(20 + L + i * CW + 20, y + 18, CW - 40, RH - 36, n)));
    });
    const ey = hy + 60 + 3 * RH;
    const EW = (W - 80) / 3;
    p.push(rect(20, ey, W, 300), text(50, ey + 26, 'STAGE 1:  DESIGN EXPERIMENT', { size: 15, weight: 'bold' }));
    BOARD.experiment.forEach((n, i) => p.push(note(40 + (i % 3) * (EW + 20), ey + 50 + Math.floor(i / 3) * 120, EW - 20, 100, n)));

    return svgDoc(W + 40, ey + 320, p.join(''));
}

export const ROADMAP = [
    ['PHASE 1', 'ANALYSIS & PLANNING', ['Identify the current existing system: processes and problems encountered.', 'Gather requirements from stakeholders.',
        'Define system objectives and scope.', 'Plan system architecture and resources.']],
    ['PHASE 2', 'DESIGN & DEVELOPMENT', ['Maintain a centralized database of graduates and alumni profiles.', 'Conduct employability and alumni tracer surveys electronically.',
        'Track graduate employment status, career progression, and industry placement.', 'Implement AI-powered resume matching with job opportunities.',
        'Identify employability skill gaps through survey and resume analysis.', 'Provide career recommendations based on qualifications and skills.',
        'Develop the best features of the platform.']],
    ['PHASE 3', 'TESTING & EVALUATION', ['Test system functionality, usability, and performance.', 'Evaluate the level of acceptability of the system.',
        'Incorporate user feedback and refine the system.', 'Ensure data privacy, security, and quality standards.']],
    ['PHASE 4', 'IMPLEMENTATION', ['Deploy the system for full operation.', 'Train users and provide support.', 'Monitor system usage and performance.']],
    ['PHASE 5', 'CONTINUOUS IMPROVEMENT', ['Continuously improve system features based on analytics and feedback.', 'Strengthen alumni engagement and partnerships.',
        'Enhance platform to support graduate career readiness and employability.', 'Ensure long-term sustainability and scalability.']],
];

/** Five phases as milestones on a rising road, each with its activities beneath. */
export function roadmapSvg() {
    const CW = 250;
    const p = [];
    const roadY = (i) => 470 - i * 90;
    // The road: a thick stepped line rising to the right, dashed centre line.
    const pts = ROADMAP.map((_, i) => ({ x: 20 + i * CW + CW / 2, y: roadY(i) }));
    const d = `M 20 ${roadY(0) + 40} ` + pts.map((q, i) => (i ? `C ${q.x - CW / 2} ${pts[i - 1].y} ${q.x - CW / 2} ${q.y} ${q.x} ${q.y}` : `L ${q.x} ${q.y}`)).join(' ')
        + ` L ${20 + ROADMAP.length * CW} ${roadY(ROADMAP.length - 1) - 30}`;
    p.push(`<path d="${d}" fill="none" stroke="#333" stroke-width="22" stroke-linecap="round"/>`,
        `<path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>`);
    let bottom = 0;
    ROADMAP.forEach(([phase, name, items], i) => {
        const { x, y } = pts[i];
        // Milestone pin.
        p.push(`<path d="M ${x} ${y - 14} L ${x - 13} ${y - 40} A 16 16 0 1 1 ${x + 13} ${y - 40} Z" fill="${SHADE}" stroke="#000"/>`,
            `<circle cx="${x}" cy="${y - 50}" r="7" fill="#fff" stroke="#000"/>`, text(x, y - 50, String(i + 1), { size: 10, anchor: 'middle', weight: 'bold' }));
        const bx = 20 + i * CW + 10;
        // Below the lowest point the road reaches in this column (it dips half a step on arrival).
        let ty = y + 85;
        p.push(text(bx, ty, phase, { size: 20, weight: 'bold' }), text(bx, ty + 24, name, { size: 13, weight: 'bold' }));
        ty += 50;
        for (const it of items) {
            wrap(it, CW - 40, 12).forEach((l, k) => {
                if (!k) p.push(`<circle cx="${bx + 4}" cy="${ty}" r="2.6" fill="#000"/>`);
                p.push(text(bx + 14, ty, l, { size: 12 }));
                ty += 17;
            });
            ty += 5;
        }
        bottom = Math.max(bottom, ty);
    });

    return svgDoc(40 + ROADMAP.length * CW, bottom + 20, p.join(''));
}
