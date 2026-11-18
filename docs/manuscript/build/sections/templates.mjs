/**
 * Templates for evidence that has to come from people (Alpha and Acceptance
 * Testing, the Validation Board, the Conclusion), plus Recommendations, the
 * forms checklist and the corrections list. Nothing that depends on people
 * is prefilled: those cells carry a «TO FILL» marker.
 */
import { readFileSync } from 'node:fs';
import { body, heading, simpleTable, tableCaption, tag } from '../lib/format.mjs';
import { renderMarkdown } from '../lib/markdown.mjs';

const read = (file) => readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
const YES_NO = '☐ Yes   ☐ No';

/** Appendix U criteria, verbatim from the manual's Alpha Testing form. */
const GUI = [
    ['Consistency', 'The user interface is of the same formatting style and icons throughout the system.'],
    ['Reusability', 'The system contains reusable GUI components such as familiar buttons, text and check boxes, and other tools.'],
    ['Forgiveness and Tolerance', 'The interface displays message or confirmation prompts that would allow the users to undo or redo critical actions.'],
    ['Simplicity', 'The GUI design include simple GUI buttons, such as simple screens with clear, uncrowded messages.'],
    ['Readability', 'The interface has appropriate colors, font sizes, and styles that is convenient to the target users.'],
    ['Clarity', 'Displayed error, help, and warning messages are clear, concise, and as elementary as possible to assist user in operating the software.'],
    ['Flexibility', 'The system includes user preferences setting to allow changes, for example, increasing the font size.'],
    ['User-friendliness', 'The GUI design must be user-friendly, by providing helpful, courteous, and non-offending messages.'],
];
const PERFORMANCE = [
    ['Conformance to the Requirements', 'The system effectively met all the identified features and/or requirements.'],
    ['Conformance to the Objectives', 'All specific objectives of the system are met by the program.'],
    ['Efficiency', 'The entire system functions efficiently. It doesn’t have delay in any transaction.'],
    ['Security', 'The system is secured. Login details are authenticated. Input parameters are ensured prior to the execution of the next transaction.'],
    ['Integrity', 'The software allows the registered user to have control over its own private information.'],
    ['Overall Impression', 'In general, the program or system is functional and useful.'],
];

export const ALPHA_CRITERIA = [...GUI, ...PERFORMANCE].map(([name]) => name);

export const alphaSection = {
    id: 'alpha',
    build(ctx) {
        const criterionRow = ([name, description]) => [`${name} (${description})`, '', '', '', ''];

        return [
            tag('NEW', 'Integration Testing'),
            heading('Alpha Testing', 3),
            body(
                'Alpha testing was carried out by «TO FILL: number of testers» testers using the deployed system on '
                + '«TO FILL: dates of the alpha test». Each tester rated every criterion below on the four-point scale '
                + 'of the Alpha Testing form in the Capstone Project Manual.',
            ),
            ...tableCaption(ctx.tables.next(), 'Alpha Testing Evaluation Form'),
            simpleTable(
                ['Test Criteria', 'Poor', 'Fair', 'Good', 'Very Good'],
                [
                    ['**Graphical User Interface (GUI)**', '', '', '', ''],
                    ...GUI.map(criterionRow),
                    ['**System Performance**', '', '', '', ''],
                    ...PERFORMANCE.map(criterionRow),
                ],
                [4640, 1000, 1000, 1000, 1000],
            ),
            ...tableCaption(ctx.tables.next(), 'Alpha Testing Results'),
            simpleTable(
                ['Criterion', 'Weighted Mean', 'Interpretation'],
                [
                    ...ALPHA_CRITERIA.map((name) => [name, '«TO FILL: weighted mean»', '«TO FILL: interpretation»']),
                    ['**Overall**', '«TO FILL: overall weighted mean»', '«TO FILL: overall interpretation»'],
                ],
                [3640, 2500, 2500],
            ),
            ...tableCaption(ctx.tables.next(), 'Interpretation of Alpha Testing Ratings'),
            simpleTable(
                ['Scale', 'Range', 'Interpretation'],
                [['4', '3.26–4.00', 'Very Good'], ['3', '2.51–3.25', 'Good'], ['2', '1.76–2.50', 'Fair'], ['1', '1.00–1.75', 'Poor']],
                [2000, 3320, 3320],
            ),
            body(
                'This 4-point form follows the manual’s Appendix U. The manuscript’s own instrument uses a 5-point '
                + 'scale (Table 3). «TO FILL: confirm with the adviser which scale the alpha evaluation uses».',
            ),
        ];
    },
};

