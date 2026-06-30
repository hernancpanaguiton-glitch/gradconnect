<?php

namespace Tests\Feature\Matching;

use App\AI\AiManager;
use App\AI\DTO\MatchResult;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use App\Services\ResumeMatchingService;
use App\Services\VectorSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Full hybrid pipeline over the REAL pgvector shortlist with a mocked
 * AiManager (no network). Skipped on SQLite; see VectorSearchPostgresTest
 * for how to run against a PostgreSQL + pgvector test database.
 */
class ResumeMatchingServicePostgresTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL + pgvector; the default SQLite driver has no vector support.');
        }
    }

    /**
     * @param  array<int, float>  $vector
     */
    private function setEmbedding(string $table, int $id, array $vector): void
    {
        DB::statement(
            "update {$table} set embedding = ? where id = ?",
            ['['.implode(',', $vector).']', $id]
        );
    }

    public function test_it_shortlists_via_pgvector_then_persists_scored_match_results(): void
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $job = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create(['embedding_status' => 'done']);
        $this->setEmbedding('job_postings', $job->id, array_fill(0, 768, 1.0));

        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();
        $resume = Resume::factory()->for($profile)->create([
            'is_primary' => true,
            'embedding_status' => 'done',
            'extracted_text' => 'Experienced PHP and Laravel developer.',
        ]);
        $this->setEmbedding('resumes', $resume->id, array_fill(0, 768, 0.95));

        $aiManager = $this->createMock(AiManager::class);
        $aiManager->method('scoreWithFallback')->willReturn(
            new MatchResult(84, 'strong', 'Strong backend overlap.', ['Docker'], ['PHP', 'Laravel'], 'groq')
        );

        $service = new ResumeMatchingService(new VectorSearch, $aiManager);
        $results = $service->matchJobToCandidates($job);

        $this->assertCount(1, $results);

        $match = JobMatchResult::where([
            'job_posting_id' => $job->id,
            'graduate_profile_id' => $profile->id,
        ])->first();

        $this->assertNotNull($match);
        $this->assertSame(84, $match->fit_score);
        $this->assertSame('strong', $match->recommendation);
        $this->assertSame('groq', $match->scored_by);
        $this->assertSame($resume->id, $match->resume_id);
        // Similarity comes from the real pgvector cosine distance, not the mock.
        $this->assertEqualsWithDelta(1.0, $match->similarity, 0.001);
    }
}
