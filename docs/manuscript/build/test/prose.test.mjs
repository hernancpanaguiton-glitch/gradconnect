import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { abstractSection, installationSection, networkSection, techStackSection, userGuideSection } from '../sections/prose.mjs';
import { buildDocument } from '../build.mjs';
import { docxXml, fencedCommands, lockedMajorMinor, readSection } from './helpers.mjs';

const FILES = ['abstract.md', 'network.md', 'tech-stack.md', 'installation-guide.md', 'user-guide.md'];

test('no MySQL anywhere', () => {
    for (const f of FILES) assert.doesNotMatch(readSection(f), /mysql/i, f);
});

test('tech stack versions match the lockfiles', () => {
    const md = readSection('tech-stack.md');
    const locked = lockedMajorMinor(
        ['laravel/framework', 'inertiajs/inertia-laravel', 'spatie/laravel-permission'],
        ['react', '@inertiajs/react', 'typescript', 'tailwindcss', 'vite'],
    );
    for (const [pkg, ver] of locked) assert.ok(md.includes(ver), `${pkg} ${ver}`);
    assert.match(md, /PostgreSQL 16/);
    assert.match(md, /pgvector/);
});

test('network text names the real database and AI services', () => {
    const md = readSection('network.md');
    for (const s of ['PostgreSQL 16', 'pgvector', 'Groq', 'Gemini', '768']) assert.ok(md.includes(s), s);
});

test('installation commands are the verified ones', () => {
    const allowed = new Set(['cp .env.docker.example .env.docker',
        'docker compose up -d', 'docker compose up -d --build', 'docker compose down', 'docker compose ps',
        'docker compose logs -f app', 'docker compose exec app php artisan migrate', 'docker compose exec app php artisan migrate:fresh --seed']);
    const commands = fencedCommands(readSection('installation-guide.md'));
    assert.ok(commands.length >= 4);
    for (const cmd of commands) assert.ok(allowed.has(cmd), cmd);
});

test('installation guide gives the addresses and the demo password', () => {
    const md = readSection('installation-guide.md');
    for (const s of ['http://localhost:8000', 'http://localhost:8025', '`password`']) assert.ok(md.includes(s), s);
    assert.doesNotMatch(md, /artisan test/, 'running tests inside Docker resets the live database');
});

test('user guide covers all seven roles', () => {
    const md = readSection('user-guide.md');
    for (const r of ['Graduate Student', 'Alumni', 'Industry Partner', 'Alumni Affairs Office', 'Student Affairs Office', 'Department Head', 'Administrator']) {
        assert.match(md, new RegExp(`^#{2,4} .*${r}`, 'm'), r);
    }
    const shots = [...md.matchAll(/^!\[.+\]\((.+\.png)\)$/gm)].map((m) => m[1]);
    assert.ok(shots.length >= 7);
    for (const f of shots) assert.ok(existsSync(new URL(`../../figures/${f}`, import.meta.url)), f);
});

test('the skills tab opens the student’s college group, as the app does', () => {
    const md = readSection('user-guide.md');
    assert.doesNotMatch(md, /own course opens first/);
    assert.match(md, /student['’]s own college opens first/);
});

test('abstract length and findings placeholder', () => {
    const md = readSection('abstract.md');
    const words = md.replace(/^#.*$/gm, '').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 200 && words <= 300, String(words));
    assert.ok(md.includes('«TO FILL: key findings from the acceptability evaluation»'));
});

test('each prose section renders its merge tags', async () => {
    const xml = await docxXml(await buildDocument([abstractSection, networkSection, techStackSection, installationSection, userGuideSection]));
    for (const t of [
        '[NEW — insert after: Approval Sheet]',
        '[REPLACE — Network Model, p. 96]',
        '[REPLACE — Network Topology, p. 97]',
        '[REPLACE — Technology Stack Diagram, p. 99]',
        '[REPLACE — Software Development Specification, p. 100]',
        '[NEW — insert after: Acceptance Testing]',
        '[NEW — insert after: Installation Guide]',
    ]) assert.ok(xml.includes(t), t);
});
