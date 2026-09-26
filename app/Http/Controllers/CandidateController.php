<?php

namespace App\Http\Controllers;

use App\Http\Presenters\CandidatePresenter;
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

        return Inertia::render('Candidates/Show', [
            'profile' => $this->present($request, $graduateProfile),
        ]);
    }

    /**
     * Candidate profile as JSON, for the quick-view modal on the applicant list.
     */
    public function data(Request $request, GraduateProfile $graduateProfile): JsonResponse
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        return response()->json(['profile' => $this->present($request, $graduateProfile)]);
    }

    /**
     * Stream a candidate's résumé file to an authorized employer. PDFs open
     * inline; other formats download.
     *
     * The relationship rule ("only someone who applied to one of your own
     * postings") lives in ResumePolicy::download, so this route and the
     * download links the presenter renders always agree.
     */
    public function resume(Request $request, Resume $resume): StreamedResponse
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        $this->authorize('download', $resume);

        abort_unless(Storage::disk('local')->exists($resume->path), 404);

        return Storage::disk('local')->response($resume->path, $resume->original_filename);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Request $request, GraduateProfile $graduateProfile): array
    {
        $graduateProfile->load([
            'user',
            'department',
            'skills',
            'educationRecords',
            'employmentRecords',
            'resumes' => fn ($query) => $query->latest(),
        ]);

        return (new CandidatePresenter($request->user()))->detail($graduateProfile);
    }
}
