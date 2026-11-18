/**
 * The small Markdown subset the prose sections are written in: headings,
 * paragraphs, bullet and numbered lists, **bold**, and fenced blocks.
 * Everything renders in Times New Roman, as Appendix J requires.
 */
import { AlignmentType, Paragraph } from 'docx';
import { body, heading, plain, runs } from './format.mjs';
import { imageOrMarker } from './image.mjs';

// Each numbered list restarts at 1, so each gets its own numbering instance.
let listInstance = 0;

export function renderMarkdown(md) {
    const out = [];
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let para = [];
    let numbered = false;

    const flush = () => {
        if (para.length) out.push(body(para.join(' ')));
        para = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('```')) {
            flush();
            for (i++; i < lines.length && !lines[i].startsWith('```'); i++) {
                out.push(plain(lines[i], {}, { indent: { left: 720 }, spacing: { line: 240 } }));
            }
            numbered = false;
            continue;
        }

        // ![caption](file.png): a screenshot from docs/manuscript/figures, captioned beneath.
        const img = line.match(/^!\[(.+)\]\((.+\.png)\)$/);
        if (img) {
            flush();
            out.push(imageOrMarker(img[2], img[1], { maxHeight: 380 }),
                plain(img[1], { italics: true }, { alignment: AlignmentType.CENTER, spacing: { after: 240 } }));
            numbered = false;
            continue;
        }

        const h = line.match(/^(#{1,4}) (.+)$/);
        const bullet = line.match(/^- (.+)$/);
        const number = line.match(/^\d+\. (.+)$/);

        if (h) {
            flush();
            out.push(heading(h[2], h[1].length));
        } else if (bullet) {
            flush();
            out.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: runs(bullet[1]) }));
        } else if (number) {
            flush();
            if (!numbered) listInstance++;
            out.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance: listInstance }, children: runs(number[1]) }));
            numbered = true;
            continue;
        } else if (line.trim() === '') {
            flush();
        } else {
            para.push(line.trim());
        }

        numbered = false;
    }

    flush();

    return out;
}
