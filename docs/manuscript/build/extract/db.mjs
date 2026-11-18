/**
 * Read-only snapshots of the live GradConnect database (Docker `db` service).
 *
 * Every query runs inside a READ ONLY transaction that is rolled back, and
 * anything that is not a single SELECT/WITH statement is refused before it
 * reaches psql. Snapshots are written only once every query has succeeded, so
 * a stopped database leaves the previous snapshot in place instead of an
 * empty one that would silently drop tables from the manuscript.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const DATA = (name) => fileURLToPath(new URL(`../data/${name}`, import.meta.url));

/** Laravel's own bookkeeping tables: named in the text, not tabulated. */
export const FRAMEWORK_TABLES = ['cache', 'cache_locks', 'failed_jobs', 'job_batches', 'jobs', 'password_reset_tokens', 'sessions'];
const EXCLUDED = new Set(['migrations', ...FRAMEWORK_TABLES]);
const MIN_TABLES = 40;

export async function queryJson(sql) {
    if (!/^\s*(SELECT|WITH)\b/i.test(sql) || sql.includes(';')) {
        throw new Error(`queryJson is read-only: refusing "${sql.slice(0, 40)}"`);
    }

    const result = spawnSync('docker', [
        'compose', 'exec', '-T', 'db',
        'psql', '-U', 'gradconnect', '-d', 'gradconnect', '-qtA', '-v', 'ON_ERROR_STOP=1',
        '-c', `BEGIN TRANSACTION READ ONLY; ${sql}; ROLLBACK;`,
    ], { cwd: REPO_ROOT, encoding: 'utf8' });

    if (result.status !== 0) {
        throw new Error(`psql failed (${result.status}): ${(result.stderr || result.error?.message || '').trim()}`);
    }

    const out = result.stdout.trim();
    if (!out) throw new Error('psql returned no output');

    return JSON.parse(out);
}

const COLUMNS_SQL = `
SELECT json_agg(row_to_json(t)) FROM (
    SELECT c.relname AS "table", a.attname AS name,
           format_type(a.atttypid, a.atttypmod) AS type,
           NOT a.attnotnull AS nullable,
           pg_get_expr(d.adbin, d.adrelid) AS dflt
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname, a.attnum
) t`;

const CONSTRAINTS_SQL = `
SELECT json_agg(row_to_json(t)) FROM (
    SELECT con.conrelid::regclass::text AS "table", con.conname AS name, con.contype AS kind,
           a.attname AS col, con.confrelid::regclass::text AS ftable, fa.attname AS fcol, u.ord
    FROM pg_constraint con
    CROSS JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS u(k, fk, ord)
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = u.k
    LEFT JOIN pg_attribute fa ON fa.attrelid = con.confrelid AND fa.attnum = u.fk
    WHERE con.connamespace = 'public'::regnamespace AND con.contype IN ('p', 'f', 'u')
) t`;

const ROLE_PERMISSIONS_SQL = `
SELECT json_object_agg(r.name, x.perms ORDER BY r.name) FROM roles r
CROSS JOIN LATERAL (
    SELECT coalesce(json_agg(p.name ORDER BY p.name), '[]'::json) AS perms
    FROM role_has_permissions rp JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = r.id
) x`;

function constraintLabels(rows) {
    const labels = new Map();
    const add = (table, col, label) => {
        const key = `${table}.${col}`;
        if (!labels.has(key)) labels.set(key, []);
        if (!labels.get(key).includes(label)) labels.get(key).push(label);
    };

    // A composite key is unique only as a combination, so each of its columns
    // names its partners; a bare "UNIQUE" there would claim more than is true.
    const members = new Map();
    for (const r of rows) {
        const key = `${r.table}/${r.name}`;
        if (!members.has(key)) members.set(key, []);
        members.get(key)[r.ord - 1] = r.col;
    }

    for (const r of rows) {
        if (r.kind === 'f') {
            add(r.table, r.col, `FK → ${r.ftable}.${r.fcol}`);
            continue;
        }
        const base = r.kind === 'p' ? 'PK' : 'UNIQUE';
        const others = members.get(`${r.table}/${r.name}`).filter((c) => c && c !== r.col);
        add(r.table, r.col, others.length ? `${base} (with ${others.join(', ')})` : base);
    }

    return labels;
}

export async function extractSchema({ query = queryJson, outFile = DATA('schema.json') } = {}) {
    const columns = await query(COLUMNS_SQL);
    const constraints = await query(CONSTRAINTS_SQL);
    const labels = constraintLabels(constraints ?? []);
    const tables = new Map();

    for (const c of columns ?? []) {
        if (EXCLUDED.has(c.table)) continue;
        if (!tables.has(c.table)) tables.set(c.table, { name: c.table, columns: [] });

        const own = labels.get(`${c.table}.${c.name}`) ?? [];
        const constraintList = [...own];
        if (!c.nullable && !own.some((l) => l.startsWith('PK'))) constraintList.push('NOT NULL');

        tables.get(c.table).columns.push({
            name: c.name,
            type: c.type,
            // Only lengths count as size; timestamp(0) is a precision, not a size.
            size: /^(character|numeric|vector|bit)/.test(c.type) ? (c.type.match(/\(([\d,]+)\)/)?.[1] ?? '—') : '—',
            nullable: c.nullable,
            default: c.dflt,
            constraints: constraintList,
        });
    }

    const schema = [...tables.values()];
    if (schema.length < MIN_TABLES) {
        throw new Error(`expected at least ${MIN_TABLES} tables, got ${schema.length}`);
    }

    writeFileSync(outFile, `${JSON.stringify(schema, null, 2)}\n`);

    return schema;
}

export async function extractRolePermissions({ query = queryJson, outFile = DATA('role-permissions.json') } = {}) {
    const map = await query(ROLE_PERMISSIONS_SQL);
    if (!map || Object.keys(map).length !== 7) {
        throw new Error(`expected 7 roles, got ${map ? Object.keys(map).length : 0}`);
    }

    writeFileSync(outFile, `${JSON.stringify(map, null, 2)}\n`);

    return map;
}
