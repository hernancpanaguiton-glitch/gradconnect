import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIGURES as IN_DOC } from '../sections/figures.mjs';
import { FIGURES as RENDERERS } from '../figures/render-all.mjs';
import { SHOTS } from '../figures/screenshots.mjs';

test('every figure in the document is drawn or screenshotted, and keeps a unique manuscript number', () => {
    const shots = new Set(SHOTS.map(([, file]) => file));
    for (const [, file] of IN_DOC) assert.ok(RENDERERS[file] || shots.has(file), file);
    const numbers = IN_DOC.map(([n]) => n).filter(Boolean);
    assert.equal(new Set(numbers).size, numbers.length);
});

test('the storyboard covers figures 31 to 42', () => {
    assert.deepEqual(SHOTS.map(([n]) => n), Array.from({ length: 12 }, (_, i) => 31 + i));
});
