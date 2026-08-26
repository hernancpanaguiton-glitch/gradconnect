<?php

namespace App\Http\Controllers;

use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\Resume;
use App\Models\User;
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
     *
     * The résumé FILE is the sensitive artefact here, so unlike profile
     * browsing (which Talent Search legitimately opens up) this additionally
     * requires a relationship: an employer may only read the résumé of
     * someone who actually applied to one of their own postings. Institutional
     * roles keep full access for tracer/records work.
     */
    public function resume(Request $request, Resume $resume): StreamedResponse
    {
        abort_unless($request->user()->hasPermissionTo('candidates.view_resumes'), 403);

        abort_unless($this->canAccessResumeFile($request->user(), $resume), 403);

        abort_unless(Storage::disk('local')->exists($resume->path), 404);

        return Storage::disk('local')->response($resume->path, $resume->original_filename);
    }

    /**
     * Institution-wide roles (SAO, Admin, and anyone else holding
     * graduate_profiles.view_all) may read any résumé. Everyone else — in
     * practice industry partners — must have received an application from
     * that graduate to one of their own company's postings.
     */
    private function canAccessResumeFile(User $user, Resume $resume): bool
    {
        if ($user->hasPermissionTo('graduate_profiles.view_all')) {
            return true;
        }

        return JobApplication::where('graduate_profile_id', $resume->graduate_profile_id)
            ->whereHas('jobPosting', fn ($query) => $query
                ->where('posted_by_user_id', $user->id)
                ->orWhereHas('company', fn ($c) => $c->where('owner_user_id', $user->id))
            )
            ->exists();
    }
}
