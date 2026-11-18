/**
 * The Figures part: every redrawn diagram with a [REPLACE — Figure N] tag,
 * keeping the manuscript's own figure numbers. Figures new to the
 * manuscript (one ERD per table group) carry «RENUMBER». Wide diagrams sit
 * on landscape pages. A figure whose PNG is missing (not rendered yet)
 * becomes a «SCREENSHOT» marker, so the build never breaks on it.
 */
import { AlignmentType } from 'docx';
import { body, heading, plain, tag } from '../lib/format.mjs';
import { imageOrMarker } from '../lib/image.mjs';
import { ERD_GROUPS } from '../figures/erd.mjs';
import { USE_CASES } from '../figures/usecase.mjs';
import { SHOTS } from '../figures/screenshots.mjs';

/** Storyboard captions, as the manuscript words them. */
const STORY_TITLES = {
    31: 'Landing Page', 32: 'Log-in Page', 33: 'Forgot Password Page', 34: 'Registration Page', 35: 'Graduate Student Dashboard',
    36: 'Job Opportunities Page', 37: 'Graduate Tracer Survey Page', 38: 'Industry Partner Dashboard', 39: 'Alumni Affairs Office Dashboard',
    40: 'Student Affairs Office Dashboard', 41: 'Department Head Dashboard', 42: 'Admin Dashboard',
};
const ROLE_FIGS = [['student', 'Graduate Student'], ['alumni', 'Alumni'], ['industry_partner', 'Industry Partner'],
    ['alumni_affairs', 'Alumni Affairs Office'], ['sao', 'Student Affairs Office'], ['department_head', 'Department Head'], ['admin', 'Admin']];
const UC_TITLES = { 20: 'Use Case Diagram of GradConnect- Login/Register' };

/** [manuscript figure number or null for new, png name, caption title, landscape?] */
export const FIGURES = [
    [1, 'conceptual-framework', 'GradConnect -Conceptual Framework'],
    [4, 'flow-of-study', 'Diagram of the Flow of the Study'],
    [6, 'agile', 'Agile Methodology'],
    [7, 'business-model-canvas', 'Business Model Canvas of GradConnect', true],
    [8, 'workflow-login-register', 'Program Workflow of GradConnect- Login/Register'],
    ...ROLE_FIGS.map(([role, label], i) => [9 + i, `workflow-${role}`, `Program Workflow- ${label}`]),
    [16, 'validation-board', 'Validation Board of GradConnect'],
    [17, 'business-roadmap', 'Business Roadmap of GradConnect', true],
    [18, 'fdd', 'Functional Decomposition Diagram of GradConnect', true],
    [19, 'ai-architecture', 'AI System Architecture of GradConnect', true],
    ...USE_CASES.map((m) => [m.fig, m.file, UC_TITLES[m.fig] ?? `System Use Case Model – ${m.title}`]),
    ...SHOTS.map(([n, file]) => [n, file, STORY_TITLES[n]]),
    [43, 'database-design', 'Database Design of GradConnect'],
    [44, 'erd-overview', 'Entity Relationship Diagram', true],
    ...ERD_GROUPS.map((g) => [null, `erd-${g.id}`, `Entity Relationship Diagram – ${g.title}`, true]),
    [45, 'network-design', 'Network Design of GradConnect'],
    [46, 'network-model', 'Network Model of GradConnect'],
    [47, 'network-topology', 'Network Topology of GradConnect'],
    [48, 'tech-stack', 'Technology Stack of GradConnect'],
];

function figure([n, file, title, wide]) {
    const label = n ? `Figure ${n}` : 'Figure «RENUMBER»';

    return [
        n ? tag('REPLACE', label) : tag('NEW', 'Figure 44: Entity Relationship Diagram'),
        imageOrMarker(`${file}.png`, title, { landscape: wide }),
        plain(`${label}: ${title}`, { bold: true }, { alignment: AlignmentType.CENTER }),
    ];
}

export const figuresSection = {
    id: 'figures',
    build() {
        return [
            heading('Figures', 1),
            body('Each diagram below was redrawn from the finished system, in the style of the rest of the manuscript. '
                + 'Replace the figure of the same number in the manuscript with it. The six group diagrams after Figure 44 '
                + 'are new and need figure numbers.'),
            ...FIGURES.filter((f) => !f[3]).flatMap(figure),
        ];
    },
};

export const figuresLandscapeSection = {
    id: 'figures-landscape',
    landscape: true,
    build() {
        return FIGURES.filter((f) => f[3]).flatMap(figure);
    },
};
