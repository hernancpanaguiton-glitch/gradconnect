import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rolesForRoute, unitLabel } from '../lib/access.mjs';
import { parseNav } from '../extract/nav.mjs';
import { gatesInMethod } from '../extract/gates.mjs';
import { ASSIGNED, modulesSection, moduleUnits } from '../sections/modules.mjs';
import { buildDocument } from '../build.mjs';
import { TEXT_WIDTH_LANDSCAPE } from '../lib/format.mjs';
import { docxXml, load } from './helpers.mjs';

const ROLES = ['admin', 'alumni', 'alumni_affairs', 'department_head', 'industry_partner', 'sao', 'student'];

test('every controller with routes belongs to a module', () => {
    const used = new Set(load('routes.json').map((r) => r.controller).filter(Boolean));
    const mapped = new Set(load('modules.json').flatMap((m) => m.controllers));
    assert.deepEqual([...used].filter((c) => !mapped.has(c)), []);
    assert.deepEqual([...mapped].filter((c) => !used.has(c)), []);
});

test('nav parses all seven roles', () => {
    const nav = load('nav.json');
    assert.deepEqual(Object.keys(nav).sort(), ROLES);
    assert.ok(nav.admin.includes('/admin/colleges'));
    for (const role of ROLES) assert.ok(nav[role].includes('/dashboard'), role);
});

test('top-bar links reach every role', () => {
    const nav = load('nav.json');
    for (const role of ROLES) {
        for (const href of ['/notifications', '/profile', '/settings', '/search']) assert.ok(nav[role].includes(href), `${role} ${href}`);
    }
});

test('parseNav assigns the trailing block to alumni', () => {
    const src = `if (user.roles.includes('admin')) { return [{ href: '/a' }]; }\nreturn [{ href: '/z' }];`;
    assert.deepEqual(parseNav(src), { admin: ['/a'], alumni: ['/z'] });
});

test('access rules', () => {
    const nav = load('nav.json');
    const perms = load('role-permissions.json');
    const routes = load('routes.json');
    const mods = load('modules.json');
    const mod = (name) => mods.find((m) => m.module === name);
    const roles = (route, name) => rolesForRoute(route, nav, perms, mod(name)).sort();

    for (const r of routes.filter((x) => x.controller === 'Admin/Department')) {
        assert.deepEqual(roles(r, 'Colleges and Programs'), ['admin']);
    }
    assert.equal(roles(routes.find((x) => x.controller === 'Auth/AuthenticatedSession' && x.guestOnly), 'Login Process').length, 7);
    for (const r of routes.filter((x) => x.roleArg)) {
        const m = mods.find((x) => x.controllers.includes(r.controller));
        assert.deepEqual(roles(r, m.module), r.roleArg.split('|').sort(), r.uri);
    }
    for (const r of routes.filter((x) => x.permissionArg)) {
        const m = mods.find((x) => x.controllers.includes(r.controller));
        const expected = Object.keys(perms).filter((k) => perms[k].includes(r.permissionArg)).sort();
        assert.deepEqual(roles(r, m.module), expected, r.uri);
    }
});

test('signed-in features with no menu entry belong to every role', () => {
    const routes = load('routes.json');
    const logout = routes.find((r) => r.controller === 'Auth/AuthenticatedSession' && r.uri === 'logout');
    const mod = load('modules.json').find((m) => m.module === 'Login Process');
    assert.equal(rolesForRoute(logout, load('nav.json'), load('role-permissions.json'), mod).length, 7);
});

test('gate parser reads abort_unless, authorize and hasRole, and ignores plain branches', () => {
    const php = `
    public function index(Request $request): Response
    {
        if (! $user->hasPermissionTo('surveys.manage')) { return $this->respondentView(); }
    }

    public function store(Request $request)
    {
        abort_unless($user->hasPermissionTo('a.one') || $user->hasPermissionTo('a.two'), 403);
        $this->authorize('create', Survey::class);
    }

    public function update(Request $request, JobPosting $posting)
    {
        $this->authorize('update', $posting);
        abort_if($profile === null, 422);
    }
`;
    assert.deepEqual(gatesInMethod(php, 'index'), { clauses: [], policies: [], requests: [] });
    assert.deepEqual(gatesInMethod(php, 'store'), {
        clauses: [{ permissions: ['a.one', 'a.two'], roles: [], ownership: false }],
        policies: [{ ability: 'create', model: 'Survey' }],
        requests: [],
    });
    assert.deepEqual(gatesInMethod(php, 'update').policies, [{ ability: 'update', model: 'JobPosting' }]);
});

