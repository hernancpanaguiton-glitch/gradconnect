/**
 * Table numbers for the additions. They start at 6 because the manuscript's
 * Tables 1–5 all precede the first replaced section (Data Dictionary, p. 83),
 * so numbering in document order here is the final numbering.
 */
export function createTableCounter(start = 6) {
    let n = start - 1;

    return { next: () => ++n };
}
