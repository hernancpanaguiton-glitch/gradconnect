/**
 * Storyboard screenshots (Figs 31–42) from the running app, signed in as the
 * seeded demo accounts (DatabaseSeeder; password "password").
 * Usage: node figures/screenshots.mjs [base url]   (default http://localhost:8000)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browser, closeBrowser } from '../lib/render.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'figures');
const BASE = process.argv[2] ?? 'http://localhost:8000';
const account = (who) => `${who}@gradconnect.edu.ph`;

/** [figure, file, account or null for a guest, path, full page?] */
export const SHOTS = [
    [31, 'storyboard-landing', null, '/', true],
    [32, 'storyboard-login', null, '/login'],
    [33, 'storyboard-forgot-password', null, '/forgot-password'],
    [34, 'storyboard-registration', null, '/register', true],
    [35, 'storyboard-student-dashboard', 'student', '/dashboard'],
    [36, 'storyboard-job-opportunities', 'student', '/jobs'],
    [37, 'storyboard-tracer-survey', 'student', '/surveys'],
    [38, 'storyboard-partner-dashboard', 'partner', '/dashboard'],
    [39, 'storyboard-alumni-affairs-dashboard', 'alumni.affairs', '/dashboard'],
    [40, 'storyboard-sao-dashboard', 'sao', '/dashboard'],
    [41, 'storyboard-department-head-dashboard', 'depthead.ccs', '/dashboard'],
    [42, 'storyboard-admin-dashboard', 'admin', '/dashboard'],
];

/** Follow the first link whose address matches, so the shot doesn't depend on seeded ids. */
const firstLink = (re) => async (page) => {
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    const href = hrefs.find((h) => re.test(new URL(h, 'http://x').pathname));
    if (!href) throw new Error(`No link matching ${re}`);
    await page.goto(new URL(href, page.url()).href, { waitUntil: 'networkidle0' });
};
const clickText = (prefix) => async (page) => {
    for (const btn of await page.$$('button')) {
        if ((await btn.evaluate((e) => e.textContent.trim())).startsWith(prefix)) return btn.click();
    }
    throw new Error(`No button starting "${prefix}"`);
};

/** User Guide shots: [file, account, path, then?]. Sign-in and Department Head dashboard reuse storyboard shots. */
export const GUIDE_SHOTS = [
    ['guide-profile-skills', 'student', '/graduate/profile/edit', clickText('Skills (')],
    ['guide-job-details', 'student', '/jobs', firstLink(/^\/jobs\/\d+$/)],
    ['guide-alumni-community', 'alumni', '/community'],
    ['guide-new-job-posting', 'partner', '/postings/create'],
    ['guide-posting-candidates', 'partner', '/postings', firstLink(/^\/postings\/\d+\/candidates$/)],
    ['guide-posting-matches', 'partner', '/postings', firstLink(/^\/postings\/\d+\/matches$/)],
    ['guide-survey-builder', 'alumni.affairs', '/surveys/create'],
    ['guide-survey-results', 'alumni.affairs', '/surveys', firstLink(/^\/surveys\/\d+\/results$/)],
    ['guide-clearance', 'sao', '/clearance'],
    ['guide-user-management', 'admin', '/admin/users'],
].map(([file, who, path, then]) => [null, file, who, path, false, then]);

async function shoot(b, [, file, who, path, full, then]) {
    const ctx = await b.createBrowserContext();
    try {
        const page = await ctx.newPage();
        await page.setViewport({ width: 1366, height: 860, deviceScaleFactor: 1.5 });
        if (who) {
            await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
            await page.type('#email', account(who));
            await page.type('#password', 'password');
            await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.keyboard.press('Enter')]);
            if (page.url().includes('/login')) throw new Error(`Sign-in failed for ${who}`);
        }
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' });
        // Let charts and entrance animations settle.
        await new Promise((r) => setTimeout(r, 1200));
        if (new URL(page.url()).pathname !== path) throw new Error(`${file}: landed on ${page.url()}`);
        if (then) {
            await then(page);
            await new Promise((r) => setTimeout(r, 800));
        }
        await page.screenshot({ path: join(OUT, `${file}.png`), fullPage: Boolean(full) });
        console.log(file);
    } finally {
        await ctx.close();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    mkdirSync(OUT, { recursive: true });
    try {
        const b = await browser();
        // Optional file names after the base url limit the run to those shots.
        const only = process.argv.slice(3);
        for (const s of [...SHOTS, ...GUIDE_SHOTS]) if (!only.length || only.includes(s[1])) await shoot(b, s);
    } finally {
        await closeBrowser();
    }
}
