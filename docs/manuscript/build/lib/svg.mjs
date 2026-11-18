/**
 * Drawing primitives shared by every figure: black and white, Times New
 * Roman, thin strokes — the style of the reference manuscript's diagrams.
 */
export const FONT = 'Times New Roman';
export const INK = '#000';
export const RULE = '#555';
export const SHADE = '#eeeeee';

export const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Approximate rendered width of Times New Roman text, for sizing boxes. */
export const textWidth = (s, size = 12) => String(s).length * size * 0.52;

export function svgDoc(width, height, body) {
    const w = Math.ceil(width);
    const h = Math.ceil(height);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" `
        + `font-family="${FONT}" fill="${INK}"><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
}

export function text(x, y, s, { size = 12, anchor = 'start', weight = 'normal', style = 'normal', fill = INK } = {}) {
    return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" `
        + `font-style="${style}" fill="${fill}" dominant-baseline="middle">${esc(s)}</text>`;
}

export function rect(x, y, w, h, { fill = 'none', stroke = INK, width = 1, radius = 0, dash = '' } = {}) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" `
        + `stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function line(x1, y1, x2, y2, { stroke = INK, width = 1, dash = '' } = {}) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function polyline(points, { stroke = INK, width = 1 } = {}) {
    return `<polyline points="${points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
}

/** A filled arrowhead at (x, y) pointing along (dx, dy). */
export function arrowHead(x, y, dx, dy, size = 8) {
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const bx = x - ux * size;
    const by = y - uy * size;

    return `<polygon points="${x},${y} ${bx - uy * size * 0.5},${by + ux * size * 0.5} ${bx + uy * size * 0.5},${by - ux * size * 0.5}" fill="${INK}"/>`;
}

/** Split text into lines that fit a width, at word boundaries. */
export function wrap(s, maxWidth, size = 12) {
    const lines = [];
    let current = '';
    for (const word of String(s).split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;
        if (current && textWidth(next, size) > maxWidth) {
            lines.push(current);
            current = word;
        } else {
            current = next;
        }
    }
    if (current) lines.push(current);

    return lines;
}