test('separate gates must all pass', () => {
    const php = `
    public function store(Request $request)
    {
        abort_unless($request->user()->hasPermissionTo('feedback.submit'), 403);
        abort_unless($posting->posted_by_user_id === $request->user()->id || $request->user()->hasPermissionTo('moderate'), 403);
    }
`;
    const { clauses } = gatesInMethod(php, 'store');
    assert.equal(clauses.length, 2);
    assert.deepEqual(clauses[0], { permissions: ['feedback.submit'], roles: [], ownership: false });
    assert.equal(clauses[1].ownership, true);
});

test('employer feedback is open only to roles that pass every gate', () => {
    const perms = load('role-permissions.json');
    const route = load('routes.json').find((r) => r.controller === 'EmployerFeedback');
    const mod = load('modules.json').find((m) => m.module === 'Applicant Management');
    const expected = Object.keys(perms).filter((k) => perms[k].includes('employer_feedback.submit')).sort();
    assert.deepEqual(rolesForRoute(route, load('nav.json'), perms, mod).sort(), expected);
});

test('gate parser follows a variable the gate uses', () => {
    const php = `
    public function index(Request $request): Response
    {
        $canManage = $user->hasPermissionTo('cases.manage');
        abort_unless($canManage || $user->hasRole('student'), 403);
    }
`;
    const [clause] = gatesInMethod(php, 'index').clauses;
    assert.deepEqual(clause.permissions, ['cases.manage']);
    assert.deepEqual(clause.roles, ['student']);
});

test('gate parser follows a private helper the method calls', () => {
    const php = `
    public function store(Request $request)
    {
        abort_unless($this->canManage($request->user()), 403);
    }

    public function destroy(Request $request)
    {
        $this->authorizeModify($request->user());
    }

    private function canManage($user): bool
    {
        return $user->hasPermissionTo('events.a') || $user->hasPermissionTo('events.b');
    }

    private function authorizeModify($user): void
    {
        abort_unless($user->hasPermissionTo('posts.moderate'), 403);
    }
`;
    assert.deepEqual(gatesInMethod(php, 'store').clauses[0].permissions, ['events.a', 'events.b']);
    assert.deepEqual(gatesInMethod(php, 'destroy').clauses[0].permissions, ['posts.moderate']);
});

test('owner-or-permission gates count the owning role, not the menu', () => {
    const perms = load('role-permissions.json');
    const nav = load('nav.json');
    const routes = load('routes.json');
    const mods = load('modules.json');
    const holders = (...ps) => Object.keys(perms).filter((k) => ps.some((p) => perms[k].includes(p)));
    const roles = (controller, action) => {
        const route = routes.find((r) => r.controller === controller && r.action === action);
        const mod = mods.find((m) => m.controllers.includes(controller));
        return rolesForRoute(route, nav, perms, mod).sort();
    };
    // Only the posting's owner (a partner) or a moderator may change an application's status.
    assert.deepEqual(roles('JobApplication', 'updateStatus'), [...new Set(['industry_partner', ...holders('job_postings.moderate')])].sort());
    // Event management goes through the controller's canManage() helper.
    assert.deepEqual(roles('Event', 'store'), holders('career_activities.manage', 'student_events.manage').sort());
    // A post's author or a moderator may delete it.
    assert.deepEqual(roles('Community', 'destroy'), holders('community.participate', 'community.moderate').sort());
});

test('in-method gates outrank the menus', () => {
    const nav = load('nav.json');
    const perms = load('role-permissions.json');
    const routes = load('routes.json');
    const mod = load('modules.json').find((m) => m.module === 'Tracer Survey Management');
    const roles = (uri, method) => rolesForRoute(routes.find((r) => r.uri === uri && r.method.startsWith(method)), nav, perms, mod).sort();
    assert.deepEqual(roles('surveys/create', 'GET'), ['admin', 'alumni_affairs']);
    assert.deepEqual(roles('surveys', 'POST'), ['admin', 'alumni_affairs']);
    assert.ok(roles('surveys', 'GET').includes('student'), 'students can open the survey list');
});

