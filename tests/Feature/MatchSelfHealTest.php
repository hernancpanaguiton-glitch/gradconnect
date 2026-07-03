<?php

namespace Tests\Feature;

use App\Jobs\ScoreJobMatchesForJob;
use App\Jobs\ScoreJobMatchesForProfile;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use App\Services\EmbeddingService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

/**
 * "Refresh matches / recommendations" must generate a missing embedding
 * before scoring, otherwise seeded/unembedded records never match.
 */
class MatchSelfHealTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function mockEmbeddingUnavailable(): void
    {
        // No vector produced → the embedding job marks the record failed
        // (avoids writing a pgvector column that SQLite lacks) while still
        // proving the embedding step ran.
        $this->mock(EmbeddingService::class, function (Mockery\MockInterface $mock) {
            $mock->shouldReceive('embed')->andReturn(null);
        });
    }

    public function test_scoring_a_job_generates_its_missing_embedding_first(): void
    {
        $this->mockEmbeddingUnavailable();

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()
            ->create(['embedding_status' => 'pending']);

        ScoreJobMatchesForJob::dispatchSync($posting->id);

        // The posting's embedding was attempted (status moved off "pending").
        $this->assertSame('failed', $posting->refresh()->embedding_status);
    }

    public function test_scoring_a_profile_generates_its_resume_embedding_first(): void
    {
        Storage::fake('local');
        $this->mockEmbeddingUnavailable();

        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);
        $resume = Resume::factory()->for($profile)->create([
            'is_primary' => true,
            'embedding_status' => 'pending',
        ]);

        ScoreJobMatchesForProfile::dispatchSync($profile->id);

        $this->assertNotSame('pending', $resume->refresh()->embedding_status);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
