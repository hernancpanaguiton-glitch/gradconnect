/**
 * Formatting primitives for the manuscript additions, fixed to the UC-CCS
 * Capstone Project Manual, Appendix J (Manuscript Mechanics).
 *
 * Every size here is in twips (1 inch = 1440) or half-points, the units Word
 * stores; keeping them as literals makes them checkable against the manual.
 */
import {
    AlignmentType,
    HeadingLevel,
    LevelFormat,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from 'docx';

export const FONT = 'Times New Roman';

export const PAGE = {
    width: 12240,
    height: 15840,
    margin: { top: 1440, right: 1440, bottom: 1440, left: 2160, header: 720, footer: 720 },
};

/** Usable line width: page width minus left and right margins. */
export const TEXT_WIDTH_PORTRAIT = PAGE.width - PAGE.margin.left - PAGE.margin.right;
export const TEXT_WIDTH_LANDSCAPE = PAGE.height - PAGE.margin.left - PAGE.margin.right;

const LINE_1_5 = 360;
const FIRST_LINE_INDENT = 720;

/** Markers the team must act on; rendered highlighted so none is missed. */
export const MARKER_RE = /«(TO FILL: [^»]+|ASSIGN PROGRAMMER|SCREENSHOT: [^»]+|RENUMBER)»/g;

/**
 * Every marker rendered since the last reset, by kind. buildDocument resets
 * it, builds the content, then hands the counts to the cover table — so the
 * cover is computed from what was actually rendered and cannot drift.
 */
const tally = new Map();
export const resetMarkerTally = () => tally.clear();
export const markerTally = () => new Map(tally);
const kindOf = (marker) => marker.split(':')[0];

export function documentStyles() {
    const heading = (size, italics = false) => ({
        run: { font: FONT, size, bold: true, italics, color: '000000' },
        paragraph: { spacing: { before: 240, after: 120, line: LINE_1_5 }, keepNext: true },
    });

    return {
        default: {
            document: {
                run: { font: FONT, size: 22, color: '000000' },
                paragraph: { spacing: { line: LINE_1_5 } },
            },
            heading1: heading(24),
            heading2: heading(24),
            heading3: heading(22),
            // Appendix J sizes only levels 1–3; level 4 keeps the body size
            // and is told apart from level 3 by italics.
            heading4: heading(22, true),
        },
    };
}

export function numberingConfig() {
    const level = (format, text) => ({
        level: 0,
        format,
        text,
        alignment: AlignmentType.LEFT,
        // Without a run font, Word sets the gap after each number in Arial.
        style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: FONT } },
    });

    return {
        config: [
            { reference: 'bullets', levels: [level(LevelFormat.BULLET, '•')] },
            { reference: 'numbers', levels: [level(LevelFormat.DECIMAL, '%1.')] },
        ],
    };
}

export function sectionProperties({ landscape = false } = {}) {
    return {
        page: {
            // docx swaps width and height itself when the orientation is landscape.
            size: {
                width: PAGE.width,
                height: PAGE.height,
                orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: PAGE.margin,
        },
    };
}

/**
 * Text runs for one line: «markers» highlighted, **bold** honoured.
 * `base` carries run formatting that applies to the whole line.
 */
export function runs(text, base = {}) {
    const out = [];
    const plain = (s) => {
        for (const part of s.split(/(\*\*[^*]+\*\*)/)) {
            if (!part) continue;
            const bold = part.startsWith('**') && part.endsWith('**');
            out.push(new TextRun({ ...base, text: bold ? part.slice(2, -2) : part, bold: bold || base.bold }));
        }
    };

    let last = 0;
    for (const match of text.matchAll(MARKER_RE)) {
        plain(text.slice(last, match.index));
        out.push(new TextRun({ ...base, text: match[0], highlight: 'yellow' }));
        tally.set(kindOf(match[1]), (tally.get(kindOf(match[1])) ?? 0) + 1);
        last = match.index + match[0].length;
    }
    plain(text.slice(last));

    return out;
}

export function heading(text, level) {
    const levels = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };

    return new Paragraph({ heading: levels[level], children: runs(text) });
}

export function body(text) {
    return new Paragraph({
        spacing: { line: LINE_1_5 },
        indent: { firstLine: FIRST_LINE_INDENT },
        children: runs(text),
    });
}

/** A paragraph with no first-line indent, for captions, cells and code. */
export function plain(text, base = {}, options = {}) {
    return new Paragraph({ ...options, children: runs(text, base) });
}

/** The merge instruction that heads every section of the additions. */
export function tag(kind, section, page) {
    const text = kind === 'NEW'
        ? `[NEW — insert after: ${section}]`
        : `[REPLACE — ${section}${page ? `, p. ${page}` : ''}]`;

    return new Paragraph({
        keepNext: true,
        spacing: { before: 360, after: 120 },
        shading: { type: ShadingType.CLEAR, fill: 'E8EEF7', color: 'auto' },
        children: [new TextRun({ text, bold: true })],
    });
}

export function tableCaption(n, title) {
    return [
        plain(`Table ${n}`, {}, { keepNext: true, spacing: { before: 240 } }),
        plain(title.toUpperCase(), {}, { keepNext: true }),
    ];
}

export function figureCaption(title) {
    return plain(`Figure «RENUMBER»: ${title}`, { bold: true, underline: {} });
}

function cell(text, width, header) {
    // A cell may hold several lines; Word needs one paragraph per line.
    const lines = String(text).split('\n');

    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: header ? { type: ShadingType.CLEAR, fill: 'D9D9D9', color: 'auto' } : undefined,
        children: lines.map((line) => plain(line, header ? { bold: true } : {}, { spacing: { line: 240 } })),
    });
}

export function simpleTable(headers, rows, widths, totalWidth = TEXT_WIDTH_PORTRAIT) {
    const columns = widths ?? headers.map(() => Math.floor(totalWidth / headers.length));
    const sum = columns.reduce((a, b) => a + b, 0);

    return new Table({
        width: { size: sum, type: WidthType.DXA },
        columnWidths: columns,
        rows: [
            new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, columns[i], true)) }),
            ...rows.map((row) => new TableRow({ children: row.map((c, i) => cell(c, columns[i], false)) })),
        ],
    });
}
