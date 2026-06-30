<?php

namespace App\Jobs;

use App\Jobs\Concerns\StoresEmbeddingVector;
use App\Models\Resume;
use App\Services\EmbeddingService;
use App\Services\FileTextExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class GenerateResumeEmbedding implements ShouldQueue
{
    use Queueable, StoresEmbeddingVector;

    public int $tries = 3;

    public int $timeout = 60;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public int $resumeId) {}

    public function handle(FileTextExtractor $extractor, EmbeddingService $embeddingService): void
    {
        $resume = Resume::find($this->resumeId);

        if (! $resume) {
            return;
        }

        $resume->update(['embedding_status' => 'processing']);

        $text = $extractor->extract(Storage::disk('local')->path($resume->path));

        if ($text === null) {
            $resume->markFailed();

            return;
        }

        $resume->update(['extracted_text' => $text]);

        $vector = $embeddingService->embed($text);

        if ($vector === null) {
            $resume->markFailed();

            return;
        }

        $this->storeEmbedding('resumes', $resume->id, $vector);

        $resume->markEmbedded();
    }
}
