/** A centred PNG from docs/manuscript/figures, scaled to fit, or a «SCREENSHOT» marker if it isn't there yet. */
import { existsSync, readFileSync } from 'node:fs';
import { AlignmentType, ImageRun, Paragraph } from 'docx';
import { body } from './format.mjs';

export const FIGURE_DIR = new URL('../../figures/', import.meta.url);

/** Usable area in pixels at 96 dpi: 6 in × 9 in portrait, 9 in × 6 in landscape, less room for tag and caption. */
export const AREA = { portrait: [576, 760], landscape: [864, 470] };

export function imageOrMarker(file, label, { landscape = false, maxHeight } = {}) {
    const path = new URL(file, FIGURE_DIR);
    if (!existsSync(path)) return body(`«SCREENSHOT: ${label}»`);
    const png = readFileSync(path);
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    const [maxW, areaH] = AREA[landscape ? 'landscape' : 'portrait'];
    const scale = Math.min(maxW / width, (maxHeight ?? areaH) / height);

    return new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        children: [new ImageRun({ type: 'png', data: png, transformation: { width: Math.round(width * scale), height: Math.round(height * scale) } })],
    });
}
