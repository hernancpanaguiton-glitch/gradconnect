/**
 * Network Model, Network Topology, Technology Stack and AI System
 * Architecture. Fixed layouts; every label is a fact read from
 * docker-compose.yml, .env.docker.example, config/ai.php, the lockfiles or
 * app/Services (see test/figures-architecture.test.mjs).
 */
import { arrowHead, line, polyline, rect, SHADE, svgDoc, text, wrap } from '../lib/svg.mjs';

/** A box with a bold title and wrapped detail lines, centred. */
function card(x, y, w, h, title, detail = '', { fill = '#fff', size = 13 } = {}) {
    const lines = detail ? wrap(detail, w - 16, size - 2) : [];
    const heads = wrap(title, w - 16, size);
    const total = 18 + (heads.length - 1) * (size + 2) + lines.length * (size + 2);
    let ty = y + (h - total) / 2 + 9 - (size + 2);
    const out = [rect(x, y, w, h, { fill, radius: 3 })];
    for (const t of heads) {
        ty += size + 2;
        out.push(text(x + w / 2, ty, t, { size, anchor: 'middle', weight: 'bold' }));
    }
    for (const l of lines) {
        ty += size + 2;
        out.push(text(x + w / 2, ty + 2, l, { size: size - 2, anchor: 'middle' }));
    }

    return out.join('');
}

/** A titled, dashed container (a tier or a server). */
function band(x, y, w, h, title) {
    return rect(x, y, w, h, { dash: '6 4', radius: 6 })
        + rect(x, y, w, 30, { fill: SHADE, radius: 6 })
        + text(x + w / 2, y + 15, title, { size: 14, anchor: 'middle', weight: 'bold' });
}

/** A straight or one-elbow arrow with an optional label at its middle. */
function arrow(x1, y1, x2, y2, label = '', { both = false } = {}) {
    const out = [line(x1, y1, x2, y2), arrowHead(x2, y2, x2 - x1, y2 - y1)];
    if (both) out.push(arrowHead(x1, y1, x1 - x2, y1 - y2));
    if (label) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        out.push(`<rect x="${mx - label.length * 3.2}" y="${my - 8}" width="${label.length * 6.4}" height="16" fill="#fff"/>`);
        out.push(text(mx, my, label, { size: 11, anchor: 'middle', style: 'italic' }));
    }

    return out.join('');
}

/** An arrow along a path of right-angled segments, labelled on its longest leg. */
function elbow(points, label = '') {
    const [a, b] = points.slice(-2);
    const out = [polyline(points), arrowHead(b.x, b.y, b.x - a.x, b.y - a.y)];
    if (label) {
        const legs = points.slice(1).map((q, i) => [points[i], q]);
        const [u, v] = legs.sort((m, n) => Math.hypot(n[1].x - n[0].x, n[1].y - n[0].y) - Math.hypot(m[1].x - m[0].x, m[1].y - m[0].y))[0];
        const mx = (u.x + v.x) / 2;
        const my = (u.y + v.y) / 2;
        out.push(`<rect x="${mx - label.length * 3.2}" y="${my - 8}" width="${label.length * 6.4}" height="16" fill="#fff"/>`);
        out.push(text(mx, my, label, { size: 11, anchor: 'middle', style: 'italic' }));
    }

    return out.join('');
}

export function networkModelSvg() {
    const p = [];
    p.push(band(20, 20, 220, 470, 'Presentation Tier'));
    p.push(card(40, 190, 180, 120, 'Web Browser', 'Computers, laptops, tablets and smartphones of all seven user roles'));

    p.push(band(290, 20, 430, 470, 'Application Tier'));
    p.push(card(320, 70, 370, 110, 'Web Application', 'Laravel 13 on PHP 8.3, port :8000; serves every page and checks each user’s role'));
    p.push(card(320, 210, 370, 110, 'Background Worker', 'Queue worker; prepares résumés for matching and runs AI scoring'));
    p.push(card(400, 350, 210, 110, 'Mail Service', 'SMTP :1025; test inbox (Mailpit) at :8025'));

    p.push(band(770, 20, 300, 470, 'Data Tier'));
    p.push(card(790, 90, 260, 140, 'PostgreSQL 16 + pgvector', 'All records and the 768-number AI vectors; port :5432, reachable from the server only'));
    p.push(card(790, 290, 260, 120, 'File Storage', 'Uploaded résumés and generated files'));

    p.push(band(290, 530, 780, 130, 'External AI Services (Internet)'));
    p.push(card(320, 570, 360, 70, 'Groq', 'Scores how well a graduate fits a job'));
    p.push(card(700, 570, 350, 70, 'Gemini', 'Scoring fallback; produces 768-number embeddings'));

    p.push(arrow(220, 250, 320, 125, 'HTTP :8000', { both: true }));
    p.push(arrow(690, 125, 790, 150, 'SQL', { both: true }));
    p.push(arrow(690, 265, 790, 190, 'SQL', { both: true }));
    p.push(arrow(690, 280, 790, 350, 'files', { both: true }));
    p.push(arrow(505, 180, 505, 210, 'jobs'));
    p.push(arrow(505, 320, 505, 350, 'mail'));
    p.push(elbow([{ x: 350, y: 320 }, { x: 350, y: 570 }], 'HTTPS'));
    p.push(elbow([{ x: 660, y: 320 }, { x: 660, y: 515 }, { x: 875, y: 515 }, { x: 875, y: 570 }], 'HTTPS'));

    return svgDoc(1090, 680, p.join(''));
}

