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

    public int $timeout = 120;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public int $graduateProfileId) {}

    public function handle(ResumeMatchingService $matchingService): void
    {
        $profile = GraduateProfile::find($this->graduateProfileId);

        if (! $profile) {
            return;
        }

        $matchingService->matchProfileToJobs($profile);
    }
}
