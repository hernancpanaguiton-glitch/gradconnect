<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GlobalSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_short_queries_return_no_results(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson(route('search', ['q' => 'a']))
            ->assertOk()
            ->assertJson(['users' => [], 'candidates' => [], 'jobs' => [], 'surveys' => []]);
    }

    public function test_admin_can_find_user_accounts(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->alumni()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);

        $this->actingAs($admin)
            ->getJson(route('search', ['q' => 'Maria']))
            ->assertOk()
            ->assertJsonCount(1, 'users')
            ->assertJsonPath('users.0.title', 'Maria Santos');
    }

    public function test_graduate_cannot_search_user_accounts(): void
    {
        $alumni = User::factory()->alumni()->create();
        User::factory()->alumni()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);

        $this->actingAs($alumni)
            ->getJson(route('search', ['q' => 'Maria']))
            ->assertOk()
            ->assertJsonCount(0, 'users');
    }

    public function test_industry_partner_can_find_candidates_but_not_accounts(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $grad = User::factory()->alumni()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);
        GraduateProfile::factory()->create(['user_id' => $grad->id]);

        $this->actingAs($partner)
            ->getJson(route('search', ['q' => 'Maria']))
            ->assertOk()
            ->assertJsonCount(1, 'candidates')
            ->assertJsonCount(0, 'users')
            ->assertJsonPath('candidates.0.title', 'Maria Santos');
    }

    public function test_any_authenticated_role_can_find_open_jobs(): void
    {
        $student = User::factory()->student()->create();
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create(['title' => 'Backend Engineer']);
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->closed()->create(['title' => 'Backend Manager']);

        $this->actingAs($student)
            ->getJson(route('search', ['q' => 'Backend']))
            ->assertOk()
            ->assertJsonCount(1, 'jobs')
            ->assertJsonPath('jobs.0.title', 'Backend Engineer');
    }

    public function test_survey_manager_finds_any_matching_survey(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        Survey::factory()->for($aao, 'createdBy')->create(['title' => 'Career Readiness Poll', 'status' => 'draft']);

        $this->actingAs($aao)
            ->getJson(route('search', ['q' => 'Readiness']))
            ->assertOk()
            ->assertJsonCount(1, 'surveys');
    }

    public function test_respondent_only_finds_open_surveys(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        Survey::factory()->for($aao, 'createdBy')->create(['title' => 'Draft Readiness Poll', 'status' => 'draft']);
        Survey::factory()->for($aao, 'createdBy')->create(['title' => 'Open Readiness Poll', 'status' => 'open']);

        $this->actingAs($alumni)
            ->getJson(route('search', ['q' => 'Readiness']))
            ->assertOk()
            ->assertJsonCount(1, 'surveys')
            ->assertJsonPath('surveys.0.title', 'Open Readiness Poll');
    }
}
