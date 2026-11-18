import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ERD_GROUPS, erdGroupSvg, erdOverviewSvg } from '../figures/erd.mjs';
import { load } from './helpers.mjs';

const schema = load('schema.json');

test('every table belongs to exactly one ERD group', () => {
    const grouped = ERD_GROUPS.flatMap((g) => g.tables);
    assert.deepEqual([...grouped].sort(), schema.map((t) => t.name).sort());
    assert.equal(new Set(grouped).size, grouped.length);
});

test('the overview draws every table with its keys only', async () => {
    const svg = await erdOverviewSvg(schema);
    for (const t of schema) assert.ok(svg.includes(`>${t.name}<`), t.name);
    assert.ok(svg.includes('>email<') === false, 'non-key columns are left out of the overview');
    assert.match(svg, /^<svg [^>]*width="\d+" height="\d+"/);
});

test('a group draws all columns of its own tables and keys of the tables it points to', async () => {
    const group = ERD_GROUPS.find((g) => g.tables.includes('job_postings'));
    const svg = await erdGroupSvg(schema, group);
    assert.ok(svg.includes('>salary_range<'));
    assert.ok(svg.includes('>companies<'));
    assert.ok(svg.includes('>users<'), 'a table from another group appears as a key-only box');
});

test('the database design shows every group and table, linked by cross-group keys', async () => {
    const { databaseDesignSvg } = await import('../figures/erd.mjs');
    const svg = await databaseDesignSvg(schema);
    for (const g of ERD_GROUPS) assert.ok(svg.includes(`>${g.title.replace(/&/g, '&amp;')}<`), g.title);
    for (const t of schema) assert.ok(svg.includes(`>${t.name}<`), t.name);
    assert.match(svg, /\d+ FK/);
});
