<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TalentSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function candidate(string $first, string $last, ?string $skill = null): GraduateProfile
    {
        $user = User::factory()->alumni()->create(['first_name' => $first, 'last_name' => $last]);
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);
        if ($skill) {
            $profile->skills()->attach(Skill::findOrCreateByName($skill)->id, ['source' => 'self']);
        }

        return $profile;
    }

    public function test_partner_can_open_talent_search(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $this->candidate('Maria', 'Santos');

        $this->actingAs($partner)
            ->get(route('talent-search'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('TalentSearch')->has('candidates.data', 1));
    }

    public function test_search_filters_by_skill(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $this->candidate('Maria', 'Santos', 'Kubernetes');
        $this->candidate('James', 'Ramos', 'Photoshop');

        $this->actingAs($partner)
            ->get(route('talent-search', ['search' => 'Kubernetes']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates.data', 1)
                ->where('candidates.data.0.user.name', 'Maria Santos'));
    }

    public function test_with_resume_filter_excludes_candidates_without_one(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $this->candidate('No', 'Resume');

        $this->actingAs($partner)
            ->get(route('talent-search', ['with_resume' => 1]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('candidates.data', 0));
    }

    public function test_graduate_without_permission_is_forbidden(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->get(route('talent-search'))
            ->assertForbidden();
    }
}
