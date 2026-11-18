import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, pngSize, svgToPng } from '../lib/render.mjs';

after(closeBrowser);

test('an SVG renders to a PNG at the requested scale', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">'
        + '<rect x="10" y="10" width="180" height="80" fill="none" stroke="#000"/>'
        + '<text x="100" y="55" text-anchor="middle" font-family="Times New Roman">Résumé</text></svg>';
    const png = await svgToPng(svg, { scale: 3 });
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.deepEqual(pngSize(png), { width: 600, height: 300 });
});
