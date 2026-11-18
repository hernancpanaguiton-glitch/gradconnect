import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AGILE_PHASES, agileSvg, conceptualFrameworkSvg, flowOfStudySvg } from '../figures/methodology.mjs';

const words = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].replace(/^[•\s]+/, '')).join(' ');

test('conceptual framework is the manuscript’s IPO model', () => {
    const w = words(conceptualFrameworkSvg());
    for (const f of ['INPUT', 'PROCESS', 'OUTPUT', 'Job postings', 'Skill gap analysis', 'Alumni tracer reports']) assert.ok(w.includes(f), f);
});

test('flow of the study ends in the deployed platform and its evaluation', () => {
    const w = words(flowOfStudySvg());
    for (const f of ['Agile Methodology', 'Deployed Web-Mobile Platform', 'ISO/IEC 25010']) assert.ok(w.includes(f), f);
});

test('agile figure names all five phases of Chapter 3', () => {
    const w = words(agileSvg());
    assert.equal(AGILE_PHASES.length, 5);
    for (const phase of AGILE_PHASES) for (const word of phase.split(' ')) assert.ok(w.includes(word), word);
});
