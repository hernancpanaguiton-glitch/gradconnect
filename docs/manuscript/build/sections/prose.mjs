/**
 * Prose sections drafted from the code: Abstract, Network, Technology
 * Stack, Installation Guide and User Guide. Each Markdown file is rendered
 * behind the merge tag(s) that say where it goes in the manuscript.
 */
import { readFileSync } from 'node:fs';
import { tag } from '../lib/format.mjs';
import { renderMarkdown } from '../lib/markdown.mjs';

const read = (file) => readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');

/** Split a file at a heading, so each half can carry its own REPLACE tag. */
function splitAt(md, headingLine) {
    const i = md.indexOf(headingLine);
    if (i < 0) throw new Error(`heading not found: ${headingLine}`);

    return [md.slice(0, i), md.slice(i)];
}

export const abstractSection = {
    id: 'abstract',
    build: () => [tag('NEW', 'Approval Sheet'), ...renderMarkdown(read('abstract.md'))],
};

export const networkSection = {
    id: 'network',
    build: () => {
        const [model, topology] = splitAt(read('network.md'), '## Network Topology');

        return [
            tag('REPLACE', 'Network Model', '96'), ...renderMarkdown(model),
            tag('REPLACE', 'Network Topology', '97'), ...renderMarkdown(topology),
        ];
    },
};

export const techStackSection = {
    id: 'tech-stack',
    build: () => {
        const [stack, spec] = splitAt(read('tech-stack.md'), '## Software Development Specification');

        return [
            tag('REPLACE', 'Technology Stack Diagram', '99'), ...renderMarkdown(stack),
            tag('REPLACE', 'Software Development Specification', '100'), ...renderMarkdown(spec),
        ];
    },
};

export const installationSection = {
    id: 'installation',
    build: () => [tag('NEW', 'Acceptance Testing'), ...renderMarkdown(read('installation-guide.md'))],
};

export const userGuideSection = {
    id: 'user-guide',
    build: () => [tag('NEW', 'Installation Guide'), ...renderMarkdown(read('user-guide.md'))],
};
