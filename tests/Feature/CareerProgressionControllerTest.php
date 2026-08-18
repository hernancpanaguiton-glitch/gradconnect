<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CareerProgressionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_graduate_without_a_profile_sees_an_empty_state(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('career-progression'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('CareerProgression')
                ->where('hasProfile', false)
                ->has('records', 0)
            );
    }

    public function test_employment_records_are_returned_current_and_most_recent_first(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $profile->employmentRecords()->create([
            'company_name' => 'Old Corp', 'job_title' => 'Junior Dev',
            'employment_type' => 'full_time', 'is_current' => false,
            'start_date' => '2021-01-01', 'end_date' => '2022-01-01',
        ]);
        $profile->employmentRecords()->create([
            'company_name' => 'New Corp', 'job_title' => 'Senior Dev',
            'employment_type' => 'full_time', 'is_current' => true,
            'start_date' => '2022-02-01', 'end_date' => null,
        ]);

        $this->actingAs($alumni)->get(route('career-progression'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasProfile', true)
                ->has('records', 2)
                ->where('records.0.company_name', 'New Corp')
                ->where('records.0.is_current', true)
                ->where('records.1.company_name', 'Old Corp')
            );
    }

    public function test_graduate_does_not_see_another_graduates_employment_records(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $other = User::factory()->alumni()->create();
        $otherProfile = GraduateProfile::factory()->for($other, 'user')->create();
        $otherProfile->employmentRecords()->create([
            'company_name' => 'Other Corp', 'job_title' => 'Dev',
            'employment_type' => 'full_time', 'is_current' => true, 'start_date' => '2023-01-01',
        ]);

        $this->actingAs($alumni)->get(route('career-progression'))
            ->assertInertia(fn ($page) => $page->has('records', 0));
    }

    public function test_industry_partner_is_forbidden(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('career-progression'))->assertForbidden();
    }
}
