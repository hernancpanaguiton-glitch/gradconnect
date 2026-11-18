import { readFileSync } from 'node:fs';
import JSZip from 'jszip';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

async function part(buffer, name) {
    return (await JSZip.loadAsync(buffer)).file(name).async('string');
}

export const docxXml = (buffer) => part(buffer, 'word/document.xml');
export const stylesXml = (buffer) => part(buffer, 'word/styles.xml');

/** Document text with one line per paragraph and XML entities decoded. */
export function plainText(xml) {
    return xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

export const read = (name) => readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
export const load = (name) => JSON.parse(read(name));
export const readSection = (file) => readFileSync(new URL(`../sections/${file}`, import.meta.url), 'utf8');

const REPO = new URL('../../../../', import.meta.url);

/** [[package, 'major.minor']] for each package, read from the lockfiles. */
export function lockedMajorMinor(composerPackages, npmPackages) {
    const composer = JSON.parse(readFileSync(new URL('composer.lock', REPO), 'utf8'));
    const npm = JSON.parse(readFileSync(new URL('package-lock.json', REPO), 'utf8'));
    const majorMinor = (v) => v.replace(/^v/, '').split('.').slice(0, 2).join('.');
    const all = [...composer.packages, ...composer['packages-dev']];

    return [
        ...composerPackages.map((p) => [p, majorMinor(all.find((x) => x.name === p).version)]),
        ...npmPackages.map((p) => [p, majorMinor(npm.packages[`node_modules/${p}`].version)]),
    ];
}

/** The non-blank lines inside fenced code blocks. */
export function fencedCommands(md) {
    return [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)]
        .flatMap((m) => m[1].split('\n'))
        .map((l) => l.trim())
        .filter(Boolean);
}

/** 'YYYY-MM-DD' → 'Month D, YYYY', without the local timezone shifting the day. */
export function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);

    return `${MONTHS[m - 1]} ${d}, ${y}`;
}
