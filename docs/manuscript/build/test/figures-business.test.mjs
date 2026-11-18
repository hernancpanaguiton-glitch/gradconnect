import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bmcSvg, CANVAS, ROADMAP, roadmapSvg, validationBoardSvg } from '../figures/business.mjs';

const words = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ').replace(/&amp;/g, '&');

test('the canvas keeps all eight blocks and their points', () => {
    const w = words(bmcSvg());
    for (const t of ['PROBLEM', 'SOLUTION', 'VALUE PROPOSITION', 'CUSTOMER SEGMENTS', 'KEY METRICS', 'CHANNELS', 'COST STRUCTURE', 'REVENUE STREAMS'])
        assert.ok(w.includes(t), t);
    assert.ok(Object.values(CANVAS).flat().length >= 40);
});

test('the validation board has three hypotheses across three stages and six experiments', () => {
    const w = words(validationBoardSvg());
    for (const t of ['CUSTOMER', 'PROBLEM', 'SOLUTION', 'START', '1ST PIVOT', '2ND PIVOT', 'DESIGN EXPERIMENT']) assert.ok(w.includes(t), t);
    assert.ok(!w.includes('profile profile'));
});

test('the roadmap shows all five phases in order', () => {
    const w = words(roadmapSvg());
    let at = -1;
    for (const [phase, name] of ROADMAP) {
        const i = w.indexOf(`${phase} ${name}`);
        assert.ok(i > at, phase);
        at = i;
    }
});
