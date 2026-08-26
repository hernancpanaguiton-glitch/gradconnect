<?php

namespace Tests\Feature\Admin;

use App\Models\Company;
use App\Models\EmployerFeedback;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\MatchFeedback;
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
                ->where('feedbackHelpfulRate', null)
                ->where('feedbackTotal', 0)
                ->where('hireCalibration.sampleSize', 0)
            );
    }

    /**
     * Every AI job and notification is ShouldQueue, so a stopped worker makes
     * the whole system silently do nothing. That has to be visible.
     */
    public function test_a_backlog_with_no_consumer_is_reported_as_stalled(): void
    {
        $admin = User::factory()->admin()->create();

        DB::table('jobs')->insert([
            'queue' => 'default', 'payload' => '{}', 'attempts' => 0,
            'reserved_at' => null,
            'available_at' => now()->subMinutes(30)->timestamp,
            'created_at' => now()->subMinutes(30)->timestamp,
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('queueStalled', true)
                ->where('queueReserved', 0)
                ->where('queueOldestWaitMinutes', 30)
            );
    }

    public function test_a_job_currently_being_worked_is_not_reported_as_stalled(): void
    {
        $admin = User::factory()->admin()->create();

        DB::table('jobs')->insert([
            'queue' => 'default', 'payload' => '{}', 'attempts' => 1,
            'reserved_at' => now()->timestamp,
            'available_at' => now()->subMinutes(30)->timestamp,
            'created_at' => now()->subMinutes(30)->timestamp,
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page->where('queueStalled', false));
    }

    public function test_a_freshly_queued_job_is_not_reported_as_stalled(): void
    {
        $admin = User::factory()->admin()->create();

        DB::table('jobs')->insert([
            'queue' => 'default', 'payload' => '{}', 'attempts' => 0,
            'reserved_at' => null,
            'available_at' => now()->timestamp,
            'created_at' => now()->timestamp,
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page->where('queueStalled', false));
    }

    public function test_an_empty_queue_is_not_reported_as_stalled(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('queueStalled', false)
                ->where('queueOldestWaitMinutes', null)
            );
    }

    public function test_feedback_helpful_rate_and_provider_breakdown_are_computed(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $postingA = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        $postingB = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        $postingC = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $matchGroq1 = JobMatchResult::create(['job_posting_id' => $postingA->id, 'graduate_profile_id' => $profile->id, 'fit_score' => 80, 'scored_by' => 'groq']);
        $matchGroq2 = JobMatchResult::create(['job_posting_id' => $postingB->id, 'graduate_profile_id' => $profile->id, 'fit_score' => 40, 'scored_by' => 'groq']);
        $matchGemini = JobMatchResult::create(['job_posting_id' => $postingC->id, 'graduate_profile_id' => $profile->id, 'fit_score' => 60, 'scored_by' => 'gemini']);

        $rater = $profile->user;
        MatchFeedback::create(['job_match_result_id' => $matchGroq1->id, 'user_id' => $rater->id, 'rating' => 'helpful']);
        MatchFeedback::create(['job_match_result_id' => $matchGroq2->id, 'user_id' => $rater->id, 'rating' => 'not_helpful']);
        MatchFeedback::create(['job_match_result_id' => $matchGemini->id, 'user_id' => $rater->id, 'rating' => 'helpful']);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('feedbackTotal', 3)
                ->where('feedbackHelpfulRate', 67)
                ->has('helpfulRateByProvider', 2)
            );
    }

    public function test_hire_calibration_correlates_fit_score_with_employer_rating(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        JobMatchResult::create(['job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id, 'fit_score' => 90]);
        $application = JobApplication::create([
            'job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id,
            'status' => 'hired', 'applied_at' => now(),
        ]);
        EmployerFeedback::create([
            'company_id' => $company->id, 'job_application_id' => $application->id, 'graduate_profile_id' => $profile->id,
            'submitted_by_user_id' => $partner->id, 'overall_rating' => 5,
        ]);

        $this->actingAs($admin)->get(route('admin.platform-status'))
            ->assertInertia(fn ($page) => $page
                ->where('hireCalibration.sampleSize', 1)
                ->where('hireCalibration.avgFitScore', 90)
                ->where('hireCalibration.avgEmployerRating', 5)
            );
    }
}
