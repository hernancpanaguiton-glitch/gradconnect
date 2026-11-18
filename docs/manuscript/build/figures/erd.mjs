/**
 * Entity Relationship Diagrams drawn from the live schema snapshot: one
 * overview of all tables with their keys only, and one diagram per group
 * with every column. Crow's-foot notation; ELK lays out the boxes and
 * routes the lines.
 */
import ELK from 'elkjs/lib/elk.bundled.js';
import { esc, line, polyline, rect, RULE, SHADE, svgDoc, text, textWidth } from '../lib/svg.mjs';

const elk = new ELK();
const SIZE = 12;
const ROW = 24;
const HEAD = 30;
const PAD = 8;

/** Six groups, together covering every table once (the test checks this). */
export const ERD_GROUPS = [
    {
        id: 'accounts', title: 'Accounts and Access',
        tables: ['users', 'roles', 'permissions', 'model_has_roles', 'model_has_permissions', 'role_has_permissions',
            'settings', 'audit_logs', 'notifications', 'notification_preferences'],
    },
    {
        id: 'graduates', title: 'Graduate Records and Skills',
        tables: ['departments', 'graduate_profiles', 'education_records', 'employment_records', 'graduate_skill', 'skills', 'skill_aliases'],
    },
    {
        id: 'jobs', title: 'Jobs, Résumés and AI Matching',
        tables: ['companies', 'job_postings', 'job_posting_skill', 'job_applications', 'job_match_results', 'match_feedback',
            'employer_feedbacks', 'resumes'],
    },
    {
        id: 'surveys', title: 'Tracer Surveys and Reports',
        tables: ['surveys', 'survey_questions', 'survey_responses', 'survey_answers', 'reports'],
    },
    {
        id: 'engagement', title: 'Communication and Engagement',
        tables: ['announcements', 'events', 'event_rsvps', 'community_posts', 'community_comments', 'conversations',
            'conversation_participants', 'messages'],
    },
    {
        id: 'services', title: 'Student Services and Learning',
        tables: ['learning_resources', 'learning_resource_skill', 'scholarships', 'scholarship_recipients', 'clearance_records', 'student_cases'],
    },
];

const SHORT = [
    [/^character varying.*/, 'varchar'], [/^timestamp.*/, 'timestamp'], [/^double precision/, 'double'],
    [/^numeric.*/, 'numeric'], [/^vector.*/, 'vector'],
];
const shortType = (t) => SHORT.reduce((s, [re, out]) => (re.test(s) ? out : s), t);

function keyOf(col) {
    const pk = col.constraints.some((c) => c.startsWith('PK'));
    const fk = col.constraints.some((c) => c.startsWith('FK'));
    const uk = col.constraints.some((c) => c.startsWith('UNIQUE'));

    return [pk && 'PK', fk && 'FK', !pk && uk && 'UK'].filter(Boolean).join(',');
}

const fkTarget = (col) => col.constraints.map((c) => c.match(/^FK → (\w+)\.(\w+)$/)).find(Boolean)?.[1];

/** The rows a box shows: all columns, or keys only. */
function rows(table, keysOnly) {
    // The overview shows only the keys that make relationships: primary and foreign.
    const cols = keysOnly ? table.columns.filter((c) => /PK|FK/.test(keyOf(c))) : table.columns;

    return cols.map((c) => ({ type: shortType(c.type), name: c.name, key: keyOf(c) }));
}

function boxSize(name, rs) {
    const typeW = Math.max(40, ...rs.map((r) => textWidth(r.type, SIZE)));
    const nameW = Math.max(60, ...rs.map((r) => textWidth(r.name, SIZE)));
    const keyW = Math.max(26, ...rs.map((r) => textWidth(r.key, SIZE)));
    const width = Math.max(textWidth(name, SIZE + 1) + 2 * PAD, typeW + nameW + keyW + 6 * PAD);

    return { width: Math.ceil(width), height: HEAD + rs.length * ROW, cols: [typeW + 2 * PAD, nameW + 2 * PAD] };
}

