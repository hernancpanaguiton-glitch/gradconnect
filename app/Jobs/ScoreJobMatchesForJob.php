<?php

namespace App\Jobs;

use App\Models\JobPosting;
use App\Services\ResumeMatchingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ScoreJobMatchesForJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public int $jobPostingId) {}

    public function handle(ResumeMatchingService $matchingService): void
    {
        $jobPosting = JobPosting::find($this->jobPostingId);

        if (! $jobPosting) {
            return;
        }

        $matchingService->matchJobToCandidates($jobPosting);
    }
}
