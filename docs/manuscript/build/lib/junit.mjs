/**
 * Reads a JUnit XML report (PHPUnit and Vitest both write one) into
 * "<classname>::<name>" → { status }. Every test row in the manuscript is
 * looked up here, so an Actual Result always comes from a recorded run.
 */
const decode = (s) => s
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

export function readJunit(xml) {
    const results = new Map();

    for (const m of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
        const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], decode(a[2])]));
        const inner = m[2] ?? '';
        const status = /<(failure|error)\b/.test(inner) ? 'failed' : /<skipped\b/.test(inner) ? 'skipped' : 'passed';

        results.set(`${attrs.classname}::${attrs.name}`, { status });
    }

    return results;
}

export function totals(results) {
    const t = { passed: 0, skipped: 0, failed: 0 };
    for (const { status } of results.values()) t[status]++;

    return t;
}
