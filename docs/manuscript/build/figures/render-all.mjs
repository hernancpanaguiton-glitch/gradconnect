/** Renders every generated figure to docs/manuscript/figures/*.png. Usage: node figures/render-all.mjs [name...] */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeBrowser, svgToPng } from '../lib/render.mjs';
import { aiArchitectureSvg, networkDesignSvg, networkModelSvg, networkTopologySvg, techStackSvg } from './architecture.mjs';
import { agileSvg, conceptualFrameworkSvg, flowOfStudySvg } from './methodology.mjs';
import { loginRegisterSvg, roleWorkflowSvg } from './workflows.mjs';
import { ROLE_ORDER } from '../lib/access.mjs';
import { fddSvg } from './fdd.mjs';
import { USE_CASES, useCaseSvg } from './usecase.mjs';
import { databaseDesignSvg, ERD_GROUPS, erdGroupSvg, erdOverviewSvg } from './erd.mjs';
import { bmcSvg, roadmapSvg, validationBoardSvg } from './business.mjs';
import { loadData } from '../lib/data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'figures');

export const FIGURES = {
    'conceptual-framework': conceptualFrameworkSvg,
    'flow-of-study': flowOfStudySvg,
    'agile': agileSvg,
    'workflow-login-register': loginRegisterSvg,
    ...Object.fromEntries(ROLE_ORDER.map((r) => [`workflow-${r}`, () => roleWorkflowSvg(r, loadData('nav.json')[r])])),
    'fdd': fddSvg,
    ...Object.fromEntries(USE_CASES.map((m) => [m.file, () => useCaseSvg(m)])),
    'database-design': () => databaseDesignSvg(loadData('schema.json')),
    'network-design': networkDesignSvg,
    'business-model-canvas': bmcSvg,
    'validation-board': validationBoardSvg,
    'business-roadmap': roadmapSvg,
    'network-model': networkModelSvg,
    'network-topology': networkTopologySvg,
    'tech-stack': techStackSvg,
    'ai-architecture': aiArchitectureSvg,
    'erd-overview': () => erdOverviewSvg(loadData('schema.json')),
    ...Object.fromEntries(ERD_GROUPS.map((g) => [`erd-${g.id}`, () => erdGroupSvg(loadData('schema.json'), g)])),
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    mkdirSync(OUT, { recursive: true });
    const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FIGURES);
    try {
        for (const name of names) {
            writeFileSync(join(OUT, `${name}.png`), await svgToPng(await FIGURES[name]()));
            console.log(name);
        }
    } finally {
        await closeBrowser();
    }
}
