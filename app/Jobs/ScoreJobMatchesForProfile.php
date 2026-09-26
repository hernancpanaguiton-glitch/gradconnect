<?php

namespace App\Jobs;

use App\Models\GraduateProfile;
use App\Services\ResumeMatchingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ScoreJobMatchesForProfile implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    // Must exceed ai.matching.time_budget, and queue retry_after must
    // exceed this, or a slow run is handed to a second worker while the
    // first is still going.
    public int $timeout = 300;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public int $graduateProfileId) {}

    public function handle(ResumeMatchingService $matchingService): void
    {
        $profile = GraduateProfile::find($this->graduateProfileId);

        if (! $profile) {
            return;
        }

        // Self-heal: ranking needs the primary resume's embedding. If it hasn't
        // been generated yet, do it now so "Refresh recommendations" works.
        $resume = $profile->primaryResume;

        if ($resume && $resume->embedding_status !== 'done') {
            GenerateResumeEmbedding::dispatchSync($resume->id);
        }

        $matchingService->matchProfileToJobs($profile);
    }
}