/** Fig 45: users' devices reach the web server over the Internet; it uses the AI module and the database server. */
export function networkDesignSvg() {
    const p = [];
    p.push(band(20, 20, 250, 430, 'Users (all seven roles)'));
    ['Desktop computer', 'Laptop', 'Tablet', 'Smartphone'].forEach((d, i) => p.push(card(45, 70 + i * 92, 200, 70, d, 'Web browser', { size: 13 })));
    p.push(`<ellipse cx="400" cy="235" rx="85" ry="50" fill="${SHADE}" stroke="#000"/>`, text(400, 235, 'Internet', { size: 15, anchor: 'middle', weight: 'bold' }));
    p.push(arrow(270, 235, 315, 235, '', { both: true }));
    p.push(band(530, 20, 640, 430, 'GradConnect Server (Docker Compose)'));
    p.push(card(560, 180, 230, 110, 'Web Application Server', 'Laravel 13 on PHP 8.3; pages, accounts and role checks (:8000)'));
    p.push(arrow(485, 235, 560, 235, 'HTTPS', { both: true }));
    p.push(card(900, 70, 240, 120, 'AI Résumé Matching Module', 'Background worker: résumé text, embeddings, shortlisting and scoring'));
    p.push(card(900, 300, 240, 120, 'Database Server', 'PostgreSQL 16 with pgvector; reachable only inside the server'));
    p.push(elbow([{ x: 790, y: 210 }, { x: 845, y: 210 }, { x: 845, y: 130 }, { x: 900, y: 130 }], 'jobs'));
    p.push(elbow([{ x: 790, y: 260 }, { x: 845, y: 260 }, { x: 845, y: 360 }, { x: 900, y: 360 }], 'SQL'));
    p.push(arrow(1020, 190, 1020, 300, 'vectors', { both: true }));
    p.push(card(900, 480, 240, 70, 'Groq and Gemini APIs', 'Scoring and embeddings, over HTTPS'));
    p.push(polyline([{ x: 1140, y: 130 }, { x: 1195, y: 130 }, { x: 1195, y: 515 }, { x: 1148, y: 515 }]), arrowHead(1140, 515, -1, 0));

    return svgDoc(1220, 570, p.join(''));
}