/** Acceptance criteria, one per specific objective of the study. */
const CRITERIA = [
    'The system maintains a centralized database of graduate and alumni profiles.',
    'The system conducts employability and alumni tracer surveys electronically.',
    'The system tracks graduate employment status, career progression and industry placement.',
    'The system matches graduates with job opportunities through AI-powered résumé matching.',
    'The system supports alumni retention and engagement.',
    'The system identifies employability skill gaps through survey and résumé analysis.',
    'The system provides career recommendations based on graduates’ qualifications and skills.',
    'The best features of the system meet the needs of its users.',
    'The system is acceptable to its intended users.',
];

export const acceptanceSection = {
    id: 'acceptance',
    build(ctx) {
        return [
            tag('NEW', 'Alpha Testing'),
            heading('Acceptance Testing', 3),
            body(
                'Acceptance testing was conducted with the project’s sponsor, «TO FILL: name or office of the project sponsor», '
                + 'to confirm that the system meets the acceptance criteria below, each drawn from a specific objective '
                + 'of the study, using the Acceptance Testing form in the Capstone Project Manual.',
            ),
            ...tableCaption(ctx.tables.next(), 'Project Identification'),
            simpleTable(['Item', 'Details'], [
                ['Project Name', 'GradConnect: Graduate Employability and Career Development Platform'],
                ['Date Created', '«TO FILL: date the form was completed»'],
                ['Project Sponsor / Owner', '«TO FILL: name of the project sponsor or owner»'],
                ['Project Manager', 'Hernan C. Panaguiton'],
                ['Project Adviser', 'Dr. Janette Q. Tanquis'],
                ['Dean', 'Dr. Janette Q. Tanquis'],
            ], [3000, 5640]),
            ...tableCaption(ctx.tables.next(), 'Acceptance Criteria Test Matrix'),
            simpleTable(
                ['Number', 'Acceptance Criterion Description', 'Critical (Yes/No)', 'Accept/Reject', 'Comments'],
                CRITERIA.map((text, i) => [`AC${i + 1}`, text, '«TO FILL: yes or no»', '«TO FILL: accept or reject»', '«TO FILL: comments»']),
                [900, 3340, 1400, 1400, 1600],
            ),
            ...tableCaption(ctx.tables.next(), 'Other Considerations'),
            simpleTable(['Consideration', 'Answer', 'Details'], [
                ['Business Objectives: did the software application/system meet the business objectives?', YES_NO,
                    '«TO FILL: whether each requirement in the Requirements Specification was met»'],
                ['Does the software application/system require any changes prior to installation? If so, please describe.', YES_NO,
                    '«TO FILL: changes needed before installation, if any»'],
            ], [3640, 1700, 3300]),
            ...tableCaption(ctx.tables.next(), 'Approval'),
            simpleTable(['Project Sponsor / Project Owner', 'Signature', 'Date', 'Approved'], [
                ['«TO FILL: name of the project sponsor or owner»', '«TO FILL: signature»', '«TO FILL: date»', YES_NO],
            ], [3000, 2000, 1940, 1700]),
        ];
    },
};

const fromMarkdown = (id, file, tagArgs) => ({
    id,
    build: () => [...(tagArgs ? [tag(...tagArgs)] : []), ...renderMarkdown(read(file))],
});

export const validationBoardSection = fromMarkdown('validation-board', 'validation-board.md', ['REPLACE', 'Validation Board', '46']);
export const conclusionSection = fromMarkdown('conclusion', 'conclusion.md', ['NEW', 'User Guide']);
export const recommendationsSection = fromMarkdown('recommendations', 'recommendations.md', ['NEW', 'Conclusion']);
export const formsChecklistSection = fromMarkdown('forms-checklist', 'forms-checklist.md', ['NEW', 'Appendices']);
// The corrections are instructions about existing pages, so they carry no merge tag.
export const correctionsSection = fromMarkdown('corrections', 'corrections.md', null);
