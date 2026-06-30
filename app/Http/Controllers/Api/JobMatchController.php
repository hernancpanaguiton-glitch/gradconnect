<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ScoreJobMatchesForJob;
use App\Jobs\ScoreJobMatchesForProfile;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobMatchController extends Controller
{
    /**
     * Queue rematching of candidates for a job posting (partner/moderator only).
     */
    public function rematchJob(JobPosting $posting): JsonResponse
    {
        $this->authorize('update', $posting);

        ScoreJobMatchesForJob::dispatch($posting->id);

        return response()->json(['status' => 'queued']);
    }

    /**
     * Report match-scoring progress for a job posting.
     */
    public function jobStatus(JobPosting $posting): JsonResponse
    {
        $this->authorize('update', $posting);

        return response()->json($this->statusFor($posting));
    }

    /**
     * Queue rematching of jobs for the authenticated graduate's own profile.
     */
    public function rematchProfile(Request $request): JsonResponse
    {
        $profile = $request->user()->graduateProfile;

        abort_if($profile === null, 422, 'You must have a graduate profile to request matching.');

        ScoreJobMatchesForProfile::dispatch($profile->id);

        return response()->json(['status' => 'queued']);
    }

    /**
     * Report match-scoring progress for the authenticated graduate's profile.
     */
    public function profileStatus(Request $request): JsonResponse
    {
        $profile = $request->user()->graduateProfile;

        abort_if($profile === null, 422, 'You must have a graduate profile to request matching.');

        return response()->json($this->statusFor($profile));
    }

    /**
     * @return array<string, mixed>
     */
    private function statusFor(JobPosting|GraduateProfile $model): array
    {
        return [
            'total_matches' => $model->matchResults()->count(),
            'scored' => $model->matchResults()->whereNotNull('scored_at')->count(),
            'last_scored_at' => $model->matchResults()->max('scored_at'),
        ];
    }
}