function drawBox(node, rs) {
    const { x, y, width, height, cols } = node;
    const parts = [
        rect(x, y, width, height, { fill: '#fff', stroke: RULE }),
        rect(x, y, width, HEAD, { fill: SHADE, stroke: RULE }),
        text(x + width / 2, y + HEAD / 2, node.id, { size: SIZE + 1, anchor: 'middle' }),
    ];
    rs.forEach((r, i) => {
        const ry = y + HEAD + i * ROW;
        parts.push(line(x, ry, x + width, ry, { stroke: '#bbb' }));
        parts.push(text(x + PAD, ry + ROW / 2, r.type, { size: SIZE }));
        parts.push(text(x + cols[0] + PAD, ry + ROW / 2, r.name, { size: SIZE }));
        parts.push(text(x + cols[0] + cols[1] + PAD, ry + ROW / 2, r.key, { size: SIZE }));
    });
    if (rs.length) {
        parts.push(line(x + cols[0], y + HEAD, x + cols[0], y + height, { stroke: '#bbb' }));
        parts.push(line(x + cols[0] + cols[1], y + HEAD, x + cols[0] + cols[1], y + height, { stroke: '#bbb' }));
    }

    return parts.join('');
}

/** Crow's foot (zero or many) at the child end; double bar (exactly one) at the parent end. */
/** Unit direction along the dominant axis: lines are orthogonal, so a sub-pixel drift is noise. */
const axis = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);

function relationEnds(points) {
    const out = [];
    // Routing can repeat a point at either end; take the direction from the
    // nearest point that differs, or the marks collapse into a skewed stub.
    const differs = (a, b) => Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;
    const a = points.at(-1);
    const b = [...points].reverse().find((pt) => differs(pt, a)) ?? a;
    const p = points[0];
    const q = points.find((pt) => differs(pt, p)) ?? p;
    const [ux, uy] = axis(a.x - b.x, a.y - b.y);
    // child end: prongs open toward the box
    const bx = a.x - ux * 12;
    const by = a.y - uy * 12;
    out.push(line(bx, by, a.x - uy * 6, a.y + ux * 6, { stroke: RULE }), line(bx, by, a.x, a.y, { stroke: RULE }),
        line(bx, by, a.x + uy * 6, a.y - ux * 6, { stroke: RULE }));
    out.push(`<circle cx="${a.x - ux * 17}" cy="${a.y - uy * 17}" r="4" fill="#fff" stroke="${RULE}"/>`);
    // parent end: two bars across the line
    const [vx, vy] = axis(q.x - p.x, q.y - p.y);
    for (const d of [7, 11]) {
        const cx = p.x + vx * d;
        const cy = p.y + vy * d;
        out.push(line(cx - vy * 6, cy - vx * 6, cx + vy * 6, cy + vx * 6, { stroke: RULE }));
    }

    return out.join('');
}

async function layoutErd(schema, tableNames, { keysOnlyFor = () => false, title } = {}) {
    const byName = new Map(schema.map((t) => [t.name, t]));
    const drawn = new Map();
    const edges = [];

    const add = (name, keysOnly) => {
        if (drawn.has(name)) return;
        const rs = keysOnly ? rows(byName.get(name), true).filter((r) => r.key.includes('PK')) : rows(byName.get(name), keysOnlyFor(name));
        drawn.set(name, { rs, ...boxSize(name, rs) });
    };

    for (const name of tableNames) add(name, false);
    for (const name of tableNames) {
        for (const col of byName.get(name).columns) {
            const target = fkTarget(col);
            if (!target) continue;
            if (!drawn.has(target)) add(target, true); // a table from another group: key only
            edges.push({ id: `e${edges.length}`, sources: [target], targets: [name], label: col.name });
        }
    }

    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': '36',
            'elk.layered.spacing.nodeNodeBetweenLayers': '70',
            'elk.layered.spacing.edgeNodeBetweenLayers': '28',
            'elk.spacing.edgeEdge': '10',
            'elk.spacing.edgeLabel': '4',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        },
        children: [...drawn].map(([id, b]) => ({ id, width: b.width, height: b.height })),
        edges: edges.map((e) => ({
            id: e.id, sources: e.sources, targets: e.targets,
            labels: [{ text: e.label, width: textWidth(e.label, 10), height: 12 }],
        })),
    };

    const out = await elk.layout(graph);
    const margin = 24;
    const top = title ? 44 : 0;
    const parts = [];

    for (const edge of out.edges ?? []) {
        for (const s of edge.sections ?? []) {
            const pts = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((p) => ({ x: p.x + margin, y: p.y + margin + top }));
            parts.push(polyline(pts, { stroke: RULE }), relationEnds(pts));
        }
        for (const l of edge.labels ?? []) {
            parts.push(`<rect x="${l.x + margin - 1}" y="${l.y + margin + top - 1}" width="${l.width + 2}" height="${l.height + 2}" fill="#fff"/>`);
            parts.push(text(l.x + margin, l.y + margin + top + l.height / 2, l.text, { size: 10 }));
        }
    }
    for (const n of out.children) {
        const b = drawn.get(n.id);
        parts.push(drawBox({ ...b, id: n.id, x: n.x + margin, y: n.y + margin + top }, b.rs));
    }
    if (title) parts.push(text((out.width + 2 * margin) / 2, 26, title, { size: 16, anchor: 'middle', weight: 'bold' }));

    return svgDoc(out.width + 2 * margin, out.height + 2 * margin + top, parts.join(''));
}

