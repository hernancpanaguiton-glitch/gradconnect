<?php

namespace Tests\Feature\Matching;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use App\Services\VectorSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Exercises the real pgvector `<=>` cosine operator. Skipped on SQLite
 * (the default test driver, which has no vector support), so run it with a
 * PostgreSQL + pgvector test database:
 *
 *   DB_CONNECTION=pgsql DB_DATABASE=gradconnect_test php artisan test \
 *       tests/Feature/Matching/VectorSearchPostgresTest.php
 *
 * IMPORTANT: point this at a dedicated test database — RefreshDatabase
 * migrates fresh and will wipe whatever DB it connects to.
 */
class VectorSearchPostgresTest extends TestCase
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

    /**
     * @return array<int, float>
     */
    private function vector(float $fill, int $dims = 768): array
    {
        return array_fill(0, $dims, $fill);
    }

    private function makeOpenPostingWithEmbedding(array $vector): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create([
            'embedding_status' => 'done',
        ]);

        $this->setEmbedding('job_postings', $posting->id, $vector);

        return $posting;
    }

    private function makeProfileWithEmbeddedResume(array $vector): array
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();
        $resume = Resume::factory()->for($profile)->create([
            'is_primary' => true,
            'embedding_status' => 'done',
        ]);

        $this->setEmbedding('resumes', $resume->id, $vector);

        return [$profile, $resume];
    }

    public function test_nearest_resumes_to_job_are_ordered_by_cosine_similarity(): void
    {
        $job = $this->makeOpenPostingWithEmbedding($this->vector(1.0));

        // Near-identical direction -> high similarity.
        [$closeProfile, $closeResume] = $this->makeProfileWithEmbeddedResume($this->vector(0.95));

        // Mostly-orthogonal vector -> low similarity.
        $orthogonal = $this->vector(0.0);
        $orthogonal[0] = 1.0;
        [$farProfile, $farResume] = $this->makeProfileWithEmbeddedResume($orthogonal);

        $results = (new VectorSearch)->nearestResumesToJob($job, 10);

        $this->assertCount(2, $results);
        $this->assertSame($closeResume->id, $results[0]->resume_id);
        $this->assertSame($farResume->id, $results[1]->resume_id);
        $this->assertGreaterThan($results[1]->similarity, $results[0]->similarity);
        $this->assertEqualsWithDelta(1.0, $results[0]->similarity, 0.001);
    }

    public function test_nearest_resumes_only_includes_primary_embedded_resumes(): void
    {
        $job = $this->makeOpenPostingWithEmbedding($this->vector(1.0));

        // Embedded but NOT primary -> excluded.
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();
        $secondary = Resume::factory()->for($profile)->create(['is_primary' => false, 'embedding_status' => 'done']);
        $this->setEmbedding('resumes', $secondary->id, $this->vector(0.9));

        // Primary but NOT embedded -> excluded.
        Resume::factory()->for($profile)->create(['is_primary' => true, 'embedding_status' => 'pending']);

        $results = (new VectorSearch)->nearestResumesToJob($job, 10);

        $this->assertCount(0, $results);
    }

    public function test_nearest_jobs_to_profile_are_ordered_and_skip_closed_postings(): void
    {
        [$profile, $resume] = $this->makeProfileWithEmbeddedResume($this->vector(1.0));

        $closeJob = $this->makeOpenPostingWithEmbedding($this->vector(0.97));

        $farVector = $this->vector(0.0);
        $farVector[0] = 1.0;
        $farJob = $this->makeOpenPostingWithEmbedding($farVector);

        // Closed posting must be excluded even with a near-identical embedding.
        $closed = $this->makeOpenPostingWithEmbedding($this->vector(0.99));
        $closed->update(['status' => 'closed']);

        $results = (new VectorSearch)->nearestJobsToProfile($profile, 10);

        $this->assertCount(2, $results);
        $this->assertSame($closeJob->id, $results[0]->job_posting_id);
        $this->assertSame($farJob->id, $results[1]->job_posting_id);
    }

    public function test_nearest_jobs_to_profile_without_a_primary_resume_returns_empty(): void
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $results = (new VectorSearch)->nearestJobsToProfile($profile, 10);

        $this->assertTrue($results->isEmpty());
    }
}
