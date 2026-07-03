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

        // Self-heal: candidate shortlisting needs the posting's embedding, which
        // may be missing (e.g. seeded postings, or created before AI keys were
        // configured). Generate it now so "Refresh matches" reliably works.
        if ($jobPosting->embedding_status !== 'done') {
            GenerateJobPostingEmbedding::dispatchSync($jobPosting->id);
            $jobPosting->refresh();
        }

        $matchingService->matchJobToCandidates($jobPosting);
    }
}
