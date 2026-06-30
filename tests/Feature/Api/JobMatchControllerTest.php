<?php

namespace Tests\Feature\Api;

use App\Jobs\ScoreJobMatchesForJob;
use App\Jobs\ScoreJobMatchesForProfile;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class JobMatchControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makePartnerPosting(): array
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        return [$partner, $posting];
    }

    public function test_the_owning_partner_can_trigger_a_rematch_for_their_posting(): void
    {
        Queue::fake();

        [$partner, $posting] = $this->makePartnerPosting();

        $this->actingAs($partner)
            ->postJson("/api/jobs/{$posting->id}/rematch")
            ->assertOk()
            ->assertJson(['status' => 'queued']);

        Queue::assertPushed(ScoreJobMatchesForJob::class, fn ($job) => $job->jobPostingId === $posting->id);
    }

    public function test_a_different_partner_cannot_trigger_a_rematch_for_someone_elses_posting(): void
    {
        Queue::fake();

        [, $posting] = $this->makePartnerPosting();
        $otherPartner = User::factory()->industryPartner()->create();

        $this->actingAs($otherPartner)
            ->postJson("/api/jobs/{$posting->id}/rematch")
            ->assertStatus(403);

        Queue::assertNotPushed(ScoreJobMatchesForJob::class);
    }

    public function test_alumni_cannot_trigger_a_rematch_for_a_posting(): void
    {
        Queue::fake();

        [, $posting] = $this->makePartnerPosting();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->postJson("/api/jobs/{$posting->id}/rematch")
            ->assertStatus(403);
    }

    public function test_job_status_reports_match_counts(): void
    {
        [$partner, $posting] = $this->makePartnerPosting();
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $posting->matchResults()->create([
            'graduate_profile_id' => $profile->id,
            'similarity' => 0.5,
            'fit_score' => 80,
            'scored_by' => 'groq',
            'scored_at' => now(),
        ]);

        $this->actingAs($partner)
            ->getJson("/api/jobs/{$posting->id}/rematch")
            ->assertOk()
            ->assertJson(['total_matches' => 1, 'scored' => 1]);
    }

    public function test_an_alumnus_can_trigger_a_rematch_for_their_own_profile(): void
    {
        Queue::fake();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)
            ->postJson('/api/me/rematch')
            ->assertOk()
            ->assertJson(['status' => 'queued']);

        Queue::assertPushed(ScoreJobMatchesForProfile::class, fn ($job) => $job->graduateProfileId === $profile->id);
    }

    public function test_an_alumnus_without_a_graduate_profile_cannot_trigger_a_rematch(): void
    {
        Queue::fake();

        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->postJson('/api/me/rematch')
            ->assertStatus(422);

        Queue::assertNotPushed(ScoreJobMatchesForProfile::class);
    }

    public function test_an_industry_partner_passes_the_permission_gate_but_is_rejected_for_lacking_a_graduate_profile(): void
    {
        [$partner] = $this->makePartnerPosting();

        $this->actingAs($partner)
            ->postJson('/api/me/rematch')
            ->assertStatus(422);
    }
}
