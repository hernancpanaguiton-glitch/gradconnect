/**
 * Assembles GradConnect-Manuscript-Additions.docx from the section list.
 *
 * Run directly (`npm run build`) to write the file; tests import
 * buildDocument() to build in memory.
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Document, Packer } from 'docx';
import { loadData } from './lib/data.mjs';
import { documentStyles, markerTally, numberingConfig, resetMarkerTally, sectionProperties } from './lib/format.mjs';
import { coverSection, splitAfterCoverTable } from './sections/cover.mjs';
import { createTableCounter } from './lib/numbering.mjs';
import { dataDictionarySection } from './sections/data-dictionary.mjs';
import { erdSection } from './sections/erd-dbml.mjs';
import { modulesSection } from './sections/modules.mjs';
import { testingSection } from './sections/testing.mjs';
import { figuresLandscapeSection, figuresSection } from './sections/figures.mjs';
import { abstractSection, installationSection, networkSection, techStackSection, userGuideSection } from './sections/prose.mjs';
import {
    acceptanceSection, alphaSection, conclusionSection, correctionsSection, formsChecklistSection,
    recommendationsSection, validationBoardSection,
} from './sections/templates.mjs';

export { loadData, splitAfterCoverTable };

export const OUTPUT = new URL('../GradConnect-Manuscript-Additions.docx', import.meta.url);

export const SECTIONS = [
    coverSection,
    correctionsSection,
    abstractSection,
    validationBoardSection,
    dataDictionarySection,
    erdSection,
    networkSection,
    techStackSection,
    modulesSection,
    testingSection,
    alphaSection,
    acceptanceSection,
    installationSection,
    userGuideSection,
    conclusionSection,
    recommendationsSection,
    figuresSection,
    figuresLandscapeSection,
    formsChecklistSection,
];

/**
 * Sections flagged `landscape: true` get their own Word section, so only
 * wide tables turn sideways (Appendix J: portrait except special diagrams).
 */
export async function buildDocument(sections = SECTIONS) {
    const ctx = { tables: createTableCounter(), data: loadData };
    const groups = [];
    const built = new Map();

    // Content first, so the cover can report the markers it actually rendered.
    resetMarkerTally();
    for (const section of sections.filter((s) => !s.cover)) built.set(section, await section.build(ctx));
    for (const section of sections.filter((s) => s.cover)) built.set(section, await section.build(ctx, markerTally()));

    for (const section of sections) {
        const children = built.get(section);
        const landscape = Boolean(section.landscape);
        const current = groups.at(-1);

        if (!current || current.landscape !== landscape) {
            groups.push({ landscape, children: [...children] });
        } else {
            current.children.push(...children);
        }
    }

    const doc = new Document({
        styles: documentStyles(),
        numbering: numberingConfig(),
        sections: (groups.length ? groups : [{ landscape: false, children: [] }]).map((g) => ({
            properties: sectionProperties({ landscape: g.landscape }),
            children: g.children,
        })),
    });

    return Packer.toBuffer(doc);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    writeFileSync(OUTPUT, await buildDocument());
    console.log(`Wrote ${OUTPUT.pathname}`);
}
