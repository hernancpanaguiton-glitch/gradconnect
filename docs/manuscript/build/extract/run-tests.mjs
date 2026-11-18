/**
 * Records one run of both test suites as evidence for the Unit and
 * Integration Testing tables: JUnit reports plus run.json (date, commit,
 * versions, totals).
 *
 * Runs on the host only. Inside the Docker app container the environment's
 * DB_CONNECTION=pgsql outranks phpunit.xml, and RefreshDatabase then resets
 * the live database — so the runner refuses there, and forces the in-memory
 * SQLite database on the child process everywhere else.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJunit, totals } from '../lib/junit.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../data/tests/', import.meta.url));
const PHP = 'C:\\Users\\Carlie\\.config\\herd\\bin\\php84\\php.exe';

export function assertSafeToRunTests({ env = process.env, exists = existsSync } = {}) {
    if (exists('/.dockerenv')) {
        throw new Error('Refusing to run tests inside a container: the container database would be reset.');
    }
    if (env.DB_CONNECTION && env.DB_CONNECTION !== 'sqlite') {
        throw new Error(`Refusing to run tests with DB_CONNECTION=${env.DB_CONNECTION}: RefreshDatabase would reset it.`);
    }
    // A cached config ignores environment variables, so the forced SQLite
    // setting below would not apply and the tests could reach the real database.
    if (exists(`${REPO_ROOT}bootstrap/cache/config.php`)) {
        throw new Error('Refusing to run tests while the config is cached: run `php artisan config:clear` first.');
    }
}

/** A report must have been written by this run, not left over from an earlier one. */
export function assertFreshReport(file, startMs, stat = statSync) {
    if (stat(file).mtimeMs < startMs) throw new Error(`stale report: ${file} predates this run`);
}

const localDate = (d = new Date()) => [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => String(n).padStart(i ? 2 : 4, '0')).join('-');

function run(command, args, options = {}) {
    const result = spawnSync(command, args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
    if (result.error) throw result.error;

    return result;
}

export function recordRun() {
    assertSafeToRunTests();
    mkdirSync(OUT_DIR, { recursive: true });

    const phpunit = `${OUT_DIR}phpunit.xml`;
    const vitest = `${OUT_DIR}vitest.xml`;
    // Clear the previous evidence, so a suite that dies before reporting
    // cannot leave old results to be recorded under today's date.
    for (const file of [phpunit, vitest]) rmSync(file, { force: true });
    const started = Date.now();

    run(PHP, ['artisan', 'test', '--log-junit', phpunit], {
        env: { ...process.env, DB_CONNECTION: 'sqlite', DB_DATABASE: ':memory:' },
    });
    // Vitest's own entry file, run by this Node: no shell, so nothing is re-parsed.
    run(process.execPath, [`${REPO_ROOT}node_modules/vitest/vitest.mjs`, 'run', '--reporter=junit', `--outputFile=${vitest}`]);

    for (const file of [phpunit, vitest]) {
        if (!existsSync(file)) throw new Error(`no report written: ${file}`);
        assertFreshReport(file, started);
    }

    const record = {
        runDate: localDate(),
        gitCommit: run('git', ['-c', `safe.directory=${REPO_ROOT.replace(/\\/g, '/').replace(/\/$/, '')}`, 'rev-parse', '--short', 'HEAD']).stdout.trim(),
        php: run(PHP, ['-r', 'echo PHP_VERSION;']).stdout.trim(),
        node: process.version.replace(/^v/, ''),
        totals: {
            php: totals(readJunit(readFileSync(phpunit, 'utf8'))),
            frontend: totals(readJunit(readFileSync(vitest, 'utf8'))),
        },
    };
    writeFileSync(`${OUT_DIR}run.json`, `${JSON.stringify(record, null, 2)}\n`);

    return record;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log(JSON.stringify(recordRun(), null, 2));
}