test('a page under a shared menu link goes to the roles of the longest matching link', () => {
    const nav = load('nav.json');
    const perms = load('role-permissions.json');
    const routes = load('routes.json');
    const mod = load('modules.json').find((m) => m.module === 'Reports and Analytics');
    const report = routes.find((r) => r.uri === 'reports/employability' && r.method.startsWith('GET'));
    assert.ok(!rolesForRoute(report, nav, perms, mod).includes('student'));
});

test('unit labels', () => {
    assert.equal(unitLabel('index'), 'View list');
    assert.equal(unitLabel('show'), 'View details');
    assert.equal(unitLabel('store'), 'Create');
    assert.equal(unitLabel('update'), 'Update');
    assert.equal(unitLabel('destroy'), 'Delete');
    assert.equal(unitLabel('__invoke'), 'View page');
    assert.equal(unitLabel('markAllRead'), 'Mark all read');
    assert.equal(unitLabel('publicIndex'), 'Browse jobs');
    assert.equal(unitLabel('rsvp'), 'RSVP to an event');
    assert.equal(unitLabel('titles'), 'Suggest job titles (AI)');
    assert.equal(unitLabel('destroyAlias'), 'Delete alias');
});

test('units of different features in one module stay separate', () => {
    const d = (n) => load(n);
    const units = (name) => moduleUnits(d('modules.json').find((m) => m.module === name), d('routes.json'), d('nav.json'), d('role-permissions.json')).map(([l]) => l);
    const sao = units('Student Affairs Module');
    for (const l of ['Clearance: View list', 'Scholarship: View list', 'Student concern: View list']) assert.ok(sao.includes(l), l);
    assert.ok(!sao.includes('View list'));
    assert.deepEqual(units('Talent Search'), ['Search graduates']);
});

test('sign-in units say what they do, not their method names', () => {
    const d = (n) => load(n);
    const units = (name) => moduleUnits(d('modules.json').find((m) => m.module === name), d('routes.json'), d('nav.json'), d('role-permissions.json')).map(([l]) => l);
    assert.deepEqual(units('Login Process'), ['Log in', 'Log out']);
    const registration = units('Registration Process');
    for (const l of ['Register', 'Verify email', 'Resend verification email']) assert.ok(registration.includes(l), l);
    assert.ok(units('Forgot Password').includes('Request reset link'));
    assert.ok(!units('Forgot Password').some((l) => /Create|View details/.test(l)));
});

test('single-page features are not called lists', () => {
    const d = (n) => load(n);
    const units = (name) => moduleUnits(d('modules.json').find((m) => m.module === name), d('routes.json'), d('nav.json'), d('role-permissions.json')).map(([l]) => l);
    assert.deepEqual(units('Global Search'), ['Search']);
    assert.deepEqual(units('Dashboard Management'), ['View dashboard']);
    assert.deepEqual(units('Skill Gap Analysis'), ['View skill gaps']);
    assert.ok(units('Account Settings and Data Export').includes('Download own data'));
    assert.ok(units('Resume Management').includes('Build résumé from profile'));
});

test('existing owners preserved and new modules flagged', async () => {
    const xml = await docxXml(await buildDocument([modulesSection]));
    assert.ok(xml.includes('[REPLACE — List of Modules, p. 103]'));
    assert.ok(xml.includes('Edrian L. Quiño'));
    assert.ok(!xml.includes('Quino'));
    assert.equal((xml.match(/«ASSIGN PROGRAMMER»/g) || []).length, 0, 'new modules are divided among the proponents');
    assert.ok(xml.includes('LIST OF MODULES'));
});

test('new modules are shared by all four proponents, each a real unowned module', () => {
    const modules = load('modules.json');
    const unowned = modules.filter((m) => !m.owner).map((m) => m.module).sort();
    assert.deepEqual(Object.keys(ASSIGNED).sort(), unowned);
    const proponents = new Set(modules.map((m) => m.owner).filter(Boolean));
    assert.deepEqual(new Set(Object.values(ASSIGNED)), proponents);
});

test('module table fits a landscape page', async () => {
    const xml = await docxXml(await buildDocument([modulesSection]));
    assert.match(xml, /<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/);
    const widths = [...xml.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => +m[1]);
    assert.ok(widths.reduce((a, b) => a + b, 0) <= TEXT_WIDTH_LANDSCAPE);
});
