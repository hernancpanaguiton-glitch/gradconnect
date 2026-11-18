import { readFileSync } from 'node:fs';

/** A JSON snapshot from data/, e.g. loadData('schema.json'). */
export function loadData(name) {
    return JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
}