const ROLES = ['Graduate Student', 'Alumni', 'Industry Partner', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head', 'Admin'];

export function networkTopologySvg() {
    const p = [];
    const cx = 560;
    const cy = 250;
    // Users around the hub
    ROLES.forEach((role, i) => {
        const angle = Math.PI * (1.05 + (0.9 * i) / (ROLES.length - 1));
        const x = cx + Math.cos(angle) * 420;
        const y = cy + Math.sin(angle) * 200;
        p.push(line(x, y, cx, cy));
        p.push(card(x - 85, y - 26, 170, 52, role, 'Web browser', { size: 12 }));
    });
    p.push(`<ellipse cx="${cx}" cy="${cy}" rx="90" ry="42" fill="#fff" stroke="#000"/>`);
    p.push(text(cx, cy, 'Internet', { size: 15, anchor: 'middle', weight: 'bold' }));

    // Central server and its private network
    p.push(line(cx, cy + 42, cx, 360));
    p.push(band(260, 360, 600, 250, 'GradConnect Server (Docker)'));
    p.push(rect(280, 400, 560, 190, { dash: '2 3', radius: 4 }));
    p.push(text(560, 414, 'Private internal network', { size: 11, anchor: 'middle', style: 'italic' }));
    [['Web Application', ':8000'], ['Background Worker', 'queue'], ['Mail Service', ':8025'], ['Database', 'loopback :5432']]
        .forEach(([name, note], i) => p.push(card(296 + i * 136, 440, 124, 120, name, note, { size: 12 })));

    // External AI services hang off the Internet hub
    // Below the role arc and right of the server, so no box overlaps it.
    p.push(line(cx + 80, cy + 20, 985, 390));
    p.push(card(900, 390, 170, 90, 'AI Services', 'Groq and Gemini, over HTTPS', { size: 12 }));

    return svgDoc(1180, 630, p.join(''));
}

const STACK = [
    ['Client', ['Web browser on computer, tablet or smartphone']],
    ['Front-end', ['React 18.3', 'TypeScript 5.9', 'Tailwind CSS 3.4', 'Vite 7.3', 'Recharts 3.9']],
    ['Bridge', ['Inertia.js 2.0 (server)', 'Inertia.js 2.3 (React client)']],
    ['Back-end', ['PHP 8.3', 'Laravel 13.18', 'Spatie Laravel Permission 8.1', 'Laravel Sanctum 4.3', 'Smalot PDF Parser 2.0']],
    ['Data', ['PostgreSQL 16', 'pgvector']],
    ['AI Services', ['Groq (scoring)', 'Gemini (scoring fallback)', 'Gemini Embeddings (768)']],
    ['Environment', ['Docker Compose', 'Mailpit (test mail)']],
    ['Testing', ['PHPUnit 12.5', 'Vitest 3.2', 'React Testing Library 16.3', 'GitHub Actions']],
];

export function techStackSvg() {
    const p = [];
    const rowH = 64;
    STACK.forEach(([layer, items], i) => {
        const y = 20 + i * (rowH + 12);
        p.push(rect(20, y, 160, rowH, { fill: SHADE, radius: 3 }));
        p.push(text(100, y + rowH / 2, layer, { size: 14, anchor: 'middle', weight: 'bold' }));
        const w = (900 - 190 - 12 * (items.length - 1)) / items.length;
        items.forEach((item, j) => p.push(card(200 + j * (w + 12), y + 8, w, rowH - 16, item, '', { size: 12 })));
    });

    return svgDoc(930, 20 + STACK.length * (rowH + 12) + 8, p.join(''));
}

export function aiArchitectureSvg() {
    const p = [];
    // Two lanes feed the vector store
    p.push(text(20, 30, 'Résumés', { size: 13, weight: 'bold', style: 'italic' }));
    p.push(card(20, 45, 170, 80, 'Résumé Upload', 'PDF, Word (.docx) or text'));
    p.push(card(230, 45, 190, 80, 'Text Extraction', 'Reads the file’s text'));
    p.push(card(460, 45, 210, 80, 'Embedding', 'Gemini turns the text into 768 numbers'));
    p.push(text(20, 165, 'Job postings', { size: 13, weight: 'bold', style: 'italic' }));
    p.push(card(20, 180, 170, 80, 'Job Posting Saved', 'Title, description and qualifications'));
    p.push(card(460, 180, 210, 80, 'Embedding', 'Gemini turns the posting into 768 numbers'));
    p.push(arrow(190, 85, 230, 85), arrow(420, 85, 460, 85), arrow(190, 220, 460, 220));

    p.push(card(710, 100, 220, 110, 'Vector Store', 'PostgreSQL with pgvector keeps every résumé and posting vector'));
    p.push(arrow(670, 85, 710, 130), arrow(670, 220, 710, 180));

    p.push(card(970, 100, 220, 110, 'Shortlisting', 'Nearest matches by cosine similarity, computed in the database'));
    p.push(card(1230, 100, 240, 110, 'AI Scoring', 'Groq scores each shortlisted pair; Gemini is the fallback if Groq fails'));
    p.push(arrow(930, 155, 970, 155), arrow(1190, 155, 1230, 155));

    p.push(card(1230, 260, 240, 110, 'job_match_results', 'Fit score, explanation, matched skills and skill gaps'));
    p.push(arrow(1350, 210, 1350, 260));

    p.push(card(830, 420, 200, 70, 'Job Recommendations', 'Graduates’ best-fitting jobs', { size: 12 }));
    p.push(card(1050, 420, 200, 70, 'Candidate Matches', 'Partners’ ranked candidates', { size: 12 }));
    p.push(card(1270, 420, 200, 70, 'Skill Gap Analysis', 'Missing skills and resources', { size: 12 }));
    p.push(arrow(1350, 370, 930, 420), arrow(1350, 370, 1150, 420), arrow(1350, 370, 1370, 420));

    p.push(card(430, 420, 320, 70, 'Match Feedback', 'Graduates rate each match helpful or not helpful', { size: 12 }));
    p.push(line(830, 455, 750, 455), arrowHead(750, 455, -1, 0));

    return svgDoc(1490, 510, p.join(''));
}
