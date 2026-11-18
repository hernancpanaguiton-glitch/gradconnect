import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, heading, tag, tableCaption } from '../lib/format.mjs';
import { renderMarkdown } from '../lib/markdown.mjs';
import { createTableCounter } from '../lib/numbering.mjs';
import { buildDocument } from '../build.mjs';
import { docxXml, stylesXml, plainText } from './helpers.mjs';

const one = (...parts) => [{ id: 't', build: () => parts }];

/** The run properties of one paragraph style, as written in styles.xml. */
function styleBlock(styles, id) {
    const match = styles.match(new RegExp(`<w:style [^>]*w:styleId="${id}"[\\s\\S]*?</w:style>`));
    assert.ok(match, `style ${id} missing`);
    return match[0];
}

test('page geometry follows Appendix J', async () => {
    const xml = await docxXml(await buildDocument(one(body('x'))));
    assert.match(xml, /<w:pgSz w:w="12240" w:h="15840"/);
    assert.match(xml, /<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720"/);
});

test('fonts are Times New Roman at the Appendix J sizes', async () => {
    const styles = await stylesXml(await buildDocument(one(heading('A', 1), body('b'))));
    assert.match(styles, /w:ascii="Times New Roman"/);
    assert.doesNotMatch(styles, /w:ascii="(?!Times New Roman)[^"]+"/);
    assert.match(styleBlock(styles, 'Heading1'), /<w:sz w:val="24"\/>/);
    assert.match(styleBlock(styles, 'Heading2'), /<w:sz w:val="24"\/>/);
    assert.match(styleBlock(styles, 'Heading3'), /<w:sz w:val="22"\/>/);
    assert.match(styles, /<w:docDefaults>[\s\S]*<w:sz w:val="22"\/>[\s\S]*<\/w:docDefaults>/);
});

test('body paragraphs use 1.5 spacing and a half-inch first-line indent', async () => {
    const xml = await docxXml(await buildDocument(one(body('x'))));
    assert.match(xml, /<w:spacing [^>]*w:line="360"/);
    assert.match(xml, /<w:ind [^>]*w:firstLine="720"/);
});

test('markers render highlighted and verbatim', async () => {
    const xml = await docxXml(await buildDocument(one(body('Score: «TO FILL: weighted mean»'))));
    assert.match(xml, /<w:highlight w:val="yellow"\/>[\s\S]*?«TO FILL: weighted mean»/);
});

test('bold markdown inside body text', async () => {
    const xml = await docxXml(await buildDocument(one(body('a **strong** b'))));
    assert.match(xml, /<w:b\/>[\s\S]*?strong/);
});

test('special characters survive', async () => {
    const s = 'Résumé & ₱40,000 — ✔ «RENUMBER»';
    const xml = await docxXml(await buildDocument(one(body(s))));
    for (const part of ['Résumé', '&amp;', '₱40,000', '—', '✔', '«RENUMBER»']) assert.ok(xml.includes(part), part);
});

test('tags use the exact wording', async () => {
    const xml = await docxXml(await buildDocument(one(tag('REPLACE', 'List of Modules', '103'), tag('NEW', 'Abstract'))));
    assert.ok(xml.includes('[REPLACE — List of Modules, p. 103]'));
    assert.ok(xml.includes('[NEW — insert after: Abstract]'));
});

test('table counter starts at 6', () => {
    const c = createTableCounter();
    assert.equal(c.next(), 6);
    assert.equal(c.next(), 7);
});

test('table caption is "Table n" then the title in caps', async () => {
    const parts = tableCaption(6, 'Data Dictionary of Users Table');
    assert.equal(parts.length, 2);
    const text = plainText(await docxXml(await buildDocument(one(...parts))));
    assert.match(text, /Table 6\s*DATA DICTIONARY OF USERS TABLE/);
});

test('a fourth heading level sits below level 3 at body size', async () => {
    const buffer = await buildDocument(one(heading('A', 4)));
    const styles = await stylesXml(buffer);
    assert.match(styleBlock(styles, 'Heading4'), /<w:sz w:val="22"\/>/);
    assert.match(styleBlock(styles, 'Heading4'), /<w:i\/>/);
    assert.match(await docxXml(buffer), /<w:pStyle w:val="Heading4"\/>/);
    assert.equal(renderMarkdown('#### Role').length, 1);
});

test('list numbers and bullets are Times New Roman too', async () => {
    const buffer = await buildDocument(one(...renderMarkdown('- one\n\n1. first')));
    const numbering = await (await import('jszip')).default.loadAsync(buffer).then((z) => z.file('word/numbering.xml').async('string'));
    // docx-js also writes its own default bullet list (●), which nothing here uses.
    const levels = numbering.match(/<w:lvl [\s\S]*?<\/w:lvl>/g).filter((l) => /w:lvlText w:val="(•|%1\.)"/.test(l));
    assert.equal(levels.length, 2);
    for (const lvl of levels) assert.match(lvl, /w:ascii="Times New Roman"/);
});

test('markdown subset', () => {
    const out = renderMarkdown('# A\n\npara **bold**\n\n- one\n- two\n\n1. first');
    assert.equal(out.length, 5);
});
