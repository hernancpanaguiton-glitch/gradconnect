<?php

namespace App\Http\Controllers;

use App\Models\GraduateProfile;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidateController extends Controller
{
    /**
     * Read-only view of a graduate's profile for employers reviewing
     * candidates. Gated by the candidate-viewing permission.
     */
    public function show(Request $request, GraduateProfile $graduateProfile): Response
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        $graduateProfile->load([
            'user',
            'department',
            'skills',
            'educationRecords',
            'employmentRecords',
            'resumes' => fn ($query) => $query->latest(),
        ]);

        return Inertia::render('Candidates/Show', [
            'profile' => $graduateProfile,
        ]);
    }

    /**
     * Candidate profile as JSON, for the quick-view modal on the applicant list.
     */
    public function data(Request $request, GraduateProfile $graduateProfile): JsonResponse
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        $graduateProfile->load([
            'user',
            'department',
            'skills',
            'educationRecords',
            'employmentRecords',
            'resumes' => fn ($query) => $query->latest(),
        ]);

        return response()->json(['profile' => $graduateProfile]);
    }

    /**
     * Stream a candidate's résumé file to an authorized employer. PDFs open
     * inline; other formats download.
     */
    public function resume(Request $request, Resume $resume): StreamedResponse
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        abort_unless(Storage::disk('local')->exists($resume->path), 404);

        return Storage::disk('local')->response($resume->path, $resume->original_filename);
    }
}
