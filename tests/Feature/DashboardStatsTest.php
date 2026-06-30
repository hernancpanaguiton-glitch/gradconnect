<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_dashboard_reports_the_total_user_count(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->alumni()->count(3)->create();

        // 1 admin + 3 alumni = 4 users
        $this->actingAs($admin)->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->component('Dashboards/AdminDashboard')
                ->where('stats.0.label', 'Total Users')
                ->where('stats.0.value', 4)
            );
    }

    public function test_industry_partner_dashboard_counts_their_open_postings(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->count(2)->create();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->closed()->create();

        $this->actingAs($partner)->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->component('Dashboards/IndustryPartnerDashboard')
                ->where('stats.0.label', 'Active Postings')
                ->where('stats.0.value', 2)
            );
    }

    public function test_alumni_dashboard_counts_active_applications(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $posting->applications()->create(['graduate_profile_id' => $profile->id, 'status' => 'submitted', 'applied_at' => now()]);
        $posting->applications()->create(['graduate_profile_id' => GraduateProfile::factory()->for(User::factory()->alumni()->create(), 'user')->create()->id, 'status' => 'submitted', 'applied_at' => now()]);

        // The alumnus has exactly one application of their own (index 2 = "Applications").
        $this->actingAs($alumni)->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->component('Dashboards/AlumniDashboard')
                ->where('stats.2.label', 'Applications')
                ->where('stats.2.value', 1)
            );
    }
}
