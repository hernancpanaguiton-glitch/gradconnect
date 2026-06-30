<?php

namespace Tests\Feature\Jobs;

use App\AI\Contracts\EmbeddingProvider;
use App\AI\Providers\GeminiEmbeddingProvider;
use App\Jobs\GenerateResumeEmbedding;
use App\Models\GraduateProfile;
use App\Models\Resume;
use App\Models\User;
use App\Services\EmbeddingService;
use App\Services\FileTextExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GenerateResumeEmbeddingTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_extracts_text_and_marks_the_resume_embedded_on_success(): void
    {
        Storage::fake('local');

        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $file = UploadedFile::fake()->createWithContent(
            'resume.pdf',
            file_get_contents(base_path('tests/Fixtures/sample-resume.pdf'))
        );
        $path = $file->store("resumes/{$profile->id}", 'local');

        $resume = $profile->resumes()->create([
            'original_filename' => 'resume.pdf',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => $file->getSize(),
            'is_primary' => true,
            'embedding_status' => 'pending',
        ]);

        $provider = $this->createMock(EmbeddingProvider::class);
        $provider->method('embed')->willReturn([0.1, 0.2, 0.3]);
        $this->app->instance(GeminiEmbeddingProvider::class, $provider);

        (new GenerateResumeEmbedding($resume->id))->handle(
            $this->app->make(FileTextExtractor::class),
            $this->app->make(EmbeddingService::class),
        );

        $resume->refresh();

        $this->assertSame('done', $resume->embedding_status);
        $this->assertNotNull($resume->embedded_at);
        $this->assertNotNull($resume->extracted_text);
    }

    public function test_it_marks_the_resume_failed_when_the_embedding_provider_returns_null(): void
    {
        Storage::fake('local');

        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $file = UploadedFile::fake()->createWithContent(
            'resume.pdf',
            file_get_contents(base_path('tests/Fixtures/sample-resume.pdf'))
        );
        $path = $file->store("resumes/{$profile->id}", 'local');

        $resume = $profile->resumes()->create([
            'original_filename' => 'resume.pdf',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => $file->getSize(),
            'is_primary' => true,
            'embedding_status' => 'pending',
        ]);

        config(['services.gemini.api_key' => null]);

        (new GenerateResumeEmbedding($resume->id))->handle(
            $this->app->make(FileTextExtractor::class),
            $this->app->make(EmbeddingService::class),
        );

        $this->assertSame('failed', $resume->fresh()->embedding_status);
    }

    public function test_it_marks_the_resume_failed_when_the_file_cannot_be_parsed(): void
    {
        Storage::fake('local');

        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $resume = $profile->resumes()->create([
            'original_filename' => 'resume.pdf',
            'path' => 'resumes/does-not-exist.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 100,
            'is_primary' => true,
            'embedding_status' => 'pending',
        ]);

        (new GenerateResumeEmbedding($resume->id))->handle(
            $this->app->make(FileTextExtractor::class),
            $this->app->make(EmbeddingService::class),
        );

        $this->assertSame('failed', $resume->fresh()->embedding_status);
    }

    public function test_it_does_nothing_when_the_resume_no_longer_exists(): void
    {
        // Should not throw even though resume id 999999 doesn't exist.
        (new GenerateResumeEmbedding(999999))->handle(
            $this->app->make(FileTextExtractor::class),
            $this->app->make(EmbeddingService::class),
        );

        $this->assertTrue(true);
    }
}
