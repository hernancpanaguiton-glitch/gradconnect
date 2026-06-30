<?php

namespace Tests\Feature\Jobs;

use App\AI\Contracts\EmbeddingProvider;
use App\AI\Providers\GeminiEmbeddingProvider;
use App\Jobs\GenerateJobPostingEmbedding;
use App\Models\Company;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\EmbeddingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenerateJobPostingEmbeddingTest extends TestCase
{
    use RefreshDatabase;

    private function makePosting(): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->create([
            'embedding_status' => 'pending',
        ]);
    }

    public function test_it_embeds_the_posting_and_marks_it_done_on_success(): void
    {
        $posting = $this->makePosting();

        $provider = $this->createMock(EmbeddingProvider::class);
        $provider->method('embed')->willReturn([0.1, 0.2, 0.3]);
        $this->app->instance(GeminiEmbeddingProvider::class, $provider);

        (new GenerateJobPostingEmbedding($posting->id))->handle($this->app->make(EmbeddingService::class));

        $posting->refresh();

        $this->assertSame('done', $posting->embedding_status);
        $this->assertNotNull($posting->embedded_at);
    }

    public function test_it_marks_the_posting_failed_when_the_embedding_provider_returns_null(): void
    {
        $posting = $this->makePosting();

        config(['services.gemini.api_key' => null]);

        (new GenerateJobPostingEmbedding($posting->id))->handle($this->app->make(EmbeddingService::class));

        $this->assertSame('failed', $posting->fresh()->embedding_status);
    }

    public function test_it_does_nothing_when_the_posting_no_longer_exists(): void
    {
        (new GenerateJobPostingEmbedding(999999))->handle($this->app->make(EmbeddingService::class));

        $this->assertTrue(true);
    }
}
