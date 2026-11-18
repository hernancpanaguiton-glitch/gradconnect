import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFreshReport, assertSafeToRunTests } from '../extract/run-tests.mjs';
import { readJunit } from '../lib/junit.mjs';
import { buildTestingSection, testingSection } from '../sections/testing.mjs';
import { buildDocument } from '../build.mjs';
import { docxXml, formatDate, load, plainText, read } from './helpers.mjs';

const RUN = {
    runDate: '2026-01-02', gitCommit: 'abc1234', php: '8.4.0', node: '26.0.0',
    totals: { php: { passed: 1, skipped: 0, failed: 0 }, frontend: { passed: 1, skipped: 0, failed: 0 } },
};
const CASE = { id: 'U1', module: 'Login Process', unit: 'Log in', description: 'Valid credentials', expected: 'Signed in', testRef: 'A::ok' };

test('refuses to run inside a container', () => {
    assert.throws(() => assertSafeToRunTests({ env: {}, exists: (p) => p === '/.dockerenv' }), /Refusing to run tests/);
});

test('refuses a non-sqlite database', () => {
    assert.throws(() => assertSafeToRunTests({ env: { DB_CONNECTION: 'pgsql' }, exists: () => false }), /Refusing to run tests/);
});

test('refuses when a cached config could override the test database', () => {
    assert.throws(
        () => assertSafeToRunTests({ env: {}, exists: (p) => p.endsWith('bootstrap/cache/config.php') }),
        /Refusing to run tests/,
    );
});

test('a report older than the run is rejected as stale', () => {
    assert.throws(() => assertFreshReport('x.xml', 1000, () => ({ mtimeMs: 999 })), /stale report/);
    assert.doesNotThrow(() => assertFreshReport('x.xml', 1000, () => ({ mtimeMs: 1001 })));
});

test('allows a plain host shell', () => {
    assert.doesNotThrow(() => assertSafeToRunTests({ env: {}, exists: () => false }));
});

test('readJunit reads passed, failed and skipped cases', () => {
    const xml = `<testsuites><testsuite>
      <testcase classname="A" name="ok"/>
      <testcase classname="A" name="bad"><failure>boom</failure></testcase>
      <testcase classname="A" name="err"><error>x</error></testcase>
      <testcase classname="B" name="skip"><skipped/></testcase>
    </testsuite></testsuites>`;
    const r = readJunit(xml);
    assert.equal(r.get('A::ok').status, 'passed');
    assert.equal(r.get('A::bad').status, 'failed');
    assert.equal(r.get('A::err').status, 'failed');
    assert.equal(r.get('B::skip').status, 'skipped');
});

test('every selected case exists in the recorded run, and none were skipped', () => {
    const results = new Map([...readJunit(read('tests/phpunit.xml')), ...readJunit(read('tests/vitest.xml'))]);
    for (const c of [...load('unit-cases.json'), ...load('integration-cases.json')]) {
        assert.ok(results.has(c.testRef), `missing: ${c.testRef}`);
        assert.notEqual(results.get(c.testRef).status, 'skipped', c.testRef);
    }
});

test('a missing test reference fails the build', async () => {
    await assert.rejects(
        buildTestingSection({ unitCases: [{ ...CASE, testRef: 'Nope::nope' }], integrationCases: [] }),
        /missing: Nope::nope/,
    );
});

test('Date Tested is the recorded run date, not the build date', async () => {
    const parts = await buildTestingSection({ unitCases: [CASE], integrationCases: [], run: RUN, results: new Map([['A::ok', { status: 'passed' }]]) });
    const text = plainText(await docxXml(await buildDocument([{ id: 't', build: () => parts }])));
    assert.ok(text.includes('January 2, 2026'));
    const today = new Date();
    assert.ok(!text.includes(formatDate(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)));
});

test('a failed test renders as failed', async () => {
    const parts = await buildTestingSection({ unitCases: [CASE], integrationCases: [], run: RUN, results: new Map([['A::ok', { status: 'failed' }]]) });
    const text = plainText(await docxXml(await buildDocument([{ id: 't', build: () => parts }])));
    assert.ok(text.includes('Did not perform as expected'));
    assert.match(text, /\bFailed\b/);
});

test('the real section renders the recorded run date', async () => {
    const run = load('tests/run.json');
    const xml = await docxXml(await buildDocument([testingSection]));
    assert.ok(xml.includes(formatDate(run.runDate)));
    assert.ok(xml.includes('[NEW — insert after: List of Modules]'));
    assert.ok(xml.includes('TEST RUN SUMMARY'));
});

test('rows claim no more than their tests check (final review findings)', () => {
    const byId = Object.fromEntries([...load('unit-cases.json'), ...load('integration-cases.json')].map((c) => [c.id, c]));
    assert.doesNotMatch(byId.U18.expected, /All accounts are listed/);
    assert.doesNotMatch(byId.U23.expected, /exactly/);
    assert.match(byId.U84.description, /Mark all as read/);
    assert.equal(byId.U70.expected, 'The band reads "Needs Improvement"');
    assert.doesNotMatch(byId.I4.process, /saved posting/i);
    assert.doesNotMatch(byId.I17.process, /answers they created/);
});

test('every unit case names a real module', () => {
    const names = new Set(load('modules.json').map((m) => m.module));
    assert.deepEqual(load('unit-cases.json').filter((c) => !names.has(c.module)).map((c) => c.id), []);
});

test('the required integration flows are covered', () => {
    const text = load('integration-cases.json').map((c) => `${c.module1} ${c.process} ${c.module2}`).join('\n').toLowerCase();
    for (const flow of ['registration', 'approv', 'match', 'notif', 'survey', 'résumé']) assert.ok(text.includes(flow), flow);
});

test('modules with no automated test are named, not hidden', async () => {
    const lines = plainText(await docxXml(await buildDocument([testingSection]))).split('\n');
    assert.ok(lines.some((l) => /no automated test/i.test(l) && l.includes('Colleges and Programs')));
});
