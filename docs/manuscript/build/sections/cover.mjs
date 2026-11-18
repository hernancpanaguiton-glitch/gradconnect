/**
 * Title, merge instructions and the marker table. Built after every other
 * section, from the markers they actually rendered. Marker names are written
 * here without their opening «, so the cover never counts itself.
 */
import { body, heading, simpleTable } from '../lib/format.mjs';

/** The first heading after the cover; splitAfterCoverTable cuts here. */
export const COVER_END = 'Corrections to Existing Pages';

const MEANING = [
    ['TO FILL', 'Information that must come from people: ratings, decisions, signatures and findings.'],
    ['ASSIGN PROGRAMMER', 'A module added since the proposal, for the Project Manager to assign to a proponent.'],
    ['SCREENSHOT', 'A screen capture or diagram for the team to insert.'],
    ['RENUMBER', 'A figure number to set once the section is placed in the manuscript.'],
];

export const coverSection = {
    id: 'cover',
    cover: true,
    build(ctx, tally) {
        return [
            heading('GradConnect Manuscript Additions', 1),
            body(
                'Additions and corrections for the oral defense manuscript of GradConnect: Graduate Employability and '
                + 'Career Development Platform, following the Capstone 42 Manuscript Outline (Appendix X) of the UC-CCS '
                + 'Capstone Project Manual. Everything here was drawn from the application’s source code, its database '
                + 'and a recorded run of its automated tests, except where a highlighted marker shows that the '
                + 'information must come from people.',
            ),
            heading('How to Merge', 2),
            body(
                'Each part begins with a shaded instruction. One that begins with NEW marks content to insert after '
                + 'the named section of the current manuscript; one that begins with REPLACE marks content that takes '
                + 'the place of the named section on the page given. Tables are already numbered for their final '
                + 'positions in the manuscript.',
            ),
            heading('What the Team Still Supplies', 2),
            simpleTable(
                ['Marker', 'Count', 'Meaning'],
                MEANING.map(([kind, meaning]) => [kind, String(tally.get(kind) ?? 0), meaning]),
                [2400, 1000, 5240],
            ),
        ];
    },
};

export function splitAfterCoverTable(text) {
    const end = text.indexOf(COVER_END);
    if (end < 0) throw new Error(`cover end not found: ${COVER_END}`);

    return [text.slice(0, end), text.slice(end)];
}
