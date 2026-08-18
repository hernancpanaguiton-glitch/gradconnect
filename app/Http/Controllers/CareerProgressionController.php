<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CareerProgressionController extends Controller
{
    /**
     * Read-only employment-history timeline (FR8 "Employment Tracking" —
     * career progression). Employment records themselves are already fully
     * CRUD-able from the graduate profile's Employment tab
     * (EmploymentRecordController); this page is the dedicated view the
     * sidebar's "Career Progression" link previously had no real destination
     * for (it pointed at /skill-gap, a different feature entirely).
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile;

        $records = $profile
            ? $profile->employmentRecords()
                ->orderByDesc('is_current')
                ->orderByDesc('start_date')
                ->get()
            : collect();

        return Inertia::render('CareerProgression', [
            'hasProfile' => $profile !== null,
            'records' => $records,
        ]);
    }
}
