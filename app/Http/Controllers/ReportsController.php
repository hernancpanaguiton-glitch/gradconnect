<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    /**
     * A permission-filtered directory of the reports the caller can run
     * (FR9 "Reports and Analytics", Table 5 "Generate Reports"). Kept
     * intentionally simple — each report's own analytics live on its own
     * page; deeper cross-report analytics (skill trends by program,
     * curriculum evaluation) are tracked as Phase 3 of the completion plan.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $reports = collect([
            [
                'title' => 'Employability Report',
                'desc' => 'Employment status breakdown and totals across all graduates.',
                'href' => route('reports.employability'),
                'visible' => $user->hasPermissionTo('reports.employability.view'),
            ],
            [
                'title' => 'Tracer & Employability Surveys',
                'desc' => 'Manage survey questions and review response results.',
                'href' => route('surveys.index'),
                'visible' => $user->hasPermissionTo('surveys.manage'),
            ],
            [
                'title' => 'Graduate & Alumni Directory',
                'desc' => 'Search and filter the graduate database by college, skill, or résumé status.',
                'href' => route('talent-search'),
                'visible' => $user->hasPermissionTo('candidates.search'),
            ],
            [
                'title' => 'User & Role Management',
                'desc' => 'Account status, role assignment, and the permission matrix.',
                'href' => route('admin.users.index'),
                'visible' => $user->hasPermissionTo('users.manage'),
            ],
            [
                'title' => 'My Skill Gap Analysis',
                'desc' => "Skills you're missing and skills you already have, ranked from your AI job matches.",
                'href' => route('skill-gap'),
                'visible' => $user->hasAnyRole(['alumni', 'student']),
            ],
            [
                'title' => 'My Applications',
                'desc' => "Every job you've applied to and its current status.",
                'href' => route('applications.index'),
                'visible' => $user->hasAnyRole(['alumni', 'student']),
            ],
        ])
            ->filter(fn (array $report) => $report['visible'])
            ->map(fn (array $report) => [
                'title' => $report['title'],
                'desc' => $report['desc'],
                'href' => $report['href'],
            ])
            ->values();

        return Inertia::render('ReportsHub', [
            'reports' => $reports,
        ]);
    }
}
