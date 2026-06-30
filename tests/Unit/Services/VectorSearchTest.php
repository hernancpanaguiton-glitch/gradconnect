<?php

namespace Tests\Unit\Services;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\VectorSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VectorSearchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * pgvector has no SQLite equivalent, so VectorSearch must no-op rather
     * than attempt the `<=>` operator against a driver that doesn't support
     * it. Real nearest-neighbor ordering is verified against Postgres
     * directly (see Task 13 / AI matching tests).
     */
    public function test_nearest_resumes_to_job_returns_empty_on_unsupported_drivers(): void
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        $results = (new VectorSearch)->nearestResumesToJob($posting);

        $this->assertTrue($results->isEmpty());
    }

    public function test_nearest_jobs_to_profile_returns_empty_on_unsupported_drivers(): void
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $results = (new VectorSearch)->nearestJobsToProfile($profile);

        $this->assertTrue($results->isEmpty());
    }
}
