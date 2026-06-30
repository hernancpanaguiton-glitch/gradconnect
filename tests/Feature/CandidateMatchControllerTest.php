<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CandidateMatchControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makePartnerPosting(): array
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        return [$partner, $posting];
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_the_owning_partner_sees_ranked_candidates(): void
    {
        [$partner, $posting] = $this->makePartnerPosting();

        $low = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();
        $high = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $posting->matchResults()->create(['graduate_profile_id' => $low->id, 'similarity' => 0.3, 'fit_score' => 20]);
        $posting->matchResults()->create(['graduate_profile_id' => $high->id, 'similarity' => 0.95, 'fit_score' => 92]);

        $response = $this->actingAs($partner)->get("/postings/{$posting->id}/matches");

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Postings/Matches')
            ->has('matches', 2)
            ->where('matches.0.graduate_profile_id', $high->id)
            ->where('matches.1.graduate_profile_id', $low->id)
        );
    }

    public function test_a_different_partner_cannot_view_anothers_candidate_matches(): void
    {
        [, $posting] = $this->makePartnerPosting();
        $otherPartner = User::factory()->industryPartner()->create();

        $this->actingAs($otherPartner)->get("/postings/{$posting->id}/matches")->assertStatus(403);
    }

    public function test_alumni_cannot_view_candidate_matches(): void
    {
        [, $posting] = $this->makePartnerPosting();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get("/postings/{$posting->id}/matches")->assertStatus(403);
    }
}
