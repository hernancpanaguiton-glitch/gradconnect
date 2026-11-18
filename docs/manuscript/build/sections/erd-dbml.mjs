/**
 * [NEW] ERD source — a dbdiagram.io (DBML) script generated from the same
 * schema snapshot, so the team redraws the ERD figure from the real tables
 * instead of the 15 conceptual ones in the proposal.
 */
import { body, plain, tag } from '../lib/format.mjs';

const RESERVED = new Set(['order', 'table', 'ref', 'note', 'indexes', 'enum']);
const ident = (name) => (RESERVED.has(name) ? `"${name}"` : name);

/** Columns of each composite key, recovered from the "(with …)" labels. */
function compositeKeys(table) {
    const keys = new Map();

    for (const c of table.columns) {
        for (const label of c.constraints) {
            const m = label.match(/^(PK|UNIQUE) \(with (.+)\)$/);
            if (!m) continue;
            const cols = [c.name, ...m[2].split(', ')].sort();
            keys.set(`${m[1]}:${cols.join(',')}`, { kind: m[1], cols });
        }
    }

    return [...keys.values()];
}

export function renderDbml(schema) {
    const lines = [];
    const refs = [];

    for (const table of schema) {
        lines.push(`Table ${table.name} {`);

        for (const c of table.columns) {
            const settings = [];
            if (c.constraints.includes('PK')) settings.push('pk');
            if (c.constraints.includes('UNIQUE')) settings.push('unique');
            if (c.constraints.includes('NOT NULL')) settings.push('not null');
            lines.push(`  ${ident(c.name)} "${c.type}"${settings.length ? ` [${settings.join(', ')}]` : ''}`);

            for (const label of c.constraints) {
                const fk = label.match(/^FK → (\w+)\.(\w+)$/);
                if (fk) refs.push(`Ref: ${table.name}.${ident(c.name)} > ${fk[1]}.${ident(fk[2])}`);
            }
        }

        const composites = compositeKeys(table);
        if (composites.length) {
            lines.push('  indexes {');
            for (const k of composites) {
                lines.push(`    (${k.cols.map(ident).join(', ')}) [${k.kind === 'PK' ? 'pk' : 'unique'}]`);
            }
            lines.push('  }');
        }

        lines.push('}', '');
    }

    return [...lines, ...refs].join('\n');
}

export const erdSection = {
    id: 'erd-dbml',
    build(ctx) {
        const dbml = renderDbml(ctx.data('schema.json'));

        return [
            tag('NEW', 'Entity Relationship Diagram'),
            body(
                'The script below describes the database exactly as built. Paste it into dbdiagram.io to view or '
                + 'edit the Entity Relationship Diagram interactively.',
            ),
            body('The redrawn diagrams are Figure 44 and the six group diagrams after it, in the Figures part of this document.'),
            ...dbml.split('\n').map((line) => plain(line, {}, { spacing: { line: 240 } })),
        ];
    },
};
