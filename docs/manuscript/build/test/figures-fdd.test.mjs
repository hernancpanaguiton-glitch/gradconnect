import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FDD_GROUPS, fddSvg } from '../figures/fdd.mjs';
import { load } from './helpers.mjs';

test('the FDD places every module exactly once', () => {
    const placed = FDD_GROUPS.flatMap(([, m]) => m);
    assert.deepEqual([...placed].sort(), load('modules.json').map((m) => m.module).sort());
    assert.equal(new Set(placed).size, placed.length);
});

test('the FDD draws each subsystem', () => {
    const w = [...fddSvg().matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ');
    for (const [g] of FDD_GROUPS) for (const word of g.split(' ')) assert.ok(w.includes(word), g);
});
