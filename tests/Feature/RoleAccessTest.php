<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_unauthenticated_user_is_redirected_from_dashboard(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_suspended_user_is_blocked(): void
    {
        $user = User::factory()->suspended()->alumni()->create();

        $this->actingAs($user)->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_pending_user_is_blocked(): void
    {
        $user = User::factory()->pending()->alumni()->create();

        $this->actingAs($user)->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_admin_can_access_user_management(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/users')->assertOk();
    }

    public function test_admin_can_access_roles_page(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/roles')->assertOk();
    }

    public function test_alumni_cannot_access_admin_users(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/admin/users')->assertStatus(403);
    }

    public function test_industry_partner_cannot_access_admin_users(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get('/admin/users')->assertStatus(403);
    }

    public function test_alumni_can_access_job_board(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/jobs')->assertOk();
    }

    public function test_alumni_can_access_graduate_profile_edit(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/graduate/profile/edit')->assertOk();
    }

    public function test_alumni_can_access_resumes(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/graduate/resumes')->assertOk();
    }

    public function test_industry_partner_cannot_access_graduate_profile(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get('/graduate/profile/edit')->assertStatus(403);
    }

    public function test_industry_partner_can_access_company_edit(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get('/company/edit')->assertOk();
    }

    public function test_industry_partner_can_access_postings(): void
    {
        $partner = User::factory()->industryPartner()->create();
        Company::factory()->for($partner, 'owner')->create();

        $this->actingAs($partner)->get('/postings')->assertOk();
    }

    public function test_alumni_cannot_access_postings(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/postings')->assertStatus(403);
    }

    public function test_alumni_can_see_surveys_list(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/surveys')->assertOk();
    }

    public function test_alumni_affairs_can_see_surveys_list(): void
    {
        $staff = User::factory()->alumniAffairs()->create();

        $this->actingAs($staff)->get('/surveys')->assertOk();
    }

    public function test_alumni_affairs_can_access_employability_report(): void
    {
        $staff = User::factory()->alumniAffairs()->create();

        $this->actingAs($staff)->get('/reports/employability')->assertOk();
    }

    public function test_department_head_can_access_employability_report(): void
    {
        $deptHead = User::factory()->departmentHead()->create();

        $this->actingAs($deptHead)->get('/reports/employability')->assertOk();
    }

    public function test_alumni_cannot_access_employability_report(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/reports/employability')->assertStatus(403);
    }
}