/** Every table, keys only: the shape of the whole database at a glance. */
export function erdOverviewSvg(schema) {
    return layoutErd(schema, schema.map((t) => t.name), { keysOnlyFor: () => true });
}

/** One group with all its columns; tables it points to elsewhere show their key only. */
export function erdGroupSvg(schema, group) {
    return layoutErd(schema, group.tables, { title: group.title });
}

/**
 * Database Design (Fig 43): the six groups with their tables, linked where
 * a foreign key crosses from one group to another (labelled with the count).
 */
export async function databaseDesignSvg(schema) {
    const groupOf = new Map(ERD_GROUPS.flatMap((g) => g.tables.map((t) => [t, g.id])));
    const counts = new Map();
    for (const t of schema) {
        for (const col of t.columns) {
            const target = fkTarget(col);
            if (!target || groupOf.get(target) === groupOf.get(t.name)) continue;
            const key = `${groupOf.get(target)}>${groupOf.get(t.name)}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    }
    const W = 230;
    const sizes = new Map(ERD_GROUPS.map((g) => [g.id, { width: W, height: HEAD + 14 + g.tables.length * 18 }]));
    const out = await elk.layout({
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': '60', 'elk.layered.spacing.nodeNodeBetweenLayers': '80', 'elk.spacing.edgeEdge': '14',
        },
        children: ERD_GROUPS.map((g) => ({ id: g.id, ...sizes.get(g.id) })),
        edges: [...counts].map(([k, n], i) => {
            const [from, to] = k.split('>');
            const label = `${n} FK`;
            return { id: `g${i}`, sources: [from], targets: [to], labels: [{ text: label, width: textWidth(label, 11) + 4, height: 13 }] };
        }),
    });
    const m = 24;
    const p = [];
    for (const e of out.edges) {
        for (const s of e.sections) {
            const pts = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((q) => ({ x: q.x + m, y: q.y + m }));
            p.push(polyline(pts, { stroke: RULE }), relationEnds(pts));
        }
        for (const l of e.labels ?? []) {
            p.push(`<rect x="${l.x + m}" y="${l.y + m}" width="${l.width}" height="${l.height}" fill="#fff"/>`,
                text(l.x + m + 2, l.y + m + l.height / 2, l.text, { size: 11, style: 'italic' }));
        }
    }
    for (const c of out.children) {
        const g = ERD_GROUPS.find((x) => x.id === c.id);
        const [x, y] = [c.x + m, c.y + m];
        p.push(rect(x, y, c.width, c.height, { fill: '#fff' }), rect(x, y, c.width, HEAD, { fill: SHADE }),
            text(x + c.width / 2, y + HEAD / 2, g.title, { size: 13, anchor: 'middle', weight: 'bold' }));
        g.tables.forEach((t, i) => p.push(text(x + 12, y + HEAD + 16 + i * 18, t, { size: 12 })));
    }

    return svgDoc(out.width + 2 * m, out.height + 2 * m, p.join(''));
}

export { esc };
