import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { queryJson, extractSchema } from '../extract/db.mjs';
import { dataDictionarySection } from '../sections/data-dictionary.mjs';
import { renderDbml } from '../sections/erd-dbml.mjs';
import { buildDocument } from '../build.mjs';
import { docxXml, load } from './helpers.mjs';

test('queryJson refuses anything but a read', async () => {
    await assert.rejects(queryJson('DELETE FROM users'), /read-only/);
});

test('schema snapshot is complete', () => {
    const schema = load('schema.json');
    assert.ok(schema.length >= 40, String(schema.length));
    for (const t of ['users', 'graduate_profiles', 'companies', 'job_postings', 'roles', 'permissions']) {
        assert.ok(schema.some((s) => s.name === t), t);
    }
    for (const t of ['cache', 'sessions', 'jobs', 'migrations']) {
        assert.ok(!schema.some((s) => s.name === t), t);
    }
    const emb = schema.find((s) => s.name === 'resumes').columns.find((c) => c.name === 'embedding');
    assert.equal(emb.type, 'vector(768)');
    assert.equal(emb.size, '768');
});

test('size is a length, never a timestamp precision', () => {
    const users = load('schema.json').find((s) => s.name === 'users').columns;
    assert.equal(users.find((c) => c.name === 'created_at').size, '—');
    assert.equal(users.find((c) => c.name === 'email').size, '255');
});

test('composite keys are labelled with their partner columns', () => {
    const col = (t, c) => load('schema.json').find((s) => s.name === t).columns.find((x) => x.name === c);
    assert.ok(col('users', 'email').constraints.includes('UNIQUE'));
    assert.ok(col('clearance_records', 'office').constraints.includes('UNIQUE (with graduate_profile_id)'));
    assert.ok(col('clearance_records', 'graduate_profile_id').constraints.includes('UNIQUE (with office)'));
    assert.ok(col('model_has_roles', 'model_id').constraints.includes('PK (with role_id, model_type)'));
    assert.ok(!col('clearance_records', 'office').constraints.includes('UNIQUE'));
});

test('descriptions claim nothing the code does not do, and read cleanly', () => {
    const desc = load('column-descriptions.json');
    assert.deepEqual(Object.entries(desc).filter(([, d]) => /\b(\w+) \1\b/i.test(d)).map(([k]) => k), []);
    assert.match(desc['job_posting_skill.weight'], /not currently used/);
});

test('every column has a description and none are stale', () => {
    const schema = load('schema.json');
    const desc = load('column-descriptions.json');
    const keys = schema.flatMap((t) => t.columns.map((c) => `${t.name}.${c.name}`));
    assert.deepEqual(keys.filter((k) => !desc[k]), []);
    assert.deepEqual(Object.keys(desc).filter((k) => !keys.includes(k)), []);
});

test('data dictionary renders one captioned table per schema table', async () => {
    const xml = await docxXml(await buildDocument([dataDictionarySection]));
    assert.ok(xml.includes('[REPLACE — Data Dictionary, p. 83]'));
    assert.equal((xml.match(/DATA DICTIONARY OF /g) || []).length, load('schema.json').length);
    assert.doesNotMatch(xml, /MySQL/i);
});

test('DBML covers every table and foreign key', () => {
    const schema = load('schema.json');
    const dbml = renderDbml(schema);
    for (const t of schema) assert.match(dbml, new RegExp(`Table ${t.name} \\{`));
    const fks = schema.flatMap((t) => t.columns.flatMap((c) => c.constraints.filter((k) => k.startsWith('FK → '))));
    assert.equal((dbml.match(/^Ref: /gm) || []).length, fks.length);
});

test('a failed extraction leaves the previous snapshot untouched', async () => {
    const out = join(tmpdir(), 'schema-guard.json');
    writeFileSync(out, '["previous"]');
    await assert.rejects(
        extractSchema({ query: async () => { throw new Error('db down'); }, outFile: out }),
        /db down/,
    );
    assert.equal(readFileSync(out, 'utf8'), '["previous"]');
});
