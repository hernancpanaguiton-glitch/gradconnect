<?php

namespace App\Http\Controllers;

use App\Models\GraduateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployabilityReportController extends Controller
{
    /**
     * Show the employability report dashboard.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('employability_reports.generate'), 403);

        $totalGraduates = GraduateProfile::count();

        $employmentBreakdown = GraduateProfile::query()
            ->selectRaw('current_employment_status, count(*) as total')
            ->whereNotNull('current_employment_status')
            ->groupBy('current_employment_status')
            ->pluck('total', 'current_employment_status')
            ->toArray();

        $willingToRelocate = GraduateProfile::where('willing_to_relocate', true)->count();

        return Inertia::render('Reports/Employability', [
            'totalGraduates' => $totalGraduates,
            'employmentBreakdown' => $employmentBreakdown,
            'willingToRelocate' => $willingToRelocate,
        ]);
    }
}
