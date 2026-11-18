import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiArchitectureSvg, networkModelSvg, networkTopologySvg, techStackSvg } from '../figures/architecture.mjs';

// Compare against the figure's words, joined across wrapped lines.
const words = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ').replace(/&amp;/g, '&');
const has = (svg, ...facts) => { const w = words(svg); for (const f of facts) assert.ok(w.includes(f), f); };

test('network model shows the three tiers and the real services and ports', () => {
    const svg = networkModelSvg();
    has(svg, 'Presentation Tier', 'Application Tier', 'Data Tier', 'Web Application', 'Background Worker',
        'PostgreSQL 16 + pgvector', ':8000', ':5432', 'Groq', 'Gemini');
    assert.ok(!/mysql/i.test(svg));
});

test('network topology is a star around the central server', () => {
    const svg = networkTopologySvg();
    has(svg, 'Internet', 'GradConnect Server', 'Graduate Student', 'Alumni', 'Industry Partner',
        'Alumni Affairs Office', 'Student Affairs Office', 'Department Head', 'Admin');
});

test('technology stack names the installed versions', () => {
    const svg = techStackSvg();
    has(svg, 'React 18.3', 'TypeScript 5.9', 'Tailwind CSS 3.4', 'Vite 7.3', 'Inertia.js 2.0', 'Laravel 13.18',
        'PHP 8.3', 'PostgreSQL 16', 'pgvector', 'Docker Compose', 'PHPUnit 12.5', 'Vitest 3.2');
});

test('AI architecture follows the real matching pipeline', () => {
    const svg = aiArchitectureSvg();
    has(svg, 'Gemini', '768', 'cosine similarity', 'Groq', 'fallback', 'job_match_results', 'Skill Gap Analysis');
});

test('network design follows the manuscript: devices, Internet, web server, AI module, database', async () => {
    const { networkDesignSvg } = await import('../figures/architecture.mjs');
    const svg = networkDesignSvg();
    has(svg, 'Smartphone', 'Internet', 'Web Application Server', 'AI Résumé Matching Module', 'Database Server', 'PostgreSQL 16');
    assert.ok(!/mysql/i.test(svg));
});
