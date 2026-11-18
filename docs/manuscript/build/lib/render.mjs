/**
 * Renders SVG figures to PNG with the Chrome already installed on this
 * machine (driven by puppeteer-core, which downloads no browser of its own).
 * One browser is shared across renders; call closeBrowser() when done.
 */
import puppeteer from 'puppeteer-core';

export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let launched;

export function browser() {
    launched ??= puppeteer.launch({ executablePath: CHROME, headless: true });

    return launched;
}

export async function closeBrowser() {
    if (launched) await (await launched).close();
    launched = undefined;
}

/** Width and height read from the PNG header. */
export function pngSize(png) {
    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/** The SVG's own width/height attributes, which every figure here sets. */
function svgSize(svg) {
    const width = Number(svg.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1]);
    const height = Number(svg.match(/<svg[^>]*\bheight="([\d.]+)"/)?.[1]);
    if (!width || !height) throw new Error('svg needs numeric width and height attributes');

    return { width: Math.ceil(width), height: Math.ceil(height) };
}

export async function svgToPng(svg, { scale = 3 } = {}) {
    const { width, height } = svgSize(svg);
    const page = await (await browser()).newPage();

    try {
        await page.setViewport({ width, height, deviceScaleFactor: scale });
        await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">${svg}</body></html>`);
        await page.evaluate(() => document.fonts.ready);

        return Buffer.from(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } }));
    } finally {
        await page.close();
    }
}
