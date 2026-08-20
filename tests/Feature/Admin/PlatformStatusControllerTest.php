<?php

namespace Tests\Feature\Admin;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PlatformStatusControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_non_admin_is_forbidden(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('admin.platform-status'))->assertForbidden();
    }

    public function test_admin_sees_queue_and_failed_job_counts(): void
    {
        $admin = User::factory()->admin()->create();

        DB::table('failed_jobs')->insert([
            'uuid' => (string) \Illuminate\Support\Str::uuid(), 'connection' => 'database',
            'queue' => 'default', 'payload' => '{}', 'exception' => 'boom', 'failed_at' => now(),
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/PlatformStatus')
                ->where('failedJobsCount', 1)
                ->has('recentFailedJobs', 1)
            );
    }

    public function test_embedding_and_scoring_success_rates_are_computed(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        Resume::create([
            'graduate_profile_id' => $profile->id, 'original_filename' => 'a.pdf', 'path' => 'resumes/a.pdf',
            'embedding_status' => 'done',
        ]);
        Resume::create([
            'graduate_profile_id' => $profile->id, 'original_filename' => 'b.pdf', 'path' => 'resumes/b.pdf',
            'embedding_status' => 'failed',
        ]);

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $postingA = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        $postingB = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        JobMatchResult::create([
            'job_posting_id' => $postingA->id, 'graduate_profile_id' => $profile->id,
            'fit_score' => 80, 'scored_by' => 'groq',
        ]);
        JobMatchResult::create([
            'job_posting_id' => $postingB->id, 'graduate_profile_id' => $profile->id,
            'resume_id' => null, 'fit_score' => null, 'scored_by' => null,
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('embeddingSuccessRate', 50)
                ->where('matchScoringSuccessRate', 50)
            );
    }

    public function test_rates_are_null_when_there_is_no_data(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('embeddingSuccessRate', null)
                ->where('matchScoringSuccessRate', null)
            );
    }
}
