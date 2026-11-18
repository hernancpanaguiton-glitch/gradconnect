/**
 * [REPLACE] Data Dictionary — one table per database table, generated from
 * the live schema snapshot (data/schema.json) and the hand-written column
 * descriptions (data/column-descriptions.json).
 */
import { body, simpleTable, tableCaption, tag } from '../lib/format.mjs';
import { FRAMEWORK_TABLES } from '../extract/db.mjs';

const HEADERS = ['Field Name', 'Description', 'Data Type', 'Size', 'Constraint'];
const WIDTHS = [1900, 3440, 1500, 700, 1100];

export const humanize = (name) => name.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** "character varying(255)" → "character varying"; the length goes in Size. */
const baseType = (type) => type.replace(/\([\d,]+\)/, '').replace(/\s+/g, ' ').trim();

export const dataDictionarySection = {
    id: 'data-dictionary',
    build(ctx) {
        const schema = ctx.data('schema.json');
        const descriptions = ctx.data('column-descriptions.json');
        const out = [
            tag('REPLACE', 'Data Dictionary', '83'),
            body(
                `The following tables describe the ${schema.length} tables of the GradConnect database as built, `
                + 'taken directly from the deployed PostgreSQL schema. The framework also keeps seven internal tables '
                + `for its own operation (${FRAMEWORK_TABLES.join(', ')}); they hold no study data and are not tabulated.`,
            ),
        ];

        for (const table of schema) {
            out.push(...tableCaption(ctx.tables.next(), `Data Dictionary of ${humanize(table.name)} Table`));
            out.push(simpleTable(HEADERS, table.columns.map((c) => [
                c.name,
                descriptions[`${table.name}.${c.name}`],
                baseType(c.type),
                c.size,
                c.constraints.length ? c.constraints.join(', ') : '—',
            ]), WIDTHS));
        }

        return out;
    },
};
