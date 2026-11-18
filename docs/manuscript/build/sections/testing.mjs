/**
 * [NEW] Testing/Quality Assurance Phase — the Testing Plan, a summary of the
 * recorded run, and the Unit (Appendix S) and Integration (Appendix T)
 * tables. Every Actual Result and Date Tested comes from the recorded run;
 * a row whose test is missing from that run stops the build.
 */
import { readFileSync } from 'node:fs';
import { heading, simpleTable, tableCaption, tag, TEXT_WIDTH_LANDSCAPE, body } from '../lib/format.mjs';
import { renderMarkdown } from '../lib/markdown.mjs';
import { readJunit } from '../lib/junit.mjs';
import { loadData } from '../lib/data.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
const formatDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);

    return `${MONTHS[m - 1]} ${d}, ${y}`;
};

const OUTCOME = {
    passed: ['Performed as expected', 'Passed'],
    failed: ['Did not perform as expected', 'Failed'],
};

const recordedResults = () => new Map([
    ...readJunit(readFileSync(new URL('../data/tests/phpunit.xml', import.meta.url), 'utf8')),
    ...readJunit(readFileSync(new URL('../data/tests/vitest.xml', import.meta.url), 'utf8')),
]);

function outcome(results, testRef) {
    const r = results.get(testRef);
    if (!r) throw new Error(`missing: ${testRef}`);
    if (!OUTCOME[r.status]) throw new Error(`skipped test used as evidence: ${testRef}`);

    return OUTCOME[r.status];
}

export async function buildTestingSection(overrides = {}, ctx = { tables: { next: (() => { let n = 0; return () => ++n; })() } }) {
    const unitCases = overrides.unitCases ?? loadData('unit-cases.json');
    const integrationCases = overrides.integrationCases ?? loadData('integration-cases.json');
    const run = overrides.run ?? loadData('tests/run.json');
    const results = overrides.results ?? recordedResults();
    const date = formatDate(run.runDate);

    const unitRows = unitCases.map((c) => [c.module, c.unit, date, c.id, c.description, c.expected, ...outcome(results, c.testRef)]);
    const integrationRows = integrationCases.map((c) => [c.id, c.module1, c.process, c.module2, c.precondition, ...outcome(results, c.testRef)]);

    const { php, frontend } = run.totals;
    const sum = (t) => t.passed + t.skipped + t.failed;
    const summaryRows = [
        [`Server-side (PHPUnit, PHP ${run.php})`, String(sum(php)), String(php.passed), String(php.skipped), String(php.failed)],
        [`Pages (Vitest, Node ${run.node})`, String(sum(frontend)), String(frontend.passed), String(frontend.skipped), String(frontend.failed)],
        ['Total', String(sum(php) + sum(frontend)), String(php.passed + frontend.passed), String(php.skipped + frontend.skipped), String(php.failed + frontend.failed)],
    ];

    const modules = overrides.modules ?? (overrides.unitCases ? [] : loadData('modules.json'));
    const untested = modules.map((m) => m.module).filter((name) => !unitCases.some((c) => c.module === name));

    return [
        tag('NEW', 'List of Modules'),
        heading('Testing/Quality Assurance Phase', 2),
        ...renderMarkdown(readFileSync(new URL('./testing-plan.md', import.meta.url), 'utf8')),
        ...tableCaption(ctx.tables.next(), 'Test Run Summary'),
        simpleTable(['Test Suite', 'Tests Run', 'Passed', 'Skipped', 'Failed'], summaryRows, [4600, 1900, 1900, 1900, 1900], TEXT_WIDTH_LANDSCAPE),
        body(`The run was recorded on ${date} from version ${run.gitCommit} of the source code.`),
        heading('Unit Testing', 3),
        body(
            'The table below lists representative unit tests for each module, taken from the recorded run. '
            + (untested.length === 1
                ? `One module, ${untested[0]}, has no automated test yet and is covered only by the manual test guide.`
                : untested.length
                    ? `These modules have no automated test yet and are covered only by the manual test guide: ${untested.join(', ')}.`
                    : 'Every module has at least one automated test.'),
        ),
        ...tableCaption(ctx.tables.next(), 'Unit Testing'),
        simpleTable(
            ['Module Name', 'Unit Name', 'Date Tested', 'Test Case ID', 'Test Case Description', 'Expected Result', 'Actual Result', 'Remarks'],
            unitRows,
            [1500, 1500, 1150, 700, 2600, 2350, 1400, 1000],
            TEXT_WIDTH_LANDSCAPE,
        ),
        heading('Integration Testing', 3),
        body('The table below lists the flows in which one module passes work to another, each confirmed by an automated test in the recorded run.'),
        ...tableCaption(ctx.tables.next(), 'Integration Testing'),
        simpleTable(
            ['Test Case ID', 'Module 1', 'Integration Process', 'Module 2', 'Pre-condition', 'Result', 'Remarks'],
            integrationRows,
            [700, 1700, 3300, 1700, 2400, 1400, 1000],
            TEXT_WIDTH_LANDSCAPE,
        ),
    ];
}

export const testingSection = {
    id: 'testing',
    landscape: true,
    build: (ctx) => buildTestingSection({}, ctx),
};
