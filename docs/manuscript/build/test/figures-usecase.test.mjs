import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USE_CASES, useCaseSvg } from '../figures/usecase.mjs';
import { load } from './helpers.mjs';

const perms = load('role-permissions.json');
const words = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ');

test('figures 20 to 30 are all drawn, in order', () => {
    assert.deepEqual(USE_CASES.map((m) => m.fig), [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    for (const m of USE_CASES) assert.ok(words(useCaseSvg(m)).includes(m.title), m.title);
});

test('every actor on a case is drawn, and every include/extend names a real base', () => {
    for (const m of USE_CASES) {
        const actors = new Set([...m.actors, ...(m.secondary ?? [])]);
        const ids = new Set(m.cases.map(([id]) => id));
        for (const [id, , o] of m.cases) {
            for (const a of o.actors ?? []) assert.ok(actors.has(a), `${m.title}/${id}: ${a}`);
            const base = o.include ?? o.extend;
            if (base) assert.ok(ids.has(base), `${m.title}/${id}`);
        }
    }
});

test('report actors are exactly the roles holding the report permissions', () => {
    const labels = { admin: 'Admin', alumni_affairs: 'Alumni Affairs Office', sao: 'Student Affairs Office', department_head: 'Department Head' };
    const holders = (perm) => Object.keys(perms).filter((r) => perms[r].includes(perm)).map((r) => labels[r]).sort();
    const cases = new Map(USE_CASES.find((m) => m.fig === 30).cases.map(([id, , o]) => [id, o]));
    assert.deepEqual([...cases.get('emp').actors].sort(), holders('reports.employability.view'));
    assert.deepEqual([...cases.get('po').actors].sort(), holders('program_outcomes.view'));
});
