/**
 * Which pages each role's sidebar links to (data/nav.json), read from
 * resources/js/lib/nav.ts. That file returns one menu per role from
 * `if (user.roles.includes('<role>'))` blocks, falling through to Alumni.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NAV_TS = fileURLToPath(new URL('../../../../resources/js/lib/nav.ts', import.meta.url));
const OUT = fileURLToPath(new URL('../data/nav.json', import.meta.url));
const ROUTES = fileURLToPath(new URL('../data/routes.json', import.meta.url));

// Rendered on every signed-in page, whatever the role: the top bar and its search box.
const TOP_BAR = ['../../../../resources/js/Layouts/AuthenticatedLayout.tsx', '../../../../resources/js/Components/GlobalSearch.tsx']
    .map((p) => fileURLToPath(new URL(p, import.meta.url)));

/** GET addresses the top bar links to or fetches, resolved through the route names. */
export function topBarHrefs(sources, routes) {
    const byName = new Map(routes.filter((r) => r.name && r.method.startsWith('GET')).map((r) => [r.name, `/${r.uri}`]));
    const hrefs = new Set();

    for (const src of sources) {
        for (const m of src.matchAll(/href="(\/[^"]+)"/g)) hrefs.add(m[1]);
        for (const m of src.matchAll(/route\('([a-z.-]+)'\)/g)) if (byName.has(m[1])) hrefs.add(byName.get(m[1]));
    }

    return [...hrefs];
}

const hrefs = (block) => {
    const found = [...block.matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
    // The shared Dashboard item is a constant, referenced by name in each menu.
    if (/\[\s*dashboard\s*\]/.test(block)) found.unshift('/dashboard');

    return found;
};

export function parseNav(source) {
    const marker = /if \(user\.roles\.includes\('([a-z_]+)'\)\)/g;
    const starts = [...source.matchAll(marker)];
    const nav = {};

    starts.forEach((m, i) => {
        const end = i + 1 < starts.length ? starts[i + 1].index : source.lastIndexOf('return [');
        nav[m[1]] = hrefs(source.slice(m.index, end));
    });

    // Everything after the last role block is the Alumni (default) menu.
    const tailStart = starts.length ? source.indexOf('return [', source.indexOf('}', starts.at(-1).index)) : 0;
    const lastBlockEnd = source.lastIndexOf('return [');
    nav.alumni = hrefs(source.slice(Math.max(tailStart, lastBlockEnd)));

    return nav;
}

export function writeNav() {
    const nav = parseNav(readFileSync(NAV_TS, 'utf8'));
    if (Object.keys(nav).length !== 7) throw new Error(`expected 7 role menus, got ${Object.keys(nav).length}`);

    const shared = topBarHrefs(TOP_BAR.map((p) => readFileSync(p, 'utf8')), JSON.parse(readFileSync(ROUTES, 'utf8')));
    for (const role of Object.keys(nav)) nav[role] = [...new Set([...nav[role], ...shared])];

    writeFileSync(OUT, `${JSON.stringify(nav, null, 2)}\n`);

    return nav;
}
