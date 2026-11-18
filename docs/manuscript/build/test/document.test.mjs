import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDocument, splitAfterCoverTable } from '../build.mjs';
import { docxXml, plainText } from './helpers.mjs';

const fullText = async () => plainText(await docxXml(await buildDocument()));

test('sections appear in Appendix X order', async () => {
    const text = await fullText();
    // Each section is found by its own merge tag, which appears exactly once;
    // section names alone also occur in running text ("Recommendations lists jobs…").
    const order = [
        'Corrections to Existing Pages',
        '[NEW — insert after: Approval Sheet]',
        '[REPLACE — Validation Board, p. 46]',
        '[REPLACE — Data Dictionary, p. 83]',
        '[NEW — insert after: Entity Relationship Diagram]',
        '[REPLACE — Network Model, p. 96]',
        '[REPLACE — Technology Stack Diagram, p. 99]',
        '[REPLACE — List of Modules, p. 103]',
        '[NEW — insert after: List of Modules]',
        '[NEW — insert after: Integration Testing]',
        '[NEW — insert after: Alpha Testing]',
        '[NEW — insert after: Acceptance Testing]',
        '[NEW — insert after: Installation Guide]',
        '[NEW — insert after: User Guide]',
        '[NEW — insert after: Conclusion]',
        '[NEW — insert after: Appendices]',
    ];
    const pos = order.map((s) => text.indexOf(s));
    assert.deepEqual(order.filter((_, i) => pos[i] < 0), []);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos);
    for (const s of order) assert.equal(text.split(s).length - 1, 1, `appears once: ${s}`);
});

test('cover table counts match the markers in the text', async () => {
    const [cover, rest] = splitAfterCoverTable(await fullText());
    assert.ok(cover.length > 0 && rest.length > 0);
    for (const kind of ['TO FILL', 'ASSIGN PROGRAMMER', 'SCREENSHOT', 'RENUMBER']) {
        const actual = (rest.match(new RegExp(`«${kind}`, 'g')) || []).length;
        assert.match(cover, new RegExp(`${kind}\\D+${actual}\\b`), kind);
    }
    assert.doesNotMatch(cover, /«/, 'the cover table never counts itself');
});

test('no stray placeholders', async () => {
    const text = await fullText();
    assert.doesNotMatch(text, /\b(TBD|TODO|lorem|XXX)\b/i);
    assert.doesNotMatch(text, /MySQL/i);
});

test('table numbers run from 6 without gaps', async () => {
    // Only caption lines: running text also refers to the manuscript's Table 3 and Table 20.
    const nums = [...(await fullText()).matchAll(/^Table (\d+)$/gm)].map((m) => +m[1]);
    assert.ok(nums.length > 50);
    assert.deepEqual(nums, nums.map((_, i) => 6 + i));
});
