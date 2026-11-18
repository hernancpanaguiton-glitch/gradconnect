import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ALPHA_CRITERIA, acceptanceSection, alphaSection, conclusionSection, correctionsSection,
    formsChecklistSection, recommendationsSection, validationBoardSection,
} from '../sections/templates.mjs';
import { buildDocument } from '../build.mjs';
import { docxXml, plainText, readSection } from './helpers.mjs';

test('alpha form has the 14 Appendix U criteria verbatim', async () => {
    const xml = await docxXml(await buildDocument([alphaSection]));
    for (const c of ALPHA_CRITERIA) assert.ok(xml.includes(c), c);
    assert.equal(ALPHA_CRITERIA.length, 14);
    for (const g of ['Graphical User Interface (GUI)', 'System Performance']) assert.ok(xml.includes(g), g);
});

test('alpha interpretation uses equal intervals over the 4-point form, and flags the scale question', async () => {
    const text = plainText(await docxXml(await buildDocument([alphaSection])));
    for (const r of ['1.00–1.75', '1.76–2.50', '2.51–3.25', '3.26–4.00']) assert.ok(text.includes(r), r);
    assert.ok(text.includes('«TO FILL: confirm with the adviser which scale the alpha evaluation uses»'));
});

test('acceptance matrix has AC1–AC9 and no prefilled decisions', async () => {
    const xml = await docxXml(await buildDocument([acceptanceSection]));
    for (let i = 1; i <= 9; i++) assert.ok(xml.includes(`AC${i}`), `AC${i}`);
    assert.doesNotMatch(xml, />(Accept|Reject|Yes|No)</);
    assert.ok(xml.includes('Hernan C. Panaguiton'));
    assert.ok(xml.includes('Dr. Janette Q. Tanquis'));
});

test('templates contain no invented numbers', async () => {
    const xml = await docxXml(await buildDocument([alphaSection, acceptanceSection, conclusionSection]));
    const text = xml.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text.replace(/\d\.\d\d\s*–\s*\d\.\d\d/g, ''), /\b\d\.\d{2}\b/);
});

test('every recommendation cites its source', () => {
    const items = readSection('recommendations.md').split('\n').filter((l) => /^\d+\. /.test(l));
    assert.ok(items.length >= 5);
    for (const l of items.slice(0, -1)) assert.match(l, /\(.+\)\s*$/, l);
    assert.match(items.at(-1), /«TO FILL: recommendations from the evaluation results»/);
});

test('recommendations carry the findings made while building this document', () => {
    const md = readSection('recommendations.md');
    assert.match(md, /clearance/i);
    assert.match(md, /events page/i);
    assert.match(md, /Colleges and Programs/);
});

test('conclusion has one slot per objective', () => {
    const md = readSection('conclusion.md');
    assert.ok((md.match(/«TO FILL: finding for /g) || []).length >= 10);
});

test('every remaining section renders its tag', async () => {
    const xml = await docxXml(await buildDocument([validationBoardSection, conclusionSection, recommendationsSection, formsChecklistSection, correctionsSection]));
    for (const t of [
        '[REPLACE — Validation Board, p. 46]',
        '[NEW — insert after: User Guide]',
        '[NEW — insert after: Conclusion]',
        '[NEW — insert after: Appendices]',
    ]) assert.ok(xml.includes(t), t);
    for (const s of ['Stage 1', 'Stage 2', 'Stage 3']) assert.ok(xml.includes(s), s);
});

test('corrections list names each fix', () => {
    const md = readSection('corrections.md');
    for (const s of ['Appendix AB', 'Quiño', 'Jackson', 'Mainga', 'Marine', 'MLA']) assert.ok(md.includes(s), s);
});
