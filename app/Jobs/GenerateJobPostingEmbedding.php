<?php

namespace App\Jobs;

use App\Jobs\Concerns\StoresEmbeddingVector;
use App\Models\JobPosting;
use App\Services\EmbeddingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateJobPostingEmbedding implements ShouldQueue
{
    use Queueable, StoresEmbeddingVector;

    public int $tries = 3;

    public int $timeout = 60;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public int $jobPostingId) {}

    public function handle(EmbeddingService $embeddingService): void
    {
        $posting = JobPosting::find($this->jobPostingId);

        if (! $posting) {
            return;
        }

        $posting->update(['embedding_status' => 'processing']);

        $vector = $embeddingService->embed($posting->buildEmbeddingText());

        if ($vector === null) {
            $posting->markFailed();

            return;
        }

        $this->storeEmbedding('job_postings', $posting->id, $vector);

        $posting->markEmbedded();
    }
}
