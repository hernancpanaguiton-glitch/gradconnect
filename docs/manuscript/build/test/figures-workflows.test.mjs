import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginRegisterSvg, PAGE_LABELS, roleWorkflowSvg, workflowModules } from '../figures/workflows.mjs';
import { ROLE_ORDER } from '../lib/access.mjs';
import { load } from './helpers.mjs';

const nav = load('nav.json');
const words = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ').replace(/&amp;/g, '&');

test('every page in every role’s menu has a workflow label', () => {
    for (const role of ROLE_ORDER) assert.doesNotThrow(() => workflowModules(nav[role]), role);
});

test('a role’s workflow shows only its own modules', () => {
    const student = words(roleWorkflowSvg('student', nav.student));
    assert.ok(student.includes('Graduate Student Dashboard'));
    assert.ok(student.includes('Skill Gap Analysis'));
    assert.ok(!student.includes(PAGE_LABELS['/admin/users']), 'no admin modules for a student');
    const head = words(roleWorkflowSvg('department_head', nav.department_head));
    assert.ok(head.includes('Program Outcomes Report'));
    assert.ok(!head.includes('Talent Search'));
});

test('login/register follows the approval rule for staff and employers', async () => {
    const w = words(await loginRegisterSvg());
    for (const f of ['Has an account?', 'Graduate Student or Alumni?', 'Admin is notified to approve', 'Confirm email', 'Reset password'])
        assert.ok(w.includes(f), f);
});
