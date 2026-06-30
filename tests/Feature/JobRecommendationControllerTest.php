<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobRecommendationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makeOpenPosting(): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
    }

    public function test_alumni_without_a_profile_sees_an_empty_state(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/recommendations')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Recommendations/Index')
                ->where('hasProfile', false)
                ->has('matches', 0)
            );
    }

    public function test_alumni_sees_their_ranked_matches_ordered_by_fit_score(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        Resume::factory()->for($profile)->create(['is_primary' => true]);

        $lowFit = $this->makeOpenPosting();
        $highFit = $this->makeOpenPosting();
        $unscored = $this->makeOpenPosting();

        $profile->matchResults()->create(['job_posting_id' => $lowFit->id, 'similarity' => 0.4, 'fit_score' => 30]);
        $profile->matchResults()->create(['job_posting_id' => $highFit->id, 'similarity' => 0.9, 'fit_score' => 88]);
        $profile->matchResults()->create(['job_posting_id' => $unscored->id, 'similarity' => 0.6, 'fit_score' => null]);

        $response = $this->actingAs($alumni)->get('/recommendations');

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Recommendations/Index')
            ->where('hasProfile', true)
            ->has('matches', 3)
            ->where('matches.0.job_posting_id', $highFit->id)
            ->where('matches.1.job_posting_id', $lowFit->id)
            ->where('matches.2.job_posting_id', $unscored->id)
        );
    }

    public function test_matches_for_closed_postings_are_excluded(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        Resume::factory()->for($profile)->create(['is_primary' => true]);

        $closed = $this->makeOpenPosting();
        $closed->update(['status' => 'closed']);
        $profile->matchResults()->create(['job_posting_id' => $closed->id, 'similarity' => 0.9, 'fit_score' => 90]);

        $this->actingAs($alumni)->get('/recommendations')
            ->assertInertia(fn ($page) => $page->has('matches', 0));
    }

    public function test_industry_partner_cannot_view_recommendations(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get('/recommendations')->assertStatus(403);
    }
}
